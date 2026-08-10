import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Globe,
  HeartHandshake,
  Layers,
  Lightbulb,
  MessageSquare,
  Network,
  Quote,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/features/admin/hooks/useAdminAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ── Data ────────────────────────────────────────────────────────────────── */

const cyclingWords = ["network", "community", "opportunity", "career"];

const stats = [
  { label: "Active Students", value: "2500", icon: Users },
  { label: "Campus Communities", value: "40", icon: BookOpen },
  { label: "Events Hosted", value: "200", icon: CalendarDays },
  { label: "Connections Made", value: "15000", icon: Network },
];

const problem = [
  "Nepal has 600,000+ undergraduate students across 1,000+ colleges — but no dedicated space to find peers outside your campus, share opportunities, or build a professional network before graduation.",
  "LinkedIn works if you already have a network. Facebook groups are noisy. Campus bulletin boards don't reach beyond your college gate.",
  "CLN is the first platform built specifically to solve this — a student-only network where your college, field, and interests actually matter.",
];

const features = [
  {
    term: "Network by college and field",
    desc: "Find students from your college or across Nepal who share your field, skills, and career interests — not a random feed of strangers.",
    icon: Users,
  },
  {
    term: "Opportunities that reach you",
    desc: "Internships, projects, and job openings posted by peers and campus recruiters. Apply inside the app. No third-party portals.",
    icon: ShieldCheck,
  },
  {
    term: "Communities you actually join",
    desc: "Campus groups, hackathon teams, study circles, and interest-based communities. Structured enough to be useful, casual enough to feel natural.",
    icon: Layers,
  },
  {
    term: "Messaging that means something",
    desc: "Chat with your connections, share updates, and collaborate — without leaving the platform. No spam, no DMs from recruiters you never met.",
    icon: MessageSquare,
  },
  {
    term: "Reputation you can show",
    desc: "XP, achievements, and activity history build a profile that proves what you've done. Share it with employers, not a PDF resume that nobody reads.",
    icon: Star,
  },
];

const steps = [
  {
    number: "01",
    title: "Create your profile",
    desc: "Sign up with your college email, add your field, skills, and interests. Takes under 2 minutes.",
    icon: School,
  },
  {
    number: "02",
    title: "Discover your people",
    desc: "Browse students, communities, and events tailored to your college, field, and career goals.",
    icon: Search,
  },
  {
    number: "03",
    title: "Connect and collaborate",
    desc: "Send connection requests, join communities, attend events, and start working together.",
    icon: HeartHandshake,
  },
  {
    number: "04",
    title: "Grow your career",
    desc: "Share achievements, apply to opportunities, and build a professional network that lasts beyond graduation.",
    icon: TrendingUp,
  },
];

const testimonials = [
  {
    quote: "I found out about a hackathon 2 days before registration closed, joined with a team I met through CLN, and we won. That simply would not have happened without this platform.",
    name: "Bibek Thapa",
    role: "BE Civil, IOE Pulchowk",
    initials: "BT",
    location: "Lalitpur",
  },
  {
    quote: "I shared my internship experience on the feed and got questions from 10+ students across three colleges. It is the closest thing we have to a national student network.",
    name: "Priya Maharjan",
    role: "BBA, Pokhara University",
    initials: "PM",
    location: "Pokhara",
  },
  {
    quote: "The events section helped me discover workshops and networking sessions I would never have known about. Three months in, I have made more meaningful connections than my entire first two years of college.",
    name: "Aarav Shrestha",
    role: "BSc CSIT, Tribhuvan University",
    initials: "AS",
    location: "Kathmandu",
  },
];

/* ── Hooks ───────────────────────────────────────────────────────────────── */

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const next = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (Math.abs(next - progressRef.current) > 0.1) {
        progressRef.current = next;
        setProgress(next);
      }
      frameRef.current = null;
    };
    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return progress;
}

function useAnimatedCounter(target: number, isVisible: boolean) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    startRef.current = null;
    const raf = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / 2200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) window.requestAnimationFrame(raf);
      else setCount(target);
    };
    window.requestAnimationFrame(raf);
  }, [isVisible, target]);

  return count;
}

