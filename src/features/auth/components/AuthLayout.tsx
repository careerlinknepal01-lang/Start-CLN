import { Link } from "react-router-dom";

type AuthLayoutProps = {
  heading: string;
  tagline: string;
  footnote?: React.ReactNode;
  children: React.ReactNode;
};

// Replace this with your actual logo path.
// Example: "/careerlink-logo.png"
const LOGO_SRC = "/cln.png";

export function AuthLayout({
  heading,
  tagline,
  footnote,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F9FC] text-[#08275F]">
      {/* ================================================================
          BACKGROUND - Clean & Minimal
      ================================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Soft ambient gradients for a "little design" feel without clutter */}
        <div className="absolute -left-48 -top-48 h-[620px] w-[620px] rounded-full bg-blue-100/35 blur-[100px]" />
        <div className="absolute -bottom-48 left-[24%] h-[500px] w-[500px] rounded-full bg-amber-100/25 blur-[110px]" />
        <div className="absolute right-[-220px] top-[20%] h-[560px] w-[560px] rounded-full bg-blue-100/25 blur-[120px]" />
      </div>

      {/* ================================================================
          MAIN CONTENT
      ================================================================= */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] items-start pt-[8vh] sm:pt-[10vh] lg:pt-[12vh] px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div
          className="
            grid
            w-full
            grid-cols-1
            items-start
            gap-12
            lg:grid-cols-[minmax(0,1fr)_minmax(400px,500px)]
            lg:gap-16
            xl:grid-cols-[minmax(0,1fr)_500px]
            xl:gap-24
          "
        >
          {/* ============================================================
              LEFT SIDE
          ============================================================= */}

          <section className="relative flex flex-col justify-start lg:min-h-[650px] lg:pt-4">
            {/* Logo */}
            <Link
              to="/"
              aria-label="CareerLink Nepal home"
              className="
                group
                relative
                z-20
                inline-flex
                w-fit
                rounded-lg
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#0B3D91]
                focus-visible:ring-offset-4
              "
            >
              <div className="flex h-[64px] w-[220px] items-center sm:h-[72px] sm:w-[250px]">
                <img
                  src={LOGO_SRC}
                  alt="CareerLink Nepal"
                  className="
                    max-h-[72px]
                    w-auto
                    max-w-full
                    object-contain
                    object-left
                    transition-transform
                    duration-200
                    group-hover:scale-[1.02]
                  "
                />
              </div>
            </Link>

            {/* Main brand message */}
            <div className="relative z-20 mt-9 sm:mt-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-[3px] w-9 rounded-full bg-[#D99319]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#647797]">
                  Nepal's Professional Network
                </span>
              </div>

              <h1
                className="
                  max-w-[620px]
                  text-[clamp(3.25rem,6vw,5.8rem)]
                  font-bold
                  leading-[0.92]
                  tracking-[-0.065em]
                  text-[#08275F]
                "
              >
                CareerLink
                <br />
                Nepal
              </h1>

              <p className="mt-6 text-lg font-semibold tracking-[-0.025em] sm:text-xl">
                <span className="text-[#08275F]">Connect.</span>{" "}
                <span className="text-[#0797A6]">Learn.</span>{" "}
                <span className="text-[#D99319]">Grow.</span>
              </p>

              <p className="mt-4 max-w-[430px] text-[15px] leading-6 text-[#596D8B] sm:text-base sm:leading-7">
                Nepal's professional network for students and young
                professionals.
              </p>
            </div>
          </section>

          {/* ============================================================
              RIGHT SIDE — AUTH CARD
          ============================================================= */}

          <section className="relative z-20 flex w-full justify-center lg:justify-end items-start lg:pt-4">
            <div
              className="
                w-full
                max-w-[500px]
                rounded-[24px]
                border
                border-[#E7ECF3]
                bg-white
                p-6
                shadow-[0_20px_60px_rgba(8,39,95,0.09)]
                sm:p-8
                lg:p-9
              "
            >
              {/* Auth header */}
              <div className="mb-7">
                <div className="mb-5 h-[3px] w-10 rounded-full bg-[#D99319]" />

                <h2
                  className="
                    text-[28px]
                    font-bold
                    leading-tight
                    tracking-[-0.035em]
                    text-[#08275F]
                    sm:text-[32px]
                  "
                >
                  {heading}
                </h2>

                <p className="mt-2 max-w-[390px] text-sm leading-6 text-[#687A95] sm:text-[15px]">
                  {tagline}
                </p>
              </div>

              {/* Existing Login / Signup content */}
              <div className="auth-content">
                {children}
              </div>

              {/* Footnote */}
              {footnote && (
                <div className="mt-7 border-t border-[#E8EDF4] pt-5">
                  <p className="text-center text-[11px] leading-5 text-[#7A889D]">
                    {footnote}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}