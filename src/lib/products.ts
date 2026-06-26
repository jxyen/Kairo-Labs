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
  /** Studio product photo (public/products/*.png). */
  image: string;
  purity: string;
  sizes: SizeOption[];
  rating: number;
  reviews: number;
  bestseller: boolean;
  featured: boolean;
  blurb: string;
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
    image: "/products/bpc-157.png",
    purity: "99.2%",
    sizes: [
      { mg: "5 mg", price: 23.99 },
      { mg: "20 mg", price: 47.99 },
    ],
    rating: 4.9,
    reviews: 318,
    bestseller: true,
    featured: true,
    blurb: "Stable gastric peptide studied in tissue repair and recovery models.",
  },
  {
    code: "TB-500",
    name: "TB-500",
    sub: "Thymosin Beta-4 Fragment",
    category: "Recovery & Repair",
    image: "/products/tb-500.png",
    purity: "99.4%",
    sizes: [
      { mg: "5 mg", price: 37.99 },
      { mg: "10 mg", price: 63.99 },
    ],
    rating: 4.8,
    reviews: 241,
    bestseller: true,
    featured: true,
    blurb: "Actin-binding peptide used in regeneration and angiogenesis research.",
  },

  // ----- Metabolic & Weight -----
  {
    code: "Tirzepatide",
    name: "Tirzepatide",
    sub: "GLP-1 / GIP Co-Agonist",
    category: "Metabolic & Weight",
    image: "/products/tirzepatide.png",
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
    image: "/products/retatrutide.png",
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
    image: "/products/mots-c.png",
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
    image: "/products/cjc-1295.png",
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
    image: "/products/ipamorelin.png",
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
    image: "/products/igf-1-lr3.png",
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
    image: "/products/ghk-cu.png",
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
    image: "/products/mt-2.png",
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
    image: "/products/bpc-tb-blend.png",
    purity: "99.2%",
    sizes: [{ mg: "20 mg", price: 79.99 }],
    rating: 4.9,
    reviews: 188,
    bestseller: true,
    featured: false,
    blurb: "Co-formulated recovery stack studied in repair and regeneration models.",
  },
  {
    code: "CJC-Ipa-Blend",
    name: "CJC-1295 + Ipamorelin",
    sub: "Growth-Hormone Stack",
    category: "Blends & Stacks",
    image: "/products/cjc-ipa-blend.png",
    purity: "99.1%",
    sizes: [{ mg: "10 mg", price: 47.99 }],
    rating: 4.8,
    reviews: 156,
    bestseller: true,
    featured: false,
    blurb: "GHRH + secretagogue blend studied together in GH-release research.",
  },
  {
    code: "GLOW",
    name: "GLOW Stack",
    sub: "GHK-Cu + TB-500 + BPC-157",
    category: "Blends & Stacks",
    image: "/products/glow.png",
    purity: "99.2%",
    sizes: [{ mg: "70 mg", price: 87.99 }],
    rating: 4.9,
    reviews: 142,
    bestseller: true,
    featured: false,
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
