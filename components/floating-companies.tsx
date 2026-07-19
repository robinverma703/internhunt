"use client";

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Deloitte", "TCS", "Infosys",
  "Adobe", "Flipkart", "Zomato", "Swiggy", "PwC", "EY",
];

const COMPANIES_ROW_2 = [
  "Accenture", "Wipro", "Paytm", "JPMorgan", "HSBC", "IBM",
  "Nestle", "Philips", "Mercedes", "Dell", "Motorola", "Canon",
];

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];

  return (
    <div className="relative flex overflow-hidden">
      <div
        className={`flex shrink-0 items-center gap-12 pr-12 ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="select-none whitespace-nowrap font-display text-2xl font-extrabold tracking-tight text-graphite/70 md:text-4xl"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FloatingCompanies() {
  return (
    <section className="relative overflow-hidden py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
        Where our users land internships
      </p>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper to-transparent"
        aria-hidden
      />

      <div className="mt-10 flex flex-col gap-6">
        <MarqueeRow items={COMPANIES} />
        <MarqueeRow items={COMPANIES_ROW_2} reverse />
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-reverse {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 28s linear infinite;
        }
      `}</style>
    </section>
  );
}