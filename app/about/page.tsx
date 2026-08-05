import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { section } from "framer-motion/m";

export const metadata = {
  title: "About | InternHunt",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-graphite md:text-4xl">
          Our Mission
        </h1>
        <h2 className="mt-2 font-display text-lg font-medium text-signal">
          Empowering Students to Build Their Careers
        </h2>
        <p className="mt-6 text-base leading-relaxed text-muted">
          InternHunt was created with a simple mission: to bridge the gap between
          ambitious students and real-world internship opportunities. As a
          student-built platform, we understand the struggle of searching for
          genuine, quality experience while managing college life. Our goal is
          to make the internship hunt transparent, accessible, and completely
          hassle-free for everyone.
        </p>

        <div className="mt-16 border-t border-line pt-16">
          <h1 className="text-3xl font-semibold tracking-tight text-graphite md:text-4xl">
            A Note from the Founder
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            &ldquo;Hey everyone! I built InternHunt because I saw my peers
            struggling to find reliable internships without getting lost in
            fake listings or complex portals. Being a student myself, I wanted
            to create a clean, straightforward space where anyone from our
            college community could easily find and apply for genuine
            opportunities. This platform is built by a student, for the
            students. I hope it helps you take that crucial first step towards
            your career!&rdquo;
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}