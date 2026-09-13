export type OrderProtectionDecision = "review" | "block";

export class OrderProtectionError extends Error {
  readonly decision: OrderProtectionDecision;
  readonly retryable: boolean;
  readonly statusCode: number;

  constructor(decision: OrderProtectionDecision, retryable: boolean, statusCode = decision === "block" ? 403 : 202) {
    super(decision === "block"
      ? "Could not place the order. Please check your details and try again."
      : "Your order needs a quick confirmation before it can be completed.");
    this.name = "OrderProtectionError";
    this.decision = decision;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

export type OrderProcessResult =
  | { orderRef: string; decision?: "allow" }
  | { decision: "review"; reviewId: string };
