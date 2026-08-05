import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata = {
  title: "FAQs | InternHunt",
};

const FAQS = [
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
  {
    q: "How can I contact for help?",
    a: 'You can reach out directly through the "Contact support" link in the footer if you face any issues.',
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-graphite md:text-4xl">
          Frequently Asked Questions
        </h1>

        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQS.map((item) => (
            <div key={item.q} className="px-6 py-6">
              <h3 className="font-medium text-graphite">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}