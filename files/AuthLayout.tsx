// ─── AuthLayout ───────────────────────────────────────────────────────────────
// Shared two-column layout used by both Login and Signup pages.
// Extracted to eliminate the duplicated markup that existed in both pages.
//
// The left panel (branding) is identical in structure; only the heading/tagline
// differs. The right panel renders children (the form card).

import { Link } from "react-router-dom";

type AuthLayoutProps = {
  heading: string;
  tagline: string;
  footnote: string;
  children: React.ReactNode;
};

export function AuthLayout({ heading, tagline, footnote, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden flex-col justify-between bg-[image:var(--gradient-hero)] p-10 text-primary-foreground md:flex">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 rounded"
          aria-label="CareerLink Nepal — home"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/20">
            <img
              src="/cln.png"
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
          </div>
          CareerLink Nepal
        </Link>

        <div>
          <h2 className="text-3xl font-bold">{heading}</h2>
          <p className="mt-2 text-primary-foreground/85">{tagline}</p>
        </div>

        <div className="text-sm text-primary-foreground/70">{footnote}</div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
