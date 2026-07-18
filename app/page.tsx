import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/site-footer";
import FloatingCompanies from "@/components/floating-companies";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Filter, ShieldCheck, Zap } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Filter,
    title: "Hand-checked, not scraped and dumped",
    body: "Every listing is reviewed before it goes live. No expired links, no ghost postings.",
  },
  {
    icon: Zap,
    title: "Built to feel instant",
    body: "Server-rendered feed, no spinners on the jobs that matter most.",
  },
  {
    icon: ShieldCheck,
    title: "One payment, no subscriptions",
    body: "₹99 unlocks the full feed for good. No recurring charges, no upsells.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper">
      <Navbar />
      <Hero />
      <FloatingCompanies />

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-graphite md:text-3xl">
          Why InternHunt over a raw job board
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="hover:shadow-card-hover">
              <CardContent className="pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-signal-dim text-signal">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-display text-base font-semibold text-graphite">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-3xl px-6 py-20">
        <Card className="border-signal/20 bg-gradient-to-b from-signal-dim/60 to-surface">
          <CardContent className="flex flex-col items-center gap-6 py-14 text-center">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-signal-deep shadow-card">
              Simple pricing
            </span>
            <div>
              <span className="text-5xl font-semibold tracking-tight text-graphite">₹99</span>
              <span className="ml-2 text-muted">one-time</span>
            </div>
            <ul className="grid gap-2 text-sm text-graphite">
              {[
                "Full access to the curated feed",
                "Search & filter by role, stipend, category",
                "New listings added continuously",
                "WhatsApp & Telegram support",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-mint" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login" data-cursor-hover>
              <Button variant="signal" size="lg">Get started</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  );
}