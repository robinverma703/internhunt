"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approvePayment } from "@/lib/actions/approve-payment";

type Payment = {
  id: string;
  user_id: string;
  payment_id: string;
  amount: number;
  status: string;
  userEmail: string;
};

export default function AdminPaymentsReview({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(paymentId: string, userId: string) {
    setLoadingId(paymentId);
    const result = await approvePayment(paymentId, userId);
    setLoadingId(null);

    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-line/70 p-6 text-sm text-muted">
        Koi pending payment nahi hai abhi.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line/70 p-6">
      <h2 className="text-lg font-semibold text-graphite">Pending Payments</h2>
      <div className="mt-4 space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-md border border-line/50 p-4"
          >
            <div>
              <p className="text-sm font-medium text-graphite">{payment.userEmail}</p>
              <p className="text-xs text-muted">UTR: {payment.payment_id}</p>
              <p className="text-xs text-muted">Amount: ₹{payment.amount / 100}</p>
            </div>
            <Button
              onClick={() => handleApprove(payment.id, payment.user_id)}
              disabled={loadingId === payment.id}
            >
              {loadingId === payment.id ? "Approving..." : "Approve"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}