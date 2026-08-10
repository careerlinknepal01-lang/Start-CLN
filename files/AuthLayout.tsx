import { Link } from "react-router-dom";

type AuthLayoutProps = {
  heading: string;
  tagline: string;
  footnote: string;
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
      /* ================================================================
          NETWORK GRAPHIC
      ================================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
      >
        <svg
          className="absolute left-[-2%] top-[-4%] h-[108%] w-[57%] opacity-[0.72]"
          viewBox="0 0 900 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Main network lines */}
          <g
            stroke="#A8BCDA"
            strokeWidth="1"
            strokeOpacity="0.38"
          >
            <path d="M48 120L205 65L355 210L520 90L690 165" />
            <path d="M48 120L85 300L355 210" />
            <path d="M85 300L255 425L355 210" />
            <path d="M255 425L410 550L575 470L690 165" />
            <path d="M410 550L300 690L120 650" />
            <path d="M120 650L255 425" />
            <path d="M300 690L475 760L575 470" />
            <path d="M475 760L700 680L575 470" />
            <path d="M700 680L790 520L690 165" />
            <path d="M790 520L860 350L690 165" />
            <path d="M520 90L860 350" />
            <path d="M355 210L520 90" />
          </g>

          {/* Secondary lines */}
          <g
            stroke="#C2D0E4"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          >
            <path d="M0 420L255 425L520 90" />
            <path d="M120 650L410 550L860 350" />
            <path d="M205 65L690 165L700 680" />
            <path d="M85 300L575 470L475 760" />
          </g>

          {/* Navy nodes */}
          <circle cx="48" cy="120" r="6" fill="#08275F" />
          <circle cx="205" cy="65" r="6" fill="#08275F" />
          <circle cx="85" cy="300" r="7" fill="#08275F" />
          <circle cx="575" cy="470" r="6" fill="#08275F" />
          <circle cx="700" cy="680" r="6" fill="#08275F" />
          <circle cx="790" cy="520" r="6" fill="#08275F" />

          {/* Accent nodes */}
          <circle cx="355" cy="210" r="9" fill="#D99319" />
          <circle cx="120" cy="650" r="9" fill="#D99319" />
          <circle cx="475" cy="760" r="8" fill="#D99319" />

          {/* Light nodes */}
          <circle cx="520" cy="90" r="5" fill="#AFC5E5" />
          <circle cx="690" cy="165" r="6" fill="#B8CBE6" />
          <circle cx="255" cy="425" r="5" fill="#9DB7DD" />
          <circle cx="410" cy="550" r="5" fill="#B8CBE6" />
          <circle cx="300" cy="690" r="5" fill="#B8CBE6" />
          <circle cx="860" cy="350" r="5" fill="#B8CBE6" />
        </svg>

        {/* Network labels */}
        <span className="absolute left-[15%] top-[8%] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#08275F]/55">
          People
        </span>

        <span className="absolute left-[39%] top-[17%] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#08275F]/50">
          Opportunities
        </span>

        <span className="absolute left-[17%] top-[69%] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#08275F]/50">
          Communities
        </span>

        <span className="absolute left-[41%] top-[72%] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#08275F]/50">
          Growth
        </span>
      </div>

      {/* ================================================================
          DECORATIVE DOTS
      ================================================================= */}

    

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-8 grid grid-cols-5 gap-[9px] opacity-40 sm:bottom-12 sm:left-12"
      >
        {Array.from({ length: 20 }).map((_, index) => (
          <span
            key={index}
            className="h-[3px] w-[3px] rounded-full bg-[#9DB7DD]"
          />
        ))}
      </div>

      {/* ================================================================
          MAIN CONTENT
      ================================================================= */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div
          className="
            grid
            w-full
            grid-cols-1
            items-center
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

          <section className="relative flex flex-col justify-center lg:min-h-[650px]">
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

            

              

              

            
    
            </div>
          

          {/* ============================================================
              RIGHT SIDE — AUTH CARD
          ============================================================= */}

          <section className="relative z-20 flex w-full justify-center lg:justify-end">
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

/* ========================================================================
   NETWORK FEATURE
======================================================================== */

type NetworkFeatureProps = {
  number: string;
  title: string;
  description: string;
};

function NetworkFeature({
  number,
  title,
  description,
}: NetworkFeatureProps) {
  return (
    <div className="group flex items-start gap-3.5">
      {/* Number */}
      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-[#CBD9EC]
          bg-white/80
          text-[9px]
          font-bold
          text-[#0B3D91]
          shadow-[0_3px_12px_rgba(8,39,95,0.05)]
        "
      >
        {number}
      </div>

      {/* Content */}
      <div className="min-w-0 pt-[1px]">
        <h3 className="text-[13px] font-semibold leading-5 text-[#08275F]">
          {title}
        </h3>

        <p className="mt-[1px] max-w-[390px] text-[11px] leading-[18px] text-[#71819A]">
          {description}
        </p>
      </div>
    </div>
  );
}