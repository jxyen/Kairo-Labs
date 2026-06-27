export type Category =
  | "Recovery & Repair"
  | "Metabolic & Weight"
  | "Growth Hormone"
  | "Skin & Cosmetic"
  | "Blends & Stacks";

export type FilterCategory = "All" | Category;

export interface SizeOption {
  mg: string;
  price: number;
}

export interface Product {
  code: string;
  name: string;
  sub: string;
  category: Category;
  /** Transparent vial cutout (public/products/cutout/*.png) — sits on the emerald gradient. */
  image: string;
  /** Short mechanism/category label shown in the card pill. */
  mechanism: string;
  /** Punchy benefit headline for hero/feature cards. Use \n for the line break. */
  tagline: string;
  purity: string;
  sizes: SizeOption[];
  rating: number;
  reviews: number;
  bestseller: boolean;
  featured: boolean;
  blurb: string;
  /** Reference "buy separately" total for bundles — drives the savings callout. */
  compareAt?: number;
}

// Pricing: per-vial cost = supplier (WWB) kit price / 10 vials; retail ≈ 4× cost
// rounded to .99 (consistent ~75% margin, ~$15 under competitor where comparable).
export const PRODUCTS: Product[] = [
  // ----- Recovery & Repair -----
  {
    code: "BPC-157",
    name: "BPC-157",
    sub: "Body Protection Compound",
    category: "Recovery & Repair",
    image: "/products/cutout/bpc-157.png",
    mechanism: "Recovery · Repair",
    tagline: "Studied for\ntissue repair.",
    purity: "99.2%",
    sizes: [
      { mg: "5 mg", price: 23.99 },
      { mg: "20 mg", price: 47.99 },
    ],
    rating: 4.9,
    reviews: 318,
    bestseller: true,
    featured: true,
    blurb: "Stable gastric peptide studied for tissue repair and recovery.",
  },
  {
    code: "TB-500",
    name: "TB-500",
    sub: "Thymosin Beta-4 Fragment",
    category: "Recovery & Repair",
    image: "/products/cutout/tb-500.png",
    mechanism: "Recovery · Mobility",
    tagline: "Studied for\nregeneration.",
    purity: "99.4%",
    sizes: [
      { mg: "5 mg", price: 37.99 },
      { mg: "10 mg", price: 63.99 },
    ],
    rating: 4.8,
    reviews: 241,
    bestseller: true,
    featured: true,
    blurb: "Actin-binding peptide studied in regeneration and angiogenesis research.",
  },

  // ----- Metabolic & Weight -----
  {
    code: "Tirzepatide",
    name: "Tirzepatide",
    sub: "GLP-1 / GIP Co-Agonist",
    category: "Metabolic & Weight",
    image: "/products/cutout/tirzepatide.png",
    mechanism: "GLP-1 · GIP",
    tagline: "Dual incretin\nco-agonist.",
    purity: "99.3%",
    sizes: [
      { mg: "5 mg", price: 23.99 },
      { mg: "10 mg", price: 35.99 },
      { mg: "20 mg", price: 49.99 },
      { mg: "30 mg", price: 59.99 },
      { mg: "60 mg", price: 91.99 },
    ],
    rating: 4.9,
    reviews: 356,
    bestseller: true,
    featured: true,
    blurb: "Dual incretin co-agonist studied across metabolic and glucose endpoints.",
  },
  {
    code: "Retatrutide",
    name: "Retatrutide",
    sub: "GLP-1 / GIP / Glucagon Tri-Agonist",
    category: "Metabolic & Weight",
    image: "/products/cutout/retatrutide.png",
    mechanism: "GLP-1 · GIP · GCG",
    tagline: "Triple incretin\nagonist.",
    purity: "99.1%",
    sizes: [
      { mg: "10 mg", price: 51.99 },
      { mg: "20 mg", price: 79.99 },
      { mg: "30 mg", price: 99.99 },
      { mg: "60 mg", price: 151.99 },
    ],
    rating: 4.9,
    reviews: 428,
    bestseller: true,
    featured: true,
    blurb: "Triple incretin agonist studied across weight and metabolic endpoints.",
  },
  {
    code: "MOTS-c",
    name: "MOTS-c",
    sub: "Mitochondrial-Derived Peptide",
    category: "Metabolic & Weight",
    image: "/products/cutout/mots-c.png",
    mechanism: "Mitochondrial",
    tagline: "Mitochondrial-\nderived peptide.",
    purity: "99.2%",
    sizes: [
      { mg: "10 mg", price: 31.99 },
      { mg: "40 mg", price: 87.99 },
    ],
    rating: 4.8,
    reviews: 97,
    bestseller: true,
    featured: false,
    blurb: "Mitochondrial peptide studied in metabolic regulation and energy research.",
  },

  // ----- Growth Hormone -----
  {
    code: "CJC-1295",
    name: "CJC-1295",
    sub: "GHRH Analog (No DAC)",
    category: "Growth Hormone",
    image: "/products/cutout/cjc-1295.png",
    mechanism: "GHRH Analog",
    tagline: "GHRH analog\nfor GH studies.",
    purity: "99.3%",
    sizes: [{ mg: "10 mg", price: 59.99 }],
    rating: 4.7,
    reviews: 132,
    bestseller: false,
    featured: false,
    blurb: "GHRH analog frequently studied alongside GH secretagogues.",
  },
  {
    code: "Ipamorelin",
    name: "Ipamorelin",
    sub: "GH Secretagogue",
    category: "Growth Hormone",
    image: "/products/cutout/ipamorelin.png",
    mechanism: "GH Secretagogue",
    tagline: "Selective GH\nsecretagogue.",
    purity: "99.0%",
    sizes: [
      { mg: "5 mg", price: 19.99 },
      { mg: "10 mg", price: 31.99 },
    ],
    rating: 4.8,
    reviews: 176,
    bestseller: true,
    featured: false,
    blurb: "Selective GHSR agonist used in growth-hormone release studies.",
  },
  {
    code: "IGF-1-LR3",
    name: "IGF-1 LR3",
    sub: "Long-Acting IGF-1 Analog",
    category: "Growth Hormone",
    image: "/products/cutout/igf-1-lr3.png",
    mechanism: "IGF-1 Analog",
    tagline: "Long-acting\nIGF-1 analog.",
    purity: "98.9%",
    sizes: [{ mg: "1 mg", price: 91.99 }],
    rating: 4.7,
    reviews: 74,
    bestseller: false,
    featured: false,
    blurb: "Long-acting IGF-1 analog studied in growth and cellular-signaling models.",
  },

  // ----- Skin & Cosmetic -----
  {
    code: "GHK-Cu",
    name: "GHK-Cu",
    sub: "Copper Tripeptide",
    category: "Skin & Cosmetic",
    image: "/products/cutout/ghk-cu.png",
    mechanism: "Copper Peptide",
    tagline: "Copper peptide\nfor skin models.",
    purity: "99.5%",
    sizes: [
      { mg: "50 mg", price: 15.99 },
      { mg: "100 mg", price: 23.99 },
    ],
    rating: 4.9,
    reviews: 203,
    bestseller: true,
    featured: true,
    blurb: "Copper tripeptide investigated in skin and collagen models.",
  },
  {
    code: "MT-2",
    name: "MT-2",
    sub: "Melanotan II",
    category: "Skin & Cosmetic",
    image: "/products/cutout/mt-2.png",
    mechanism: "Melanocortin",
    tagline: "Melanocortin\nreceptor agonist.",
    purity: "98.9%",
    sizes: [{ mg: "10 mg", price: 23.99 }],
    rating: 4.6,
    reviews: 167,
    bestseller: false,
    featured: false,
    blurb: "Melanocortin receptor agonist used in pigmentation research.",
  },

  // ----- Blends & Stacks -----
  {
    code: "BPC-TB-Blend",
    name: "BPC-157 + TB-500",
    sub: "Recovery Stack",
    category: "Blends & Stacks",
    image: "/products/cutout/bpc-tb-blend.png",
    mechanism: "Recovery Stack",
    tagline: "Co-formulated\nrepair stack.",
    purity: "99.2%",
    sizes: [{ mg: "20 mg", price: 79.99 }],
    rating: 4.9,
    reviews: 188,
    bestseller: true,
    featured: false,
    compareAt: 103.99,
    blurb: "Co-formulated BPC-157 + TB-500 recovery stack studied in repair and regeneration models.",
  },
  {
    code: "CJC-Ipa-Blend",
    name: "CJC-1295 + Ipamorelin",
    sub: "Growth-Hormone Stack",
    category: "Blends & Stacks",
    image: "/products/cutout/cjc-ipa-blend.png",
    mechanism: "GH Stack",
    tagline: "GHRH + secretagogue\nresearch stack.",
    purity: "99.1%",
    sizes: [{ mg: "10 mg", price: 47.99 }],
    rating: 4.8,
    reviews: 156,
    bestseller: true,
    featured: false,
    compareAt: 61.99,
    blurb: "GHRH + secretagogue blend studied together in GH-release research.",
  },
  {
    code: "GLOW",
    name: "GLOW Stack",
    sub: "GHK-Cu + TB-500 + BPC-157",
    category: "Blends & Stacks",
    image: "/products/cutout/glow.png",
    mechanism: "Skin + Recovery",
    tagline: "Skin & repair\nresearch stack.",
    purity: "99.2%",
    sizes: [{ mg: "70 mg", price: 87.99 }],
    rating: 4.9,
    reviews: 142,
    bestseller: true,
    featured: false,
    compareAt: 114.99,
    blurb: "Skin, recovery and repair stack co-formulated in a single research vial.",
  },
];

