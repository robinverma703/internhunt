"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Trophy,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Building2,
  GraduationCap,
} from "lucide-react";
import type { HackathonRow } from "@/app/hackathons/page";

const CATEGORY_STYLES: Record<string, { chip: string; glow: string; icon: JSX.Element }> = {
  College: {
    chip: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
    glow: "group-hover:shadow-[0_0_50px_-10px_rgba(129,140,248,0.5)]",
    icon: <GraduationCap size={14} />,
  },
  Corporate: {
    chip: "bg-amber-400/15 text-amber-300 border-amber-300/30",
    glow: "group-hover:shadow-[0_0_50px_-10px_rgba(251,191,36,0.55)]",
    icon: <Building2 size={14} />,
  },
  Open: {
    chip: "bg-teal-400/15 text-teal-300 border-teal-300/30",
    glow: "group-hover:shadow-[0_0_50px_-10px_rgba(45,212,191,0.5)]",
    icon: <Users size={14} />,
  },
};

const MODE_DOT: Record<string, string> = {
  Online: "bg-emerald-400",
  Offline: "bg-rose-400",
  Hybrid: "bg-violet-400",
};

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Animated tech-network canvas background: glowing nodes drifting slowly,
 * connected by lines when close — the classic "hackathon/tech" moving backdrop.
 * Pure canvas, no external assets, no libraries.
 */
