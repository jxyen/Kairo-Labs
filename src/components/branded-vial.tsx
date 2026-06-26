import type { Product } from "@/lib/products";

/**
 * Branded research vial — dark studio "lab" aesthetic (black glass, dark crimp
 * cap, black label with emerald hairline, Kairo K seal, chrome compound name,
 * MG callout, RESEARCH PURPOSES ONLY / NOT FOR HUMAN CONSUMPTION, and a
 * LAB TESTED · VERIFIED PURITY strip). Strong rim lighting so the black glass
 * reads on a dark background. Rendered as crisp SVG — identical across SKUs.
 */
export function BrandedVial({ product, height }: { product: Product; height: number }) {
  const uid = product.code.replace(/[^a-zA-Z0-9]/g, "");
  const mg = product.sizes[0].mg;
  const mgNum = mg.replace(/[^0-9.]/g, "");
  const lot = `KL-${(uid.slice(0, 4) || "0000").toUpperCase()}`;

  // Adaptive headline size so long names still fit the label width.
  const n = product.name.length;
  const nameSize = n <= 7 ? 30 : n <= 10 ? 25 : n <= 14 ? 20 : n <= 19 ? 15.5 : 12.5;

  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        viewBox="0 0 240 320"
        height={Math.round(height * 0.98)}
        role="img"
        aria-label={`${product.name} ${mg} research vial`}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* soft studio backlight to separate the black glass from the bg */}
          <radialGradient id={`back-${uid}`} cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="0.5" stopColor="#35E0A0" stopOpacity="0.05" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* black glass body with bright specular rims */}
          <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#060708" />
            <stop offset="0.07" stopColor="#565d66" />
            <stop offset="0.16" stopColor="#15181c" />
            <stop offset="0.5" stopColor="#0a0c0e" />
            <stop offset="0.84" stopColor="#191d22" />
            <stop offset="0.93" stopColor="#6a7178" />
            <stop offset="1" stopColor="#060708" />
          </linearGradient>
          {/* crimp cap */}
          <linearGradient id={`cap-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" />
            <stop offset="0.12" stopColor="#4b5057" />
            <stop offset="0.5" stopColor="#0c0d0f" />
            <stop offset="0.86" stopColor="#3a3e44" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          {/* label face */}
          <linearGradient id={`label-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.5" stopColor="#111317" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
          {/* chrome compound text */}
          <linearGradient id={`chrome-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.42" stopColor="#cfd4da" />
            <stop offset="0.5" stopColor="#9097a0" />
            <stop offset="0.58" stopColor="#b9bfc6" />
            <stop offset="1" stopColor="#f1f4f7" />
          </linearGradient>
          {/* emerald MG */}
          <linearGradient id={`mg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9bffd9" />
            <stop offset="1" stopColor="#16b67e" />
          </linearGradient>
          {/* powder cake */}
          <linearGradient id={`powder-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f1ea" />
            <stop offset="1" stopColor="#d4cebf" />
          </linearGradient>
        </defs>

        {/* studio backlight + contact shadow */}
        <ellipse cx="120" cy="150" rx="92" ry="150" fill={`url(#back-${uid})`} />
        <ellipse cx="120" cy="306" rx="64" ry="9" fill="rgba(0,0,0,0.6)" />
        <ellipse cx="120" cy="300" rx="56" ry="5" fill="rgba(53,224,160,0.07)" />

        {/* ---------- CAP ---------- */}
        <rect x="86" y="10" width="68" height="10" rx="3" fill={`url(#cap-${uid})`} />
        <rect x="82" y="18" width="76" height="30" rx="4" fill={`url(#cap-${uid})`} />
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={i} x1={87 + i * 6.6} y1="20" x2={87 + i * 6.6} y2="46" stroke="rgba(0,0,0,0.55)" strokeWidth="1.2" />
        ))}
        <rect x="82" y="19" width="76" height="3" rx="1.5" fill="rgba(255,255,255,0.28)" />
        <rect x="86" y="20" width="4" height="26" rx="2" fill="rgba(255,255,255,0.32)" />
        <rect x="84" y="46" width="72" height="7" rx="2" fill="#1a1d21" stroke="rgba(0,0,0,0.6)" strokeWidth="0.6" />
        <rect x="86" y="47" width="68" height="1.4" rx="0.7" fill="rgba(255,255,255,0.18)" />

        {/* ---------- GLASS BODY ---------- */}
        <path d="M88 52 H152 L168 78 V82 H72 V78 Z" fill={`url(#glass-${uid})`} stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
        <rect x="64" y="78" width="112" height="218" rx="16" fill={`url(#glass-${uid})`} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        {/* powder cake */}
        <rect x="70" y="250" width="100" height="42" rx="12" fill={`url(#powder-${uid})`} opacity="0.97" />
        <ellipse cx="120" cy="251" rx="50" ry="5" fill="#fbf8f1" />
        {/* bright specular streaks (the rim light) */}
        <rect x="71" y="86" width="6" height="204" rx="3" fill="#ffffff" opacity="0.5" />
        <rect x="80" y="88" width="2.4" height="198" rx="1.2" fill="#ffffff" opacity="0.22" />
        <rect x="165" y="92" width="4" height="196" rx="2" fill="#ffffff" opacity="0.34" />
        <rect x="160" y="96" width="1.6" height="188" rx="0.8" fill="#ffffff" opacity="0.16" />

        {/* ---------- LABEL ---------- */}
        <g>
          <rect x="60" y="96" width="120" height="150" rx="4" fill={`url(#label-${uid})`} stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />
          <rect x="60" y="96" width="120" height="2.4" rx="1.2" fill="#35E0A0" opacity="0.95" />
          <rect x="60" y="243.6" width="120" height="2.4" rx="1.2" fill="#35E0A0" opacity="0.55" />

          {/* seal: Kairo K + wordmark */}
          <g transform="translate(120,118)">
            <g transform="translate(-6.2,-9) scale(0.0168) translate(-318,-190)">
              <path fill="#35E0A0" fillRule="evenodd" d="M 325.890 190.729 L 319.280 191.085 318.787 198.792 C 318.516 203.032, 318.382 378.400, 318.489 588.500 L 318.684 970.500 346.342 970.766 L 374 971.032 374.023 968.266 C 374.036 966.745, 374.066 791.125, 374.091 578 L 374.135 190.500 353.317 190.436 C 341.868 190.401, 329.526 190.533, 325.890 190.729 M 607.496 352.010 C 518.539 440.978, 445.924 514.250, 446.128 514.836 C 446.333 515.422, 454.216 523.767, 463.647 533.380 L 480.793 550.859 515.147 516.751 C 534.041 497.992, 604.635 427.593, 672.023 360.310 L 794.546 237.977 835.297 238.239 L 876.048 238.500 672.274 442.129 C 560.198 554.125, 464.275 649.893, 459.112 654.946 L 449.724 664.134 506.652 721.317 C 537.962 752.768, 601.217 816.300, 647.218 862.500 C 693.220 908.700, 736.342 952.012, 743.045 958.750 L 755.231 971 881.199 971 C 962.099 971, 1007.047 970.653, 1006.833 970.030 C 1006.393 968.750, 922.023 882.491, 846.883 806.500 C 816.171 775.440, 779.454 738.073, 758 716.044 C 752.225 710.114, 728.385 685.848, 705.023 662.119 L 662.546 618.975 645.253 636.237 C 635.741 645.732, 628.081 654.035, 628.230 654.688 C 628.516 655.948, 656.929 685.018, 721.874 750.500 C 743.693 772.500, 774.306 803.550, 789.901 819.500 C 805.497 835.450, 835.392 865.825, 856.336 887 L 894.415 925.500 838.457 925.773 L 782.500 926.046 736 879.256 C 612.125 754.606, 523.469 664.689, 523.175 663.402 C 522.989 662.592, 624.033 560.716, 757.675 426.970 C 886.829 297.715, 992.620 191.610, 992.766 191.182 C 992.913 190.754, 942.678 190.369, 881.134 190.326 L 769.236 190.250 607.496 352.010" />
            </g>
            <text x="0" y="16" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontSize="12" fontWeight="800" letterSpacing="0.14em" fill="#f3f5f6">KAIRO LABS</text>
            <line x1="-46" y1="22.5" x2="-22" y2="22.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
            <line x1="22" y1="22.5" x2="46" y2="22.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
            <text x="0" y="25.5" textAnchor="middle" style={{ fontFamily: "var(--font-mono)" }} fontSize="5" letterSpacing="0.32em" fill="#7a8088">RESEARCH&#160;&#160;COMPOUNDS</text>
          </g>

          {/* compound name — chrome */}
          <text x="120" y="178" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontSize={nameSize} fontWeight="800" letterSpacing="-0.01em" fill={`url(#chrome-${uid})`}>
            {product.name}
          </text>

          {/* divider */}
          <line x1="68" y1="190" x2="172" y2="190" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />

          {/* MG + RUO notice */}
          <text x="69" y="213" textAnchor="start" style={{ fontFamily: "var(--font-display)" }} fontSize="21" fontWeight="800" fill={`url(#mg-${uid})`}>
            {mgNum}<tspan fontSize="11" dx="1">MG</tspan>
          </text>
          <text x="113" y="205" textAnchor="start" style={{ fontFamily: "var(--font-mono)" }} fontSize="3.9" letterSpacing="0.02em" fill="#9aa0a8">RESEARCH PURPOSES ONLY</text>
          <text x="113" y="211.5" textAnchor="start" style={{ fontFamily: "var(--font-mono)" }} fontSize="3.9" letterSpacing="0.02em" fill="#9aa0a8">NOT FOR HUMAN CONSUMPTION</text>
          <text x="113" y="218.5" textAnchor="start" style={{ fontFamily: "var(--font-mono)" }} fontSize="3.4" letterSpacing="0.04em" fill="#565d64">LOT {lot} · {product.purity} HPLC</text>

          {/* footer strip */}
          <rect x="68" y="228" width="104" height="11" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
          <circle cx="78" cy="233.5" r="1.3" fill="#35E0A0" />
          <text x="120" y="235.6" textAnchor="middle" style={{ fontFamily: "var(--font-mono)" }} fontSize="5" letterSpacing="0.1em" fill="#c8ced4">LAB TESTED&#160;&#160;•&#160;&#160;VERIFIED PURITY</text>
          <circle cx="162" cy="233.5" r="1.3" fill="#35E0A0" />
        </g>
      </svg>
    </div>
  );
}
