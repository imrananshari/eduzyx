export type PaymentIntentInput = {
  studentId: string;
  feeId: string;
  amount: number;
  currency?: "inr" | "usd";
};

export type PaymentIntentResult = {
  checkoutUrl: string;
  mocked: boolean;
};