function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationId: number;

    const COLORS = ["#F2C94C", "#B48CFF", "#5EEAD4", "#F2C94C"]; // gold, violet, teal, gold-weighted

    type Node = { x: number; y: number; vx: number; vy: number; r: number; color: string };
    let nodes: Node[] = [];

    function resize() {
      width = canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      height = canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      canvas!.style.width = canvas!.offsetWidth + "px";

      const count = Math.min(70, Math.floor((canvas!.offsetWidth * canvas!.offsetHeight) / 18000));
      nodes = Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35 * window.devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.35 * window.devicePixelRatio,
        r: (1 + Math.random() * 1.8) * window.devicePixelRatio,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);
      const linkDist = 150 * window.devicePixelRatio;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx!.strokeStyle = `rgba(180,160,255,${(1 - dist / linkDist) * 0.18})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = n.color;
        ctx!.shadowColor = n.color;
        ctx!.shadowBlur = 8 * window.devicePixelRatio;
        ctx!.fill();
      }

      animationId = requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}

type Particle = { left: number; size: number; delay: number; duration: number; drift: number; color: string };

/** Generates particles only in the browser, after mount — avoids server/client mismatch. */
function useParticles(count: number) {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    const colors = ["#F2C94C", "#B48CFF", "#5EEAD4"];
    const list: Particle[] = Array.from({ length: count }).map(() => ({
      left: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      delay: Math.random() * 12,
      duration: 9 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(list);
  }, [count]);
  return particles;
}

/** Self-contained ambient pad generator — no audio file needed. */
function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const [playing, setPlaying] = useState(false);

  function start() {
    if (ctxRef.current) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(master);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const freqs = [110, 138.59, 164.81, 220];
    const nodes = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 6;
      const gain = ctx.createGain();
      gain.gain.value = 0.18 / freqs.length;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      return { osc, gain };
    });
    nodesRef.current = nodes;

    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
    setPlaying(true);
  }

  function stop() {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => {
      nodesRef.current.forEach((n) => n.osc.stop());
      ctx.close();
      ctxRef.current = null;
      masterGainRef.current = null;
      nodesRef.current = [];
    }, 1100);
    setPlaying(false);
  }

  function toggle() {
    if (playing) stop();
    else start();
  }

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        nodesRef.current.forEach((n) => {
          try {
            n.osc.stop();
          } catch {}
        });
        ctxRef.current.close();
      }
    };
  }, []);

  return { playing, toggle };
}

function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }
  return (
    <div
      onMouseMove={onMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-300/30 ${className ?? ""}`}
      style={{ ["--mx" as any]: "50%", ["--my" as any]: "50%" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px circle at var(--mx) var(--my), rgba(251,191,36,0.15), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function HackathonsShowcase({ hackathons }: { hackathons: HackathonRow[] }) {
  const [category, setCategory] = useState<"All" | "College" | "Corporate" | "Open">("All");
  const [query, setQuery] = useState("");
  const { playing, toggle } = useAmbientSound();
  const particles = useParticles(60);

  const filtered = useMemo(() => {
    return hackathons.filter((h) => {
      if (category !== "All" && h.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${h.title} ${h.organizer} ${h.location ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [hackathons, category, query]);

  const counts = useMemo(() => {
    const c = { All: hackathons.length, College: 0, Corporate: 0, Open: 0 };
    for (const h of hackathons) {
      if (h.category === "College") c.College++;
      else if (h.category === "Corporate") c.Corporate++;
      else c.Open++;
    }
    return c;
  }, [hackathons]);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <style>{`
        @keyframes rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-115vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-glow { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        @keyframes hue-drift { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(25deg); } }
        .shimmer-text {
          background-size: 250% auto;
          animation: shimmer 3s ease-in-out infinite;
        }
        .ring-spin {
          animation: spin-slow 6s linear infinite;
        }
        .sweep-line {
          animation: sweep 2.5s ease-in-out infinite;
        }
        .mesh-bg {
          animation: hue-drift 12s ease-in-out infinite;
        }
      `}</style>

      {/* Rich colorful gradient mesh backdrop */}
      <div
        className="mesh-bg fixed inset-0 -z-30"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(180,140,255,0.35), transparent 45%)," +
            "radial-gradient(circle at 85% 15%, rgba(242,201,76,0.28), transparent 45%)," +
            "radial-gradient(circle at 50% 90%, rgba(94,234,212,0.22), transparent 50%)," +
            "linear-gradient(160deg, #0B0A1F 0%, #150E2E 45%, #0A0714 100%)",
        }}
      />

      {/* Animated tech network */}
      <NetworkBackground />

      {/* Rising colorful particles */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 6px 1px ${p.color}`,
              animation: `rise ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
              ["--drift" as any]: `${p.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0A1F]/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="text-[17px] font-semibold tracking-tight text-white">
            Intern<span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Hunt</span>
          </a>
          <button
            onClick={toggle}
            aria-label={playing ? "Mute ambient sound" : "Play ambient sound"}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
              playing
                ? "border-amber-300/50 bg-amber-400/15 text-amber-200"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            {playing ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
            {playing ? "Ambience on" : "Play ambience"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-8 pt-16 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-8 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/20 blur-[100px]"
          style={{ animation: "pulse-glow 5s ease-in-out infinite" }}
        />
        <div className="relative mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-300">
          <span
            className="ring-spin pointer-events-none absolute -inset-1 rounded-full opacity-70"
            style={{
              background: "conic-gradient(from 0deg, transparent, rgba(251,191,36,0.8), transparent 40%)",
            }}
          />
          <Sparkles size={13} className="animate-pulse" />
          Curated hackathons, verified daily
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Build something.{" "}
          <span className="shimmer-text bg-gradient-to-r from-amber-200 via-violet-300 to-teal-200 bg-clip-text text-transparent">
            Win something.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60 sm:text-base">
          Every live hackathon across India&rsquo;s colleges, universities, and corporates —
          hand-checked, in one feed.
        </p>

        <div className="mx-auto mt-8 h-px w-40 overflow-hidden bg-white/10">
          <div className="sweep-line h-full w-1/3 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["All", "College", "Corporate", "Open"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  category === c
                    ? "border-amber-300/50 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-6px_rgba(251,191,36,0.6)]"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08]"
                }`}
              >
                {c} <span className="opacity-50">({counts[c]})</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, college, city..."
              className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-300/40"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {filtered.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-amber-300/15 bg-white/[0.04] p-12 text-center">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-[70px]"
              style={{ animation: "pulse-glow 4s ease-in-out infinite" }}
            />
            <Trophy className="mx-auto mb-3 text-amber-300/80" size={30} />
            <p className="text-white/70">
              {hackathons.length === 0
                ? "No hackathons live yet — the daily agent is still discovering them. Check back soon."
                : "No hackathons match your filters right now."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => {
              const style = CATEGORY_STYLES[h.category] ?? CATEGORY_STYLES.Open;
              const regDays = daysUntil(h.registration_deadline);
              return (
                <SpotlightCard key={h.id} className={`p-5 ${style.glow}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.chip}`}>
                      {style.icon}
                      {h.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-white/50">
                      <span className={`h-1.5 w-1.5 rounded-full ${MODE_DOT[h.mode] ?? "bg-white/40"}`} />
                      {h.mode}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold leading-snug text-white">{h.title}</h3>
                  <p className="mt-1 text-sm text-white/50">{h.organizer}</p>

                  <div className="mt-4 space-y-1.5 text-[12.5px] text-white/60">
                    {h.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-white/40" />
                        {h.location}
                      </div>
                    )}
                    {h.start_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-white/40" />
                        {formatDate(h.start_date)}
                        {h.end_date ? ` – ${formatDate(h.end_date)}` : ""}
                      </div>
                    )}
                    {h.prize && (
                      <div className="flex items-center gap-1.5">
                        <Trophy size={12} className="text-amber-300/70" />
                        {h.prize}
                      </div>
                    )}
                  </div>

                  {regDays !== null && regDays >= 0 && (
                    <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-rose-300">
                      {regDays === 0 ? "Registration closes today" : `${regDays} day${regDays === 1 ? "" : "s"} left to register`}
                    </div>
                  )}

                  <a
                    href={h.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 py-2.5 text-sm font-semibold text-[#1a1400] shadow-[0_4px_20px_-4px_rgba(251,191,36,0.5)] transition hover:brightness-110"
                  >
                    Register
                    <ExternalLink size={14} />
                  </a>
                </SpotlightCard>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}