/* ---------- Derived collections ---------- */
export const FEATURED = PRODUCTS.filter((p) => p.featured);
export const BESTSELLERS = PRODUCTS.filter((p) => p.bestseller);

export const CATEGORIES: FilterCategory[] = [
  "All",
  "Recovery & Repair",
  "Metabolic & Weight",
  "Growth Hormone",
  "Skin & Cosmetic",
  "Blends & Stacks",
];

export interface CategoryMeta {
  name: Category;
  blurb: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  { name: "Recovery & Repair", blurb: "Tissue repair, healing and regeneration research." },
  { name: "Metabolic & Weight", blurb: "Incretin, lipid and glucose-metabolism compounds." },
  { name: "Growth Hormone", blurb: "Secretagogues and GHRH analogs for GH-release studies." },
  { name: "Skin & Cosmetic", blurb: "Collagen, pigmentation and dermal-model compounds." },
  { name: "Blends & Stacks", blurb: "Co-formulated multi-peptide research stacks." },
];

export function categoryCount(category: Category): number {
  return PRODUCTS.filter((p) => p.category === category).length;
}

/* ---------- Price / size helpers ---------- */
export function fromPrice(p: Product): number {
  return Math.min(...p.sizes.map((s) => s.price));
}

export function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** "$42.99" for one size, "$42.99 – $69.99" for a range. */
export function priceDisplay(p: Product): string {
  const prices = p.sizes.map((s) => s.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? formatUSD(lo) : `${formatUSD(lo)} – ${formatUSD(hi)}`;
}

/** "5 mg" for one size, "2 sizes" when multiple dosages are offered. */
export function sizeDisplay(p: Product): string {
  return p.sizes.length === 1 ? p.sizes[0].mg : `${p.sizes.length} sizes`;
}

/* ---------- Slugs / lookup (for product detail pages) ---------- */
/** URL slug derived from the cutout filename, e.g. "/products/cutout/bpc-157.png" -> "bpc-157". */
export function productSlug(p: Product): string {
  return p.image.split("/").pop()!.replace(/\.png$/, "");
}
export function productHref(p: Product): string {
  return `/product/${productSlug(p)}`;
}
export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => productSlug(p) === slug);
}

