import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  OrderUpstreamError,
  processOrder,
  orderRequestSchema,
  type OrderRequest,
} from "./order-service.ts";

type RouteDependencies = {
  processOrder?: (order: OrderRequest) => Promise<{ orderRef: string }>;
};

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  dependencies: RouteDependencies = {},
): Promise<Server> {
  const process = dependencies.processOrder ?? processOrder;

  app.post("/api/orders", async (req, res, next) => {
    try {
      const order = orderRequestSchema.parse(req.body);
      const result = await process(order);

      res.status(201).json({ orderRef: result.orderRef });
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

      next(error);
    }
  });

  return httpServer;
}
