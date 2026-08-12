import { ModulePage } from "@/components/pages/ModulePage";
import { FeeForm } from "@/components/forms/EntityForms";
import { payments } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";

export default function FeesPage() {
  return (
    <ModulePage
      title="Fees Management"
      description="Fee structure, monthly/term/yearly setup, collection, paid/pending/overdue states, receipts, Stripe-ready payments, and WhatsApp reminders."
      rows={payments.map((payment) => ({ student: payment.student, amount: formatCurrency(payment.amount), date: payment.date, method: payment.method, status: payment.status }))}
      role="accountant"
    >
      <FeeForm />
    </ModulePage>
  );
}
