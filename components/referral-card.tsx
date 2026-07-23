"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReferralCardProps {
  referralLink: string;
  referralCount: number;
  earnings: number;
}

export default function ReferralCard({ referralLink, referralCount, earnings }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (older browsers, insecure context) — fail silently,
      // the link is still visible in the input for manual copy.
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Refer & earn</CardTitle>
        <CardDescription>
          Share your link. When a friend joins and goes premium, you get ₹20.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            readOnly
            value={referralLink}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 flex-1 rounded-full border border-line bg-paper px-4 text-sm text-graphite focus:outline-none"
          />
          <Button variant="signal" size="default" onClick={handleCopy} className="sm:w-32">
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>

        <div className="mt-6 flex gap-8">
          <div>
            <p className="text-2xl font-semibold text-graphite">{referralCount}</p>
            <p className="text-sm text-muted">Friends referred</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-graphite">₹{earnings}</p>
            <p className="text-sm text-muted">Total earned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}