/* ── Components ──────────────────────────────────────────────────────────── */

function Reveal({
  children,
  className = "",
  delay = 0,
  axis = "y",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  axis?: "y" | "x" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    axis === "y" ? "translateY(12px)" : axis === "x" ? "translateX(12px)" : "none";

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : hiddenTransform,
        transitionDelay: `${delay}ms`,
        transitionProperty: "opacity, transform",
        transitionDuration: "600ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function AnimatedStatCard({ item, index }: { item: typeof stats[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useAnimatedCounter(Number(item.value.replace(/[^0-9]/g, "")), visible);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="border-r border-border/40 last:border-r-0 px-5 first:pl-0 last:pr-0">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] bg-primary/5">
          <item.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {visible ? count.toLocaleString() : "0"}
            <span className="text-accent">+</span>
          </div>
          <div className="text-xs text-muted-foreground tracking-wide uppercase">{item.label}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

const Landing = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdminAuth();
  const navigate = useNavigate();
  const primaryHref = user ? "/feed" : "/signup";
  const progress = useScrollProgress();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % cyclingWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  /* ── 3D tilt for hero card ── */
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  }, []);
  const resetTilt = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <div className="force-light bg-[hsl(35,20%,97%)] text-foreground">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* Scroll progress */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent" aria-hidden="true">
        <div
          className="h-full bg-accent"
          style={{
            width: `${progress}%`,
            transitionProperty: "width",
            transitionDuration: "150ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "bg-[hsl(35,20%,97%)]/85 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        } ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
      >
        <div className="mx-auto flex max-w-[1060px] items-center justify-between px-6 sm:px-8 lg:px-10 h-16">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[3px]"
            aria-label="CareerLink Nepal home"
          >
            <img src="/cln.png" alt="" className="h-7 w-7 object-contain" />
            <span className="font-bold text-sm tracking-tight text-inherit">
              CareerLink <span className="text-accent">Nepal</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <a
              href="#how-it-works"
              className={`px-3 py-2 text-[13px] tracking-wide uppercase hover:text-inherit ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}
            >
              How it works
            </a>
            <a
              href="#features"
              className={`px-3 py-2 text-[13px] tracking-wide uppercase hover:text-inherit ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}
            >
              Features
            </a>
            <a
              href="#testimonials"
              className={`px-3 py-2 text-[13px] tracking-wide uppercase hover:text-inherit ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}
            >
              Students
            </a>
            <div className={`w-px h-4 mx-3 ${scrolled ? "bg-border" : "bg-primary-foreground/20"}`} />
            {user ? (
              <div className="flex items-center gap-2">
                {!isAdminLoading && isAdmin && (
                  <Button asChild
                    variant="outline" 
                    size="sm" 
                    style={{ borderRadius: "4px" }} 
                    className={`text-xs font-semibold tracking-wide uppercase px-3 h-8 ${scrolled ? "text-muted-foreground hover:text-foreground border-border/50" : "text-primary-foreground/70 hover:text-primary-foreground border-primary-foreground/20"}`}
                  >
                    <Link to="/admin">Admin Panel</Link>
                  </Button>
                )}
                <Button asChild size="sm" style={{ borderRadius: "4px" }} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold tracking-wide uppercase px-4 h-8 shadow-sm">
                  <Link to="/feed">Open app</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" style={{ borderRadius: "4px" }} className={`text-xs font-semibold tracking-wide uppercase px-3 h-8 ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" style={{ borderRadius: "4px" }} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold tracking-wide uppercase px-4 h-8 shadow-sm">
                  <Link to="/signup">Join free</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className={`md:hidden grid h-9 w-9 place-items-center rounded-[3px] ${scrolled ? "hover:bg-secondary/60" : "hover:bg-primary-foreground/10"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l10 10M14 4L4 14"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h12M3 9h12M3 14h12"/></svg>
            )}
          </button>
        </div>

        {/* Mobile overlay */}
        <div
          className={`md:hidden fixed inset-0 z-[55] bg-[hsl(35,20%,97%)] text-foreground overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between px-6 h-16">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="CareerLink Nepal home"
            >
              <img src="/cln.png" alt="" className="h-7 w-7 object-contain" />
              <span className="font-bold text-sm tracking-tight">
                CareerLink <span className="text-accent">Nepal</span>
              </span>
            </Link>
            <button
              className="grid h-9 w-9 place-items-center rounded-[2px] hover:bg-secondary/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l10 10M14 4L4 14"/>
              </svg>
            </button>
          </div>

          <nav className="px-8 pt-10 pb-8" aria-label="Mobile navigation">
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#features", label: "Features" },
              { href: "#testimonials", label: "Students" },
            ].map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="group block py-5 border-b border-border/30 last:border-b-0"
                style={{
                  transitionDelay: mobileMenuOpen ? `${i * 80}ms` : "0ms",
                }}
              >
                <span className="font-display text-[clamp(1.5rem,5vw,2.2rem)] font-bold text-foreground group-hover:text-accent transition-colors duration-200">
                  {link.label}
                </span>
              </a>
            ))}
          </nav>

          <div className="px-8 pb-10">
            <div className="pt-8 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground mb-5 tracking-[0.15em] uppercase">
                2,500+ students on CLN
              </p>
              <div className="flex flex-col gap-3">
                {user ? (
                  <div className="flex flex-col gap-3">
                    {!isAdminLoading && isAdmin && (
                      <Button asChild
                        variant="outline" 
                        style={{ borderRadius: "4px" }} 
                        className="w-full text-sm font-semibold h-11"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to="/admin">Admin Panel</Link>
                      </Button>
                    )}
                    <Button asChild style={{ borderRadius: "4px" }} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold h-11">
                      <Link to="/feed" onClick={() => setMobileMenuOpen(false)}>Open app</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button asChild style={{ borderRadius: "4px" }} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold h-11 shadow-sm">
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Join CLN — free</Link>
                    </Button>
                    <Button asChild variant="outline" style={{ borderRadius: "4px" }} className="w-full text-sm font-semibold h-11">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ═══════════════════════════════════════════════════════════════
            HERO
           ═══════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-primary" aria-labelledby="hero-heading">
          {/* Clean background — no gradients, no orbs, no grid lines */}
          <div className="absolute inset-0" style={{ background: "hsl(220, 70%, 18%)" }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,hsl(22,95%,55%,0.08),transparent_60%)]" />

          <div className="container relative z-10 pt-28 pb-20">
            <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_1fr]" style={{ maxWidth: "1060px", margin: "0 auto" }}>
              {/* Left: copy */}
              <div>
                <Reveal delay={80} axis="y">
                  <div
                    className="inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-primary-foreground/80"
                    style={{ borderRadius: "2px", borderColor: "hsl(var(--primary-foreground)/0.2)", background: "hsl(var(--primary-foreground)/0.06)" }}
                  >
                    <Sparkles className="h-3 w-3 text-accent" aria-hidden="true" />
                    For Nepali undergraduates
                  </div>
                </Reveal>

                <Reveal delay={150} axis="y">
                  <h1
                    id="hero-heading"
                    className="mt-6 font-display text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[1.08] tracking-tight text-primary-foreground"
                  >
                    The student{" "}
                    <span className="relative inline-flex flex-col h-[1.08em] overflow-hidden text-accent align-top">
                      <span className="sr-only">{cyclingWords[activeWord]}</span>
                      <span className="block relative" aria-hidden="true">
                        {cyclingWords.map((word, i) => (
                          <span
                            key={word}
                            className="block"
                            style={{
                              transform: `translateY(${-activeWord * 100}%)`,
                              transitionProperty: "transform",
                              transitionDuration: "500ms",
                              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                          >
                            {word}
                          </span>
                        ))}
                      </span>
                    </span>{" "}
                    for Nepal.
                  </h1>
                </Reveal>

                <Reveal delay={250} axis="y">
                  <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-primary-foreground/75 md:text-lg">
                    A student-only network for Nepali undergraduates. Create a profile,
                    find peers by college and field, join communities, discover events,
                    and build a career network before you graduate.
                  </p>
                </Reveal>

                <Reveal delay={350} axis="y">
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      style={{ borderRadius: "4px" }}
                      className="group relative bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold h-11 px-6 shadow-sm"
                    >
                      <Link to={primaryHref}>
                        {user ? "Go to feed" : "Join CLN — it's free"}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      style={{ borderRadius: "4px", borderColor: "hsl(var(--primary-foreground)/0.25)" }}
                      className="bg-primary-foreground/8 text-primary-foreground hover:bg-primary-foreground/12 text-sm font-semibold h-11 px-6"
                    >
                      <Link to={user ? "/explore" : "/login"}>
                        {user ? "Explore network" : "Sign in"}
                      </Link>
                    </Button>
                  </div>
                </Reveal>

                <Reveal delay={420} axis="y">
                  <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-primary-foreground/65">
                    {["Free for all students", "No spam", "Nepal-focused"].map((item) => (
                      <span key={item} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                        {item}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </div>

              {/* Right: profile card */}
              <div className="hidden lg:block">
                <Reveal delay={280} axis="none">
                  <div style={{ perspective: "1000px" }}>
                    <div
                      ref={cardRef}
                      onMouseMove={handlePointerMove}
                      onMouseLeave={resetTilt}
                      style={{
                        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                        borderRadius: "0",
                        transitionProperty: "transform",
                        transitionDuration: "300ms",
                        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      className="relative border border-primary-foreground/15 bg-primary-foreground/8 shadow-xl"
                    >
                      <div className="bg-background text-foreground">
                        <div className="h-20 bg-primary" />
                        <div className="px-6 pb-6 -mt-10">
                          <div
                            className="h-20 w-20 border-4 border-background bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl"
                            style={{ borderRadius: "2px" }}
                          >
                            TNS
                          </div>
                          <div className="font-semibold text-sm mt-3">Tapendra Narayan Acharya</div>
                          <div className="text-xs text-muted-foreground mt-0.5">BSc CSIT · Tribhuvan University</div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {["React", "Python", "UI/UX", "Node.js"].map((skill) => (
                              <span key={skill} className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5" style={{ borderRadius: "2px" }}>
                                {skill}
                              </span>
                            ))}
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {[
                              { label: "Connections", value: "48" },
                              { label: "Posts", value: "12" },
                              { label: "Events", value: "5" },
                            ].map((stat) => (
                              <div key={stat.label} className="bg-secondary/50 py-2 text-center" style={{ borderRadius: "2px" }}>
                                <div className="text-sm font-bold text-primary">{stat.value}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 border-t border-border pt-3 space-y-2">
                            {[
                              { emoji: "🏆", text: "Won Hack-a-thon 2024" },
                              { emoji: "🚀", text: "Building NepalTask" },
                              { emoji: "💼", text: "Open to internship opportunities" },
                            ].map((item) => (
                              <div key={item.text} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="shrink-0">{item.emoji}</span>
                                <span className="line-clamp-1">{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div
                        className="absolute -right-3 -top-3 flex items-center gap-1.5 bg-accent text-accent-foreground px-2.5 py-1 text-[11px] font-semibold shadow-md"
                        style={{ borderRadius: "2px" }}
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-foreground/60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                        </span>
                        Live network
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            STATS BAND
           ═══════════════════════════════════════════════════════════════ */}
        <section aria-label="Platform statistics">
          <div className="mx-auto" style={{ maxWidth: "1060px", padding: "0 2rem" }}>
            <div
              className="-mt-7 border border-border/50 bg-[hsl(35,20%,97%)]/95 backdrop-blur-md px-8 py-6 shadow-sm"
              style={{ borderRadius: "0" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-y-6">
                {stats.map((item, i) => (
                  <AnimatedStatCard key={item.label} item={item} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            PROBLEM
           ═══════════════════════════════════════════════════════════════ */}
        <section className="py-28 md:py-36" aria-label="The problem CLN solves">
          <div className="mx-auto" style={{ maxWidth: "660px", padding: "0 2rem" }}>
            <Reveal axis="y">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent">The problem</span>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground">
                Nepal has 600,000 undergraduate students. No network connects them.
              </h2>
            </Reveal>

            <div className="mt-8 space-y-5">
              {problem.map((paragraph, i) => (
                <Reveal key={i} axis="y" delay={i * 80}>
                  <p className="text-base leading-[1.8] text-muted-foreground">{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FEATURES — Asymmetric list
           ═══════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 md:py-32 bg-background border-t border-border/40" aria-labelledby="features-heading">
          <div className="mx-auto" style={{ maxWidth: "1060px", padding: "0 2rem" }}>
            <Reveal axis="y">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent">What CLN does</span>
              <h2 id="features-heading" className="mt-4 font-display text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                Built for how students
                <br />
                actually network.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-x-14 gap-y-0 md:grid-cols-[5fr_3fr]">
              <div>
                <dl className="divide-y divide-border/50">
                  {features.map((f, i) => (
                    <Reveal key={f.term} axis="y" delay={i * 60}>
                      <div className="py-6 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="grid h-8 w-8 shrink-0 place-items-center bg-accent/10 mt-0.5" style={{ borderRadius: "2px" }}>
                            <f.icon className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <dt className="font-semibold text-sm text-foreground">{f.term}</dt>
                            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</dd>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </dl>
              </div>

              {/* Right column — quiet counterpoint */}
              <Reveal axis="y" delay={200}>
                <div className="hidden md:block mt-6">
                  <div className="border border-border/40 bg-muted/20 px-6 py-8" style={{ borderRadius: "0" }}>
                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">The difference</p>
                    <div className="mt-5 space-y-4">
                      {[
                        { label: "LinkedIn", verdict: "Built for professionals, not students" },
                        { label: "Facebook groups", verdict: "Noisy, unstructured, full of spam" },
                        { label: "CLN", verdict: "Student-only, college-aware, built for Nepal" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3">
                          <span className={`text-xs font-bold uppercase tracking-wide shrink-0 w-24 ${item.label === "CLN" ? "text-accent" : "text-muted-foreground/60"}`}>
                            {item.label}
                          </span>
                          <span className={`text-xs leading-relaxed ${item.label === "CLN" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {item.verdict}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            HOW IT WORKS
           ═══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-24 md:py-32" style={{ background: "hsl(35, 20%, 96%)" }} aria-labelledby="how-it-works-heading">
          <div className="mx-auto" style={{ maxWidth: "660px", padding: "0 2rem" }}>
            <Reveal axis="y" className="text-center">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent">How it works</span>
              <h2 id="how-it-works-heading" className="mt-4 font-display text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                Four steps to your
                <br />
                student network.
              </h2>
            </Reveal>

            <div className="mt-14 space-y-12">
              {steps.map((step, i) => (
                <Reveal key={step.number} axis="y" delay={i * 70}>
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center bg-primary text-primary-foreground text-sm font-bold"
                        style={{ borderRadius: "2px" }}
                      >
                        {step.number}
                      </div>
                      {i < steps.length - 1 && <div className="w-px flex-1 bg-border/60 mt-3" aria-hidden="true" />}
                    </div>
                    <div className={i < steps.length - 1 ? "pb-4" : ""}>
                      <div className="grid h-8 w-8 place-items-center bg-accent/10 mb-3" style={{ borderRadius: "2px" }}>
                        <step.icon className="h-4 w-4 text-accent" />
                      </div>
                      <h3 className="font-semibold text-base text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-w-[48ch]">{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            TESTIMONIALS — Single strong quotes, no carousel
           ═══════════════════════════════════════════════════════════════ */}
        <section id="testimonials" className="py-24 md:py-32 bg-background border-t border-border/40" aria-labelledby="testimonials-heading">
          <div className="mx-auto" style={{ maxWidth: "860px", padding: "0 2rem" }}>
            <Reveal axis="y" className="text-center">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent">Students</span>
              <h2 id="testimonials-heading" className="mt-4 font-display text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                What students say.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
             Thousands of students across Nepal are already building their careers on CLN.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} axis="y" delay={i * 80}>
                  <div className="border border-border/50 bg-card px-6 py-7 h-full flex flex-col" style={{ borderRadius: "0" }}>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-[1.8] text-muted-foreground flex-1">"{t.quote}"</p>
                    <footer className="mt-5 pt-4 border-t border-border/40 flex items-center gap-3">
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center bg-primary text-primary-foreground text-xs font-bold"
                        style={{ borderRadius: "2px" }}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-foreground">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">{t.role}</div>
                      </div>
                    </footer>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CTA
           ═══════════════════════════════════════════════════════════════ */}
        <section className="py-28 md:py-36 bg-primary" aria-labelledby="cta-heading">
          <div className="mx-auto text-center" style={{ maxWidth: "600px", padding: "0 2rem" }}>
            <Reveal axis="y">
              <span
                className="inline-flex items-center gap-2 border border-primary-foreground/15 px-3 py-1 text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-foreground/80"
                style={{ borderRadius: "2px", background: "hsl(var(--primary-foreground)/0.06)" }}
              >
                <Sparkles className="h-3 w-3 text-accent" />
                2,500+ students already on CLN
              </span>
            </Reveal>

            <Reveal axis="y" delay={100}>
              <h2 id="cta-heading" className="mt-6 font-display text-3xl md:text-4xl font-bold leading-tight tracking-tight text-primary-foreground">
                Ready to build your network?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75 mx-auto max-w-[44ch]">
                Create a profile, find your people, and start building a career network
                that actually reflects what you study and who you are.
              </p>
            </Reveal>

            <Reveal axis="y" delay={200}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  style={{ borderRadius: "4px" }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold h-11 px-6 shadow-sm"
                >
                  <Link to={primaryHref}>
                    {user ? "Open CLN" : "Join CareerLink Nepal — Free"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                {!user && (
                  <Button
                    asChild
                    variant="outline"
                    style={{ borderRadius: "4px", borderColor: "hsl(var(--primary-foreground)/0.25)" }}
                    className="bg-primary-foreground/8 text-primary-foreground hover:bg-primary-foreground/12 text-sm font-semibold h-11 px-6"
                  >
                    <Link to="/login">
                      Sign in
                      <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════════════════════ */}
      <footer className="bg-background border-t border-border/40">
        <div className="mx-auto py-16" style={{ maxWidth: "1060px", padding: "3rem 2rem" }}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-3" aria-label="CareerLink Nepal home">
                <img src="/cln.png" alt="" className="h-7 w-7 object-contain" />
                <span className="font-bold text-sm tracking-tight">
                  CareerLink <span className="text-accent">Nepal</span>
                </span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[32ch]">
                The student career network connecting undergraduates across Nepal.
              </p>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-foreground mb-4">Platform</h4>
              <ul className="space-y-2.5">
                <li><a href="#how-it-works" className="text-xs text-muted-foreground hover:text-foreground">How it works</a></li>
                <li><a href="#features" className="text-xs text-muted-foreground hover:text-foreground">Features</a></li>
                <li><Link to="/feed" className="text-xs text-muted-foreground hover:text-foreground">Feed</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-foreground mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/about" className="text-xs text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link to="/contact" className="text-xs text-muted-foreground hover:text-foreground">Contact</Link></li>
                <li><Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-foreground mb-4">Connect</h4>
              <ul className="space-y-2.5">
                {["Twitter", "LinkedIn", "Instagram"].map((s) => (
                  <li key={s}>
                    <a href="#" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      {s} <ArrowUpRight className="h-2.5 w-2.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground tracking-wide">
              &copy; {new Date().getFullYear()} CareerLink Nepal
            </p>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" aria-hidden="true" /> Made in Nepal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
