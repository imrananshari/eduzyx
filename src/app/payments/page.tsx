import { ModulePage } from "@/components/pages/ModulePage";
import { payments } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";

export default function PaymentsPage() {
  return (
    <ModulePage
      title="Payments"
      description="Stripe-ready transaction history with payment success/failure routes and receipt generation placeholders."
      rows={payments.map((payment) => ({ transaction: payment.id, student: payment.student, amount: formatCurrency(payment.amount), date: payment.date, status: payment.status }))}
      role="accountant"
    />
  );
}
