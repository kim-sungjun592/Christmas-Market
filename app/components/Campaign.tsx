import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import "./campaign.css";

type CampaignProps = {
  onShop: () => void;
  heroImage: string;
  cartCount: number;
  onCartOpen: () => void;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

const CODE = "LONGNIGHT20";

// Deterministic positions keep the server render identical to the first client render.
const SNOW = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 37 + 5) % 100,
  y: (i * 29 + 7) % 100,
  size: i % 7 === 0 ? 5 : i % 3 === 0 ? 3 : 2,
  duration: 12 + ((i * 7) % 15),
  delay: -((i * 11) % 25),
  opacity: 0.3 + (i % 5) * 0.12,
}));

function Snowfall() {
  return (
    <div className="vc-snow" aria-hidden="true">
      {SNOW.map((flake, index) => (
        <span
          key={index}
          className="vc-snowflake"
          style={
            {
              "--snow-x": `${flake.x}%`,
              "--snow-y": `${flake.y}%`,
              "--snow-size": `${flake.size}px`,
              "--snow-duration": `${flake.duration}s`,
              "--snow-delay": `${flake.delay}s`,
              "--snow-opacity": flake.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function Star({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1.5 13.8 9l7.7 3-7.7 2.1L12 22.5l-1.8-8.4L2.5 12l7.7-3L12 1.5Z" fill="currentColor" />
    </svg>
  );
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {diagonal ? (
        <path d="M5 19 19 5M7 5h12v12" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <path d="M3 12h17M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}

function TopoLines({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 720 500" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1">
        <path d="M-55 392c98-3 97-100 197-98 77 1 71 86 148 83 87-4 77-128 177-143 102-15 130 78 272 30" />
        <path d="M-50 417c113-1 112-102 200-99 72 2 73 84 147 81 104-4 92-129 182-141 97-13 132 83 267 28" />
        <path d="M-57 441c124 0 130-98 214-97 67 0 73 80 145 78 121-4 103-126 187-139 93-15 132 81 263 25" />
        <path d="M-54 464c139-2 145-96 218-96 62 0 74 79 145 77 131-3 112-123 189-136 87-14 132 82 258 23" />
        <path d="M-54 486c150-3 159-91 225-91 58 0 75 76 144 74 141-4 120-121 190-134 81-15 132 81 253 21" />
        <path d="M-40 208C38 204 40 130 118 129c61-1 64 64 126 62 77-2 76-92 143-104 74-13 98 50 203 15 65-22 103-15 157 8" />
        <path d="M-40 231C52 225 55 151 123 151c58 0 65 63 126 60 87-3 84-92 147-103 69-12 96 52 198 16 66-23 103-13 156 9" />
        <path d="M-40 255c106-5 108-81 168-81 54 0 65 60 125 58 98-4 93-92 151-103 64-12 95 53 194 17 67-24 103-11 156 11" />
      </g>
    </svg>
  );
}

function Holly({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 110 85" fill="none" aria-hidden="true">
      <path d="M49 51C30 49 17 37 11 18c9 5 13 3 17-6 3 9 8 11 16 9-3 9 2 17 9 25" fill="#1F3B2D" />
      <path d="M52 48c2-21 15-34 36-38-5 8-3 13 6 17-9 3-12 9-10 16-10-3-19 2-28 9" fill="#315441" />
      <path d="M45 51C31 53 24 62 22 76c6-4 10-2 12 4 3-6 7-8 12-6 0-7 3-13 9-19" fill="#315441" />
      <path d="M20 23 52 51M84 19 55 51M29 72l25-19" stroke="#F5F1E8" strokeOpacity=".55" strokeWidth="1" />
      <circle cx="51" cy="49" r="7" fill="#B3262E" />
      <circle cx="61" cy="52" r="7" fill="#B3262E" />
      <circle cx="54" cy="59" r="7" fill="#9C2028" />
      <circle cx="49" cy="47" r="1.7" fill="#F5F1E8" opacity=".65" />
    </svg>
  );
}

function calculateTimeLeft(): TimeLeft {
  // Midnight after December 24 in the store's America/New_York timezone.
  // December is standard time (UTC-05:00), so this is independent of the
  // visitor's or server's timezone. It is calculated only after mount.
  const end = Date.parse("2026-12-25T00:00:00-05:00");
  const milliseconds = Math.max(0, end - Date.now());
  const totalSeconds = Math.ceil(milliseconds / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    ended: milliseconds === 0,
  };
}

function Countdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const update = () => setTime(calculateTimeLeft());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const doors = [
    { label: "Days", value: time?.days, number: "01" },
    { label: "Hours", value: time?.hours, number: "02" },
    { label: "Minutes", value: time?.minutes, number: "03" },
    { label: "Seconds", value: time?.seconds, number: "04" },
  ];

  return (
    <div className="vc-countdown-wrap">
      <div className="vc-countdown-heading">
        <div>
          <div className="vc-section-kicker"><Star /> THE COUNTDOWN <span> / </span> NO. 1224</div>
          <h2>THE LAST LIGHT<br /><em>IS ON THE CLOCK.</em></h2>
        </div>
        <p>Good things come to those who wander.<br />Make it back before the magic ends.</p>
      </div>
      <div className="vc-countdown-line">
        <div className="vc-calendar-intro" aria-hidden="true">
          <span>THE</span>
          <strong>ADVENT<br />OF ADVENTURE</strong>
          <span>DECEMBER 2026</span>
        </div>
        <div className="vc-doors" aria-label="Countdown to the end of December 24, 2026, Eastern Time">
          {doors.map((door) => (
            <div className="vc-door" key={door.label}>
              <div className="vc-door-top"><span>{door.number}</span><Star /></div>
              <div className="vc-door-value">{door.value === undefined ? "––" : String(door.value).padStart(2, "0")}</div>
              <div className="vc-door-label">{door.label}</div>
              <span className="vc-door-knob" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
      <div className="vc-countdown-foot">
        <span>{time?.ended ? "THE LONG NIGHT SALE HAS ENDED." : "ENDS DEC 24, 2026 · 11:59:59 PM ET"}</span>
        <span>EASTERN TIME <span className="vc-tiny-star">✳</span></span>
      </div>
    </div>
  );
}

function Coupon() {
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");
  const dragStart = useRef<{ x: number; pointerId: number } | null>(null);
  const copyButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (revealed) copyButton.current?.focus();
  }, [revealed]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart.current = { x: event.clientX, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragStart.current.x;
    setProgress(Math.max(0, Math.min(1, distance / (event.currentTarget.offsetWidth * 0.7))));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragStart.current.x;
    if (distance > event.currentTarget.offsetWidth * 0.3) setRevealed(true);
    setProgress(0);
    dragStart.current = null;
  };

  const copyCode = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(CODE);
      setCopyMessage("Code copied. See you on the trail!");
    } catch {
      setCopyMessage("Couldn’t copy automatically. Please select and copy the code above.");
    }
  };

  return (
    <div className="vc-bib" aria-label="The Long Night Sale coupon">
      <span className="vc-bib-pin vc-pin-one" aria-hidden="true" />
      <span className="vc-bib-pin vc-pin-two" aria-hidden="true" />
      <Holly className="vc-holly vc-holly-left" />
      <Holly className="vc-holly vc-holly-right" />
      <div className="vc-bib-topline"><span>VERT CLUB <b>✳</b> HOLIDAY 2026</span><span>RACE BIB / NO. 1224</span></div>
      <div className="vc-bib-main">
        <div className="vc-bib-discount"><span>YOUR ALL-ACCESS PASS TO</span><strong>20<span>%</span> OFF</strong><small>THE WHOLE SHOP · DEC 1–24, 2026 ET</small></div>
        <div className="vc-bib-stamp" aria-hidden="true"><span>GOOD FOR</span><strong>ONE<br />LONG<br />NIGHT</strong><Star /></div>
      </div>
      <div className="vc-bib-dashes" aria-hidden="true" />
      <div className="vc-code-caption"><span>YOUR HOLIDAY CODE</span><span>TEAR HERE <span aria-hidden="true">✂</span></span></div>
      <div className="vc-tear-area">
        <div className="vc-code-under" aria-hidden={!revealed}>
          <span className="vc-code-text">{CODE}</span>
          {revealed && <button ref={copyButton} className="vc-copy-button" type="button" onClick={copyCode} aria-label={`Copy code ${CODE}`}>COPY CODE <span aria-hidden="true">↗</span></button>}
        </div>
        {!revealed && (
          <button
            type="button"
            className="vc-tear-strip"
            style={{ transform: `translateX(${progress * 92}%)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { dragStart.current = null; setProgress(0); }}
            onClick={() => { setRevealed(true); setProgress(0); }}
            aria-label="Reveal holiday code. Drag right, or click or tap."
          >
            <span className="vc-tear-label"><span>DRAG TO REVEAL <b aria-hidden="true">⟶</b></span><small>OR CLICK / TAP</small></span>
          </button>
        )}
      </div>
      <p className="vc-copy-message" aria-live="polite">{copyMessage || (revealed ? "Use at checkout during the sale dates." : "A little trail magic, just for you.")}</p>
      <div className="vc-bib-bottom"><span>THE LONG NIGHT SALE</span><span>✳</span><span>MADE FOR THE LONG RUN</span></div>
    </div>
  );
}

export default function Campaign({ onShop, heroImage, cartCount, onCartOpen }: CampaignProps) {
  return (
    <main className="vc-campaign" id="long-night-top">
      <Snowfall />
      <section className="vc-hero" aria-labelledby="vc-hero-title">
        <img className="vc-hero-image" src={heroImage} alt="" />
        <div className="vc-hero-shade" aria-hidden="true" />
        <div className="vc-knit vc-knit-top" aria-hidden="true" />
        <div className="vc-knit-side vc-knit-side-left" aria-hidden="true" />
        <div className="vc-knit-side vc-knit-side-right" aria-hidden="true" />
        <div className="vc-hero-frame" aria-hidden="true" />
        <header className="vc-header">
          <a className="vc-logo" href="#long-night-top" aria-label="Vert Club, back to top"><span>VERT</span><span>CLUB<span className="vc-logo-dot">✳</span></span></a>
          <div className="vc-header-note">A CLUB FOR THE LONG WAY HOME <span>✳</span></div>
          <nav className="vc-nav" aria-label="Campaign navigation">
            <a href="#vc-details">THE DETAILS</a>
            <button type="button" onClick={onCartOpen} className="vc-hero-cart" aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8ZM9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>
              <span>CART</span><span className="vc-cart-count">{cartCount}</span>
            </button>
          </nav>
        </header>
        <div className="vc-hero-content">
          <div className="vc-eyebrow"><span className="vc-eyebrow-line" /> THE VERT CLUB HOLIDAY EVENT <Star /> 2026</div>
          <h1 id="vc-hero-title">THE LONG<br />NIGHT SALE<span className="vc-title-dot">.</span></h1>
          <div className="vc-hero-description">
            <p>For the early risers, the late finishers,<br />and everyone who takes the long way home.</p>
            <div className="vc-hero-offer"><strong>20% OFF EVERYTHING</strong><span>DECEMBER 1–24, 2026 · ET</span></div>
          </div>
          <button className="vc-primary-button" type="button" onClick={onShop}><span>세일 상품 보기</span><Arrow diagonal /></button>
          <p className="vc-hero-code-note">A LITTLE TRAIL MAGIC IS ON ITS WAY <span>✳</span></p>
        </div>
        <div className="vc-roundel" aria-hidden="true"><span>THE LONG NIGHT SALE</span><strong>20<small>%</small></strong><span>OFF THE WHOLE SHOP</span><Star /></div>
        <div className="vc-hero-bottom"><span>GOOD PEOPLE. GREAT OUTDOORS.</span><a href="#vc-details">SCROLL TO EXPLORE <span>↓</span></a><span>EST. FOR THE LONG RUN <b>✳</b></span></div>
        <div className="vc-knit vc-knit-bottom" aria-hidden="true" />
      </section>

      <section className="vc-details" id="vc-details" aria-label="Sale details and countdown">
        <TopoLines className="vc-topo vc-topo-left" />
        <TopoLines className="vc-topo vc-topo-right" />
        <div className="vc-details-inner">
          <div className="vc-marquee" aria-hidden="true"><span>TAKE THE LONG WAY HOME</span><Star /><span>GOOD GEAR, GOOD CHEER</span><Star /><span>TAKE THE LONG WAY HOME</span><Star /><span>GOOD GEAR, GOOD CHEER</span></div>
          <Countdown />
        </div>
      </section>

      <section className="vc-coupon-section" aria-labelledby="vc-coupon-title">
        <TopoLines className="vc-coupon-topo" />
        <div className="vc-coupon-inner">
          <div className="vc-coupon-copy">
            <div className="vc-section-kicker"><Star /> A GIFT FOR THE JOURNEY <span> / </span> 2026</div>
            <h2 id="vc-coupon-title">A LITTLE<br /><em>TRAIL MAGIC.</em></h2>
            <p>Consider this your invitation to take the scenic route. Unwrap your code for 20% off the whole shop, December 1–24, 2026, Eastern Time.</p>
            <div className="vc-coupon-signoff"><span>FROM OUR TRAIL TO YOURS</span><Star /></div>
          </div>
          <Coupon />
        </div>
      </section>

      <footer className="vc-footer">
        <div className="vc-footer-top"><div className="vc-footer-logo">VERT<br />CLUB<span>✳</span></div><p>FOR THE LONG WAY HOME.<br />AND THE PEOPLE YOU MEET THERE.</p><a href="#long-night-top">BACK TO THE TOP ↑</a></div>
        <div className="vc-footer-bottom"><span>© 2026 VERT CLUB</span><span>GOOD PEOPLE. GREAT OUTDOORS.</span><span>THE LONG NIGHT SALE / 01—24 DEC</span></div>
      </footer>
    </main>
  );
}
