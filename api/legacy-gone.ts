import type { IncomingMessage, ServerResponse } from "node:http";

const LEGACY_GONE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, follow" />
  <title>Product no longer available | Angonaloy-আঙ্গনালয়</title>
</head>
<body>
  <main>
    <h1>Product no longer available</h1>
    <p>This product is no longer available.</p>
    <p><a href="/products">Browse products</a></p>
  </main>
</body>
</html>`;

export function sendLegacyGone(res: ServerResponse) {
  res.statusCode = 410;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, follow");
  res.end(LEGACY_GONE_HTML);
}

export default function legacyGoneHandler(_req: IncomingMessage, res: ServerResponse) {
  sendLegacyGone(res);
}