/* ---------- Per-product technical detail (for detail pages) ----------
   Identifiers below are standard published reference values for each
   compound. All copy is third-party / research-framed — no use claims. */
export interface ProductDetail {
  fullName: string;
  aliases?: string;
  cas?: string;
  formula?: string;
  molarMass?: string;
  sequence?: string;
  form: string;
  storage: string;
  /** Factual, third-person research context — what the molecule is and what it is studied for. */
  research: string;
  /** For blends: the co-formulated components. */
  components?: string[];
}

const STORAGE_LYO =
  "Store lyophilized powder at -20°C, protected from light. After reconstitution with bacteriostatic water, store at 2–8°C and use within ~4 weeks.";

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  "BPC-157": {
    fullName: "BPC-157 (Body Protection Compound-157)",
    aliases: "PL 14736, Bepecin",
    cas: "137525-51-0",
    formula: "C62H98N16O22",
    molarMass: "≈ 1419.5 g/mol",
    sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A synthetic 15-amino-acid peptide derived from a partial sequence of a protein found in gastric juice. Widely used in preclinical models studying angiogenesis and connective-tissue and gastrointestinal repair.",
  },
  "TB-500": {
    fullName: "TB-500 (Thymosin β4 / Tβ4)",
    aliases: "Thymosin Beta-4",
    cas: "77591-33-4",
    formula: "C212H350N56O78S",
    molarMass: "≈ 4963.4 g/mol",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A synthetic peptide based on thymosin β4, an actin-binding regulatory peptide. Investigated in cell-migration, angiogenesis and tissue-regeneration research models.",
  },
  Tirzepatide: {
    fullName: "Tirzepatide",
    aliases: "LY3298176, GIP/GLP-1 RA",
    cas: "2023788-19-2",
    formula: "C225H348N48O68",
    molarMass: "≈ 4813.5 g/mol",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A 39-amino-acid dual agonist of the GIP and GLP-1 receptors. Studied across glucose-metabolism, incretin-signaling and energy-balance research endpoints.",
  },
  Retatrutide: {
    fullName: "Retatrutide",
    aliases: "LY3437943, GGG tri-agonist",
    cas: "2381089-83-2",
    formula: "C221H342N46O68",
    molarMass: "≈ 4731.3 g/mol",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "An investigational triple agonist of the GIP, GLP-1 and glucagon receptors. Studied in metabolic, glucose-regulation and body-weight research models.",
  },
  "MOTS-c": {
    fullName: "MOTS-c (Mitochondrial ORF of the 12S rRNA type-c)",
    cas: "1627580-64-6",
    formula: "C101H152N28O22S",
    molarMass: "≈ 2174.6 g/mol",
    sequence: "Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A 16-amino-acid mitochondrial-derived peptide. Investigated in research on cellular metabolism, AMPK signaling and metabolic homeostasis.",
  },
  "CJC-1295": {
    fullName: "CJC-1295 (without DAC) / Modified GRF (1-29)",
    aliases: "Mod GRF 1-29",
    cas: "863288-34-0",
    formula: "C152H252N44O42",
    molarMass: "≈ 3367.9 g/mol",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A 29-amino-acid analog of growth-hormone-releasing hormone (GHRH). Used in research on growth-hormone secretion, frequently alongside a GH secretagogue.",
  },
  Ipamorelin: {
    fullName: "Ipamorelin",
    cas: "170851-70-4",
    formula: "C38H49N9O5",
    molarMass: "≈ 711.85 g/mol",
    sequence: "Aib-His-D-2-Nal-D-Phe-Lys-NH2",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A selective pentapeptide agonist of the ghrelin/GH-secretagogue receptor (GHSR). Studied in growth-hormone-release research models.",
  },
  "IGF-1-LR3": {
    fullName: "IGF-1 LR3 (Long R3 Insulin-like Growth Factor-1)",
    aliases: "Long R3 IGF-1",
    cas: "946870-92-4",
    formula: "C400H625N111O115S9",
    molarMass: "≈ 9117.6 g/mol",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "An 83-amino-acid analog of IGF-1 with extended half-life. Investigated in cellular-growth, proliferation and signaling research.",
  },
  "GHK-Cu": {
    fullName: "GHK-Cu (Copper Tripeptide-1)",
    aliases: "Copper Peptide GHK",
    cas: "49557-75-7",
    formula: "C14H24CuN6O4",
    molarMass: "≈ 403.9 g/mol",
    sequence: "Gly-His-Lys : Cu(II)",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A naturally occurring copper-binding tripeptide complex. Investigated in skin, collagen-synthesis and dermal-model research.",
  },
  "MT-2": {
    fullName: "Melanotan II (MT-2)",
    aliases: "MT-II",
    cas: "121062-08-6",
    formula: "C50H69N15O9",
    molarMass: "≈ 1024.2 g/mol",
    form: "Lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A synthetic cyclic analog of α-melanocyte-stimulating hormone (α-MSH) and a non-selective melanocortin-receptor agonist. Studied in pigmentation research models.",
  },
  "BPC-TB-Blend": {
    fullName: "BPC-157 + TB-500 Recovery Blend",
    form: "Co-formulated lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A co-formulated research blend of BPC-157 and TB-500 (thymosin β4), studied together in tissue-repair and regeneration research models.",
    components: ["BPC-157 — CAS 137525-51-0, C62H98N16O22", "TB-500 (Thymosin β4) — CAS 77591-33-4, C212H350N56O78S"],
  },
  "CJC-Ipa-Blend": {
    fullName: "CJC-1295 (no DAC) + Ipamorelin GH Blend",
    form: "Co-formulated lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A co-formulated research blend of the GHRH analog CJC-1295 (no DAC) and the GH-secretagogue Ipamorelin, studied together in growth-hormone-release research.",
    components: ["CJC-1295 (no DAC) — CAS 863288-34-0, C152H252N44O42", "Ipamorelin — CAS 170851-70-4, C38H49N9O5"],
  },
  GLOW: {
    fullName: "GLOW Stack (GHK-Cu + TB-500 + BPC-157)",
    form: "Co-formulated lyophilized powder",
    storage: STORAGE_LYO,
    research:
      "A co-formulated research blend of GHK-Cu, TB-500 (thymosin β4) and BPC-157, studied together in skin, recovery and tissue-repair research models.",
    components: [
      "GHK-Cu — CAS 49557-75-7, C14H24CuN6O4",
      "TB-500 (Thymosin β4) — CAS 77591-33-4, C212H350N56O78S",
      "BPC-157 — CAS 137525-51-0, C62H98N16O22",
    ],
  },
};

