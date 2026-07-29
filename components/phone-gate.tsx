"use client";

import { useState } from "react";
import { savePhone } from "@/lib/actions/save-phone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PhoneGate() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await savePhone(phone);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <Card className="w-full max-w-sm">
        <CardContent className="py-8">
          <h2 className="text-lg font-semibold text-graphite">
            Ek aakhri step 👋
          </h2>
          <p className="mt-1 text-sm text-muted">
            WhatsApp pe naye internships ke updates paane ke liye apna number daalo.
          </p>
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10 digit mobile number"
              maxLength={10}
              required
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-signal"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" variant="signal" disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}