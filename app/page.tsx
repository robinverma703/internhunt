import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, IndianRupee, Sparkles, CheckCircle2, Filter, ShieldCheck, Zap } from "lucide-react";
import FeaturedInternship from "@/components/featured-internship";
import { getFeaturedJob } from "@/lib/get-featured-job";
import { createClient } from "@/lib/supabase/server";

const FAQ_PREVIEW = [
  {
    q: "Who can use InternHunt?",
    a: "It is specifically designed to help students discover and apply for relevant internships easily.",
  },
  {
    q: "Are the internship listings verified?",
    a: "Yes, we try our best to ensure the listings are authentic so students don't waste time on spam.",
  },
  {
    q: "Is there any fee to apply?",
    a: "No, browsing and applying for internships through this platform is completely free.",
  },
];

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
    title: "Completely free, no catch",
    body: "Full access to every listing — no payment, no hidden charges, ever.",
  },
];

export default async function LandingPage() {
  const featuredJob = await getFeaturedJob();

  const supabase = await createClient();
  const { data: allJobs } = await supabase.from("jobs").select("company");
  const totalListings = allJobs?.length ?? 0;
  const totalCompanies = new Set((allJobs ?? []).map((j) => j.company)).size;

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />
      <Hero />

      {featuredJob && <FeaturedInternship job={featuredJob} />}

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-signal">
          Trusted by students across India
        </p>
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            { icon: Briefcase, label: "Live listings", value: `${totalListings}+`, color: "text-signal", bg: "bg-signal-dim" },
            { icon: Building2, label: "Companies", value: `${totalCompanies}+`, color: "text-mint", bg: "bg-mint/15" },
            { icon: IndianRupee, label: "Cost to students", value: "₹0", color: "text-amber-500", bg: "bg-amber-100" },
            { icon: Sparkles, label: "New jobs added", value: "Daily", color: "text-violet-500", bg: "bg-violet-100" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface px-5 py-8 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}
              >
                <stat.icon size={22} />
              </div>
              <div className="mt-4 font-display text-3xl font-bold tracking-tight text-graphite md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-medium text-muted md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

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
              100% free
            </span>
            <div>
              <span className="text-5xl font-semibold tracking-tight text-graphite">₹0</span>
              <span className="ml-2 text-muted">· full access</span>
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

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-graphite md:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ_PREVIEW.map((item) => (
            <div key={item.q} className="px-6 py-6">
              <h3 className="font-medium text-graphite">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/faq" data-cursor-hover className="text-sm font-medium text-signal hover:underline">
            See all FAQs →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}