export function productDetail(p: Product): ProductDetail | undefined {
  return PRODUCT_DETAILS[p.code];
}

/** A few related products to surface as "frequently bought together". */
export function relatedProducts(p: Product, n = 3): Product[] {
  const sameCat = PRODUCTS.filter((x) => x.code !== p.code && x.category === p.category);
  const others = PRODUCTS.filter((x) => x.code !== p.code && x.category !== p.category);
  return [...sameCat, ...others].slice(0, n);
}

/* ============================================================
   UPSELL / AOV — volume tiers, free shipping, value + bundle math
   ============================================================ */

/** Free US shipping above this order subtotal (USD). */
export const FREE_SHIP_THRESHOLD = 99;

/** "Buy more, save more" — fraction off by unit quantity. */
export const VOLUME_TIERS: { min: number; off: number }[] = [
  { min: 5, off: 0.2 },
  { min: 3, off: 0.15 },
  { min: 2, off: 0.1 },
];
export function volumeDiscount(qty: number): number {
  for (const t of VOLUME_TIERS) if (qty >= t.min) return t.off;
  return 0;
}

/** The next volume tier above the current unit count — drives "add N more, save X%". */
export function nextVolumeTier(productUnits: number): { need: number; off: number } | null {
  const ascending = [...VOLUME_TIERS].sort((a, b) => a.min - b.min);
  for (const t of ascending) {
    if (productUnits < t.min) return { need: t.min - productUnits, off: t.off };
  }
  return null;
}

