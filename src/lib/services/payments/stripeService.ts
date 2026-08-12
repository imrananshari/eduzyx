import type { PaymentIntentInput, PaymentIntentResult } from "./paymentTypes";

export async function createStripeCheckoutSession(input: PaymentIntentInput): Promise<PaymentIntentResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      checkoutUrl: `/payments/success?student=${input.studentId}&fee=${input.feeId}`,
      mocked: true
    };
  }

  throw new Error("Live Stripe checkout is intentionally disabled for the MVP UI layer.");
}
