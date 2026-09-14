export type OrderProtectionDecision = "review" | "block";

export class OrderProtectionError extends Error {
  readonly decision: OrderProtectionDecision;
  readonly retryable: boolean;
  readonly statusCode: number;

  constructor(decision: OrderProtectionDecision, retryable: boolean, statusCode = 403) {
    super(decision === "block"
      ? "আপনার তথ্য যাচাই করা যায়নি। তথ্য ঠিক করে আবার চেষ্টা করুন।"
      : "আপনার অর্ডারটি নিশ্চিত করার জন্য আমাদের একটু সময় লাগছে।");
    this.name = "OrderProtectionError";
    this.decision = decision;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}