/** Numeric mg from a size label like "20 mg" -> 20. */
export function mgOf(s: SizeOption): number {
  const n = parseFloat(s.mg);
  return Number.isFinite(n) ? n : 0;
}
/** Price per mg for a size. */
export function perMg(s: SizeOption): number {
  const mg = mgOf(s);
  return mg > 0 ? s.price / mg : s.price;
}
/** Index of the lowest $/mg size (best value); -1 when only one size. */
export function bestValueSizeIndex(p: Product): number {
  if (p.sizes.length < 2) return -1;
  let bi = 0;
  let best = perMg(p.sizes[0]);
  p.sizes.forEach((s, i) => {
    const v = perMg(s);
    if (v < best) { best = v; bi = i; }
  });
  return bi;
}
/** % a size saves on a $/mg basis vs the priciest (smallest) size. */
export function sizeSavingsPct(p: Product, i: number): number {
  const worst = Math.max(...p.sizes.map(perMg));
  if (worst <= 0) return 0;
  return Math.round((1 - perMg(p.sizes[i]) / worst) * 100);
}

/** Bundle savings vs buying components separately (from compareAt). */
export function bundleSavings(p: Product): { compareAt: number; save: number; pct: number } | null {
  if (!p.compareAt) return null;
  const price = fromPrice(p);
  const save = p.compareAt - price;
  if (save <= 0) return null;
  return { compareAt: p.compareAt, save, pct: Math.round((save / p.compareAt) * 100) };
}

/* ---------- Accessories / consumables (high-attach add-ons) ---------- */
export type AccessoryIcon = "water" | "syringe" | "swab" | "vial";
export interface Accessory {
  code: string;
  name: string;
  sub: string;
  price: number;
  icon: AccessoryIcon;
}
export const ACCESSORIES: Accessory[] = [
  { code: "BAC-WATER", name: "Bacteriostatic Water", sub: "30 mL · for reconstitution", price: 11.99, icon: "water" },
  { code: "SYRINGES", name: "Insulin Syringes", sub: "0.5 mL · 31G · box of 10", price: 9.99, icon: "syringe" },
  { code: "SWABS", name: "Alcohol Prep Pads", sub: "Sterile · box of 100", price: 5.99, icon: "swab" },
  { code: "VIALS", name: "Sterile Empty Vials", sub: "10 mL · pack of 5", price: 12.99, icon: "vial" },
];

