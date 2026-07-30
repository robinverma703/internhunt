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
  ai_status?: string | null;
  ai_reason?: string | null;
  screenshot_url?: string | null;
  auto_approve_at?: string | null;
};

function AiBadge({ aiStatus }: { aiStatus?: string | null }) {
  if (!aiStatus || aiStatus === "pending") {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        AI checking…
      </span>
    );
  }
  if (aiStatus === "verified") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        AI verified ✓
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      AI flagged ⚠
    </span>
  );
}

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
            className="flex flex-col gap-3 rounded-md border border-line/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-graphite">{payment.userEmail}</p>
                <AiBadge aiStatus={payment.ai_status} />
              </div>
              <p className="mt-1 text-xs text-muted">UTR: {payment.payment_id}</p>
              <p className="text-xs text-muted">Amount: ₹{payment.amount / 100}</p>
              {payment.ai_reason && (
                <p className="mt-1 text-xs italic text-muted">AI: {payment.ai_reason}</p>
              )}
              {payment.screenshot_url && (
                <a
                  href={payment.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-signal underline"
                >
                  Screenshot dekho
                </a>
              )}
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