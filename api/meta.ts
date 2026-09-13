import type { IncomingMessage, ServerResponse } from "http";
import { getMetaUserDataFromRequest, sendMetaCapiEvent } from "../server/meta-capi.js";

type MetaEventRequest = {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: {
    fbp?: string;
    fbc?: string;
    external_id?: string;
  };
  custom_data?: Record<string, unknown>;
};

async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body) return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { message: "Method not allowed" });
    return;
  }

  try {
    const body = (await readBody(req)) as MetaEventRequest;
    if (!body?.event_name) {
      sendJson(res, 400, { message: "event_name is required" });
      return;
    }

    const headers = req.headers as unknown as Record<string, unknown>;
    const user_data = getMetaUserDataFromRequest({
      headers,
      eventSourceUrl: body.event_source_url,
      browserUserData: body.user_data,
    });

    const result = await sendMetaCapiEvent({
      event_name: body.event_name,
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      user_data,
      custom_data: body.custom_data ?? {},
    });

    sendJson(res, 200, { ok: true, result });
  } catch (error) {
    console.error("Meta CAPI event failed:", error);
    sendJson(res, 500, { ok: false });
  }
}