export function accessoryByCode(code: string): Accessory | undefined {
  return ACCESSORIES.find((a) => a.code === code);
}
export function productByCode(code: string): Product | undefined {
  return PRODUCTS.find((p) => p.code === code);
}

/* ============================================================
   CART ENGINE — resolution + cart-wide totals
   Single source of truth for cart math. The client cart computes
   these for DISPLAY; the server (placeOrder) recomputes the SAME
   way so client-tampered prices can never become an order total.
   ============================================================ */

/** Flat US shipping when an order is below the free-shipping threshold. Adjustable. */
export const FLAT_SHIPPING = 8.99;

export type LineKind = "product" | "accessory";

/** Minimal cart line as persisted/transmitted — identity is (code, sizeMg). */
export interface CartLineInput {
  code: string;
  /** Size label e.g. "20 mg"; null for accessories. */
  sizeMg: string | null;
  qty: number;
}

/** A cart line resolved against the catalog with display + price data. */
export interface ResolvedCartLine extends CartLineInput {
  kind: LineKind;
  name: string;
  /** Secondary label — size for products, descriptor for accessories. */
  sub: string;
  image: string | null;
  unitPrice: number;
  lineTotal: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Resolve a stored/transmitted cart line against the catalog.
 * Returns null if the code no longer exists (stale localStorage / tampering).
 * Products with an unknown size fall back to their first size.
 */
export function resolveCartLine(line: CartLineInput): ResolvedCartLine | null {
  const qty = Math.max(1, Math.floor(line.qty || 1));

  const product = productByCode(line.code);
  if (product) {
    const size = product.sizes.find((s) => s.mg === line.sizeMg) ?? product.sizes[0];
    return {
      code: product.code,
      sizeMg: size.mg,
      qty,
      kind: "product",
      name: product.name,
      sub: size.mg,
      image: product.image,
      unitPrice: size.price,
      lineTotal: round2(size.price * qty),
    };
  }

  const acc = accessoryByCode(line.code);
  if (acc) {
    return {
      code: acc.code,
      sizeMg: null,
      qty,
      kind: "accessory",
      name: acc.name,
      sub: acc.sub,
      image: null,
      unitPrice: acc.price,
      lineTotal: round2(acc.price * qty),
    };
  }

  return null;
}

/**
 * Cart-wide volume discount. Tiers apply to TOTAL peptide (product) units —
 * mix any 5 vials → 20% off. Accessories do not count toward the tier and
 * are not discounted.
 */
export function cartVolumeDiscount(productUnits: number): number {
  return volumeDiscount(productUnits);
}

export interface CartTotals {
  lines: ResolvedCartLine[];
  /** Total peptide units (drives the volume tier). */
  productUnits: number;
  /** Total units incl. accessories (header badge). */
  count: number;
  /** Subtotal of peptide lines (the discount base). */
  productSubtotal: number;
  /** Subtotal of everything. */
  subtotal: number;
  discountRate: number;
  /** Volume discount, applied to the peptide subtotal only. */
  discount: number;
  shipping: number;
  /** $ left to reach free shipping (0 once it qualifies). */
  freeShipRemaining: number;
  total: number;
}

/** Compute every cart number from raw line inputs. Pure — safe on client and server. */
export function computeCartTotals(inputs: CartLineInput[]): CartTotals {
  const lines = inputs
    .map(resolveCartLine)
    .filter((l): l is ResolvedCartLine => l !== null);

  const productLines = lines.filter((l) => l.kind === "product");
  const productUnits = productLines.reduce((n, l) => n + l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const productSubtotal = round2(productLines.reduce((s, l) => s + l.lineTotal, 0));
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));

  const discountRate = cartVolumeDiscount(productUnits);
  const discount = round2(productSubtotal * discountRate);

  const afterDiscount = round2(subtotal - discount);
  const qualifies = afterDiscount >= FREE_SHIP_THRESHOLD;
  const shipping = qualifies || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const freeShipRemaining = Math.max(0, round2(FREE_SHIP_THRESHOLD - afterDiscount));
  const total = round2(afterDiscount + shipping);

  return {
    lines,
    productUnits,
    count,
    productSubtotal,
    subtotal,
    discountRate,
    discount,
    shipping,
    freeShipRemaining,
    total,
  };
}
