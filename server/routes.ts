import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  OrderUpstreamError,
  processOrder,
  orderRequestSchema,
  shouldSendMetaPurchase,
  type OrderRequest,
} from "./order-service.ts";
import { OrderProtectionError, type OrderProcessResult } from "./order-protection-errors.ts";
import {
  AbandonedCartUpstreamError,
  AbandonedCartValidationError,
  parseAbandonedCartCapture,
  processAbandonedCartCapture,
} from "./abandoned-cart-service.ts";
import { getMetaUserDataFromRequest, sendMetaCapiEvent } from "./meta-capi.ts";

type RouteDependencies = {
  processOrder?: (order: OrderRequest) => Promise<OrderProcessResult>;
  processAbandonedCartCapture?: typeof processAbandonedCartCapture;
  getMetaUserDataFromRequest?: typeof getMetaUserDataFromRequest;
  sendMetaCapiEvent?: typeof sendMetaCapiEvent;
};

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  dependencies: RouteDependencies = {},
): Promise<Server> {
  const process = dependencies.processOrder ?? processOrder;
  const processCapture = dependencies.processAbandonedCartCapture ?? processAbandonedCartCapture;
  const getMetaUserData = dependencies.getMetaUserDataFromRequest ?? getMetaUserDataFromRequest;
  const sendMetaEvent = dependencies.sendMetaCapiEvent ?? sendMetaCapiEvent;

  app.post("/api/meta", async (req, res, next) => {
    try {
      const body = req.body as {
        event_name?: string;
        event_id?: string;
        event_source_url?: string;
        user_data?: {
          fbp?: string;
          fbc?: string;
          external_id?: string;
        };
        custom_data?: Record<string, unknown>;
      };

      if (!body?.event_name) {
        res.status(400).json({ message: "event_name is required" });
        return;
      }

      const result = await sendMetaEvent({
        event_name: body.event_name,
        event_id: body.event_id,
        event_source_url: body.event_source_url,
        user_data: getMetaUserData({
          headers: req.headers as unknown as Record<string, unknown>,
          eventSourceUrl: body.event_source_url,
          browserUserData: body.user_data,
        }),
        custom_data: body.custom_data ?? {},
      });

      res.status(200).json({ ok: true, result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/abandoned-carts", async (req, res, next) => {
    try {
      const capture = parseAbandonedCartCapture(req.body);
      await processCapture(capture);
      res.status(202).json({ ok: true });
    } catch (error) {
      if (error instanceof AbandonedCartValidationError) {
        res.status(400).json({ ok: false, message: "Invalid checkout details" });
        return;
      }
      if (error instanceof AbandonedCartUpstreamError) {
        res.status(502).json({ ok: false, message: "Could not save checkout details. Please continue with your order." });
        return;
      }
      next(error);
    }
  });

  app.post("/api/orders", async (req, res, next) => {
    try {
      const order = orderRequestSchema.parse(req.body);
      const result = await process(order);
      const decision = result.decision ?? "allow";
      const orderRef = "orderRef" in result ? String(result.orderRef ?? "") : "";

      if (decision === "allow" && shouldSendMetaPurchase(order)) {
        // Fire-and-forget Purchase CAPI (do not block checkout).
        void sendMetaEvent({
          event_name: "Purchase",
          event_id: order.metaEventId,
          event_source_url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          user_data: getMetaUserData({
            headers: req.headers as unknown as Record<string, unknown>,
            customerName: order.customerName,
            phone: order.phone,
          }),
          custom_data: {
            currency: "BDT",
            value: order.bundlePrice + order.deliveryCharge,
            content_type: "product",
            contents: [{
              id: order.bundleTitle,
              quantity: order.quantity,
              item_price: order.bundlePrice / order.quantity,
            }],
            order_id: orderRef,
          },
        }).catch(() => {
          console.warn("Meta Purchase CAPI failed");
        });
      }

      if (decision === "review") {
        res.status(202).json({ decision: "review", reviewId: "reviewId" in result ? result.reviewId : "" });
        return;
      }
      res.status(201).json({ orderRef, decision: "allow" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid order details",
        });
        return;
      }

      if (error instanceof OrderUpstreamError) {
        res.status(502).json({ message: "Could not confirm order. Please try again." });
        return;
      }
      if (error instanceof OrderProtectionError) {
        res.status(error.statusCode).json({ message: error.message, decision: error.decision, retryable: error.retryable });
        return;
      }

      next(error);
    }
  });

  return httpServer;
}
