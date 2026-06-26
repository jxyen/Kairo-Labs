"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Kairo Labs hero — a custom-rendered rotating DNA double-helix on canvas,
 * in brand emerald on pure black, behind brand-font copy. No external assets.
 */
export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // emerald 53,224,160  ·  light tip 188,255,228
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const node = (t: number) => ({
      r: Math.round(lerp(36, 200, t)),
      g: Math.round(lerp(170, 255, t)),
      b: Math.round(lerp(120, 232, t)),
    });

    const draw = (time: number) => {
      ctx.clearRect(0, 0, W, H);

      const narrow = W < 760;
      const cx = narrow ? W * 0.5 : W * 0.64;
      const amp = Math.min(W * 0.2, narrow ? 150 : 240);
      const top = H * 0.0;
      const len = H * 1.0;
      const turns = 3.0;
      const N = 156;
      const spin = time * 0.00045;
      const tilt = -0.12; // slight diagonal lean

      ctx.save();
      ctx.translate(cx, H / 2);
      ctx.rotate(tilt);
      ctx.translate(-cx, -H / 2);

      // soft glow column behind the strands
      const glow = ctx.createRadialGradient(cx, H / 2, 0, cx, H / 2, amp * 2.4);
      glow.addColorStop(0, "rgba(53,224,160,0.10)");
      glow.addColorStop(1, "rgba(53,224,160,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - amp * 2.6, 0, amp * 5.2, H);

      type P = { x: number; y: number; z: number; s: number; i: number };
      const pts: P[] = [];
      for (let i = 0; i <= N; i++) {
        const p = i / N;
        const y = top + p * len;
        const base = p * turns * Math.PI * 2;
        for (let s = 0; s < 2; s++) {
          const a = base + s * Math.PI + spin;
          pts.push({ x: cx + amp * Math.cos(a), y, z: Math.sin(a), s, i });
        }
      }

      // rungs (base pairs) every few steps — drawn faint, behind nodes
      for (let i = 0; i <= N; i += 2) {
        const a = (i / N) * turns * Math.PI * 2 + spin;
        const x0 = cx + amp * Math.cos(a);
        const x1 = cx + amp * Math.cos(a + Math.PI);
        const y = top + (i / N) * len;
        const za = (Math.sin(a) + 1) / 2;
        ctx.strokeStyle = `rgba(53,224,160,${0.05 + za * 0.16})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }

      // nodes, far-to-near for correct depth
      pts.sort((a, b) => a.z - b.z);
      for (const pt of pts) {
        const t = (pt.z + 1) / 2; // 0 back .. 1 front
        const scale = 0.45 + t * 0.95;
        const alpha = 0.16 + t * 0.84;
        const c = node(pt.s === 0 ? t : t * 0.85);
        const radius = (narrow ? 2.4 : 3.2) * scale;
        ctx.shadowColor = "rgba(53,224,160,0.95)";
        ctx.shadowBlur = 20 * scale * (0.35 + t * 0.65);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="k-hero">
      <style>{`
        .k-hero {
          position: relative;
          min-height: min(94vh, 900px);
          overflow: hidden;
          background: #000;
          isolation: isolate;
        }
        .k-helix {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          display: block;
        }
        /* readability scrim — darkens the left where the copy sits */
        .k-scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, #000 0%, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 22%, transparent 68%, #000 100%);
        }
        .k-helix-content {
          position: relative;
          z-index: 2;
          min-height: min(94vh, 900px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(96px, 13vh, 168px) 0 clamp(56px, 8vh, 88px);
          max-width: 720px;
        }
        .k-h1 {
          font-family: var(--font-display);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.025em;
          line-height: 1.0;
          font-size: clamp(32px, 5.2vw, 58px);
          margin: 24px 0 0;
          color: #f4f6f7;
        }
        .k-h1 .accent { color: var(--accent); }
        .k-sub {
          margin: 22px 0 0;
          font-size: clamp(15px, 2.3vw, 18px);
          line-height: 1.62;
          color: var(--text-muted);
          max-width: 540px;
        }
        .k-cta-row { margin: 32px 0 0; display: flex; flex-wrap: wrap; gap: 12px; }
        .k-chips { margin: 30px 0 0; display: flex; flex-wrap: wrap; gap: 9px 10px; }

        @media (max-width: 820px) {
          .k-hero { min-height: auto; }
          .k-hero .container { padding-left: 18px; padding-right: 18px; overflow-x: clip; }
          .k-helix { opacity: 0.5; }
          .k-scrim {
            background:
              radial-gradient(120% 70% at 50% 42%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.78) 100%),
              linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 26%, rgba(0,0,0,0.6) 72%, #000 100%);
          }
          .k-helix-content {
            text-align: center;
            max-width: 100%;
            width: 100%;
            align-items: center;
            min-height: auto;
            padding: clamp(96px, 17vh, 128px) 0 44px;
          }
          .k-h1 {
            width: 100%;
            max-width: 100%;
            font-size: clamp(22px, 6.6vw, 30px);
            letter-spacing: -0.01em;
            line-height: 1.08;
            overflow-wrap: break-word;
            word-break: break-word;
          }
          .k-sub { width: 100%; margin: 18px auto 0; font-size: 14px; max-width: 460px; }
          .k-hero .glass-pill { font-size: 9px; letter-spacing: 0.06em; padding: 7px 12px; white-space: nowrap; }
          .k-cta-row { width: 100%; justify-content: center; gap: 10px; }
          .k-cta-row .btn { flex: 1 1 100%; }
          .k-chips { width: 100%; justify-content: center; }
        }
      `}</style>

      <canvas className="k-helix" ref={canvasRef} aria-hidden="true" />
      <div className="k-scrim" aria-hidden="true" />

      <div className="container">
        <div className="k-helix-content">
          <span className="glass-pill">
            <span className="dot" />
            Shipped from the USA · Same-day dispatch
          </span>

          <h1 className="k-h1">
            Real orders.
            <br />
            <span className="accent">Shipped fast from the USA.</span>
          </h1>

          <p className="k-sub">
            Independently lab-tested to ≥99% purity with a certificate of analysis you can verify by
            lot number — dispatched same-day from our US facility in discreet, tracked packaging.
          </p>

          <div className="k-cta-row">
            <Link href="/catalog" className="btn btn-accent" style={{ fontSize: 15, padding: "15px 30px" }}>
              Shop the catalog →
            </Link>
            <Link href="/#quality" className="btn btn-glass" style={{ fontSize: 15, padding: "15px 26px" }}>
              View certificates
            </Link>
          </div>

          <div className="k-chips font-mono">
            {["Ships from the USA", "Same-day dispatch", "≥99% lab-tested", "Discreet packaging"].map(
              (t) => (
                <span key={t} className="hero-chip">
                  <span style={{ color: "var(--accent)" }}>✓</span> {t}
                </span>
              ),
            )}
          </div>

          <p
            className="font-mono"
            style={{
              margin: "26px 0 0",
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-ghost)",
            }}
          >
            For laboratory &amp; research use only · Not for human consumption
          </p>
        </div>
      </div>
    </section>
  );
}
