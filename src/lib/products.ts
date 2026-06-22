export type Category =
  | "Healing & Recovery"
  | "Metabolic"
  | "Growth"
  | "Cosmetic";

export type FilterCategory = "All" | Category;

export interface Product {
  code: string;
  name: string;
  sub: string;
  category: Category;
  purity: string;
  size: string;
  price: string;
  featured: boolean;
  blurb: string;
}

export const PRODUCTS: Product[] = [
  {
    code: "BPC-157",
    name: "BPC-157",
    sub: "Body Protection Compound",
    category: "Healing & Recovery",
    purity: "99.2%",
    size: "5 mg",
    price: "$42.99",
    featured: true,
    blurb: "Stable gastric peptide studied in tissue repair and recovery models.",
  },
  {
    code: "TB-500",
    name: "TB-500",
    sub: "Thymosin Beta-4 Fragment",
    category: "Healing & Recovery",
    purity: "99.4%",
    size: "10 mg",
    price: "$64.99",
    featured: true,
    blurb: "Actin-binding peptide used in regeneration and angiogenesis research.",
  },
  {
    code: "GLP-3",
    name: "GLP-3 Receptor",
    sub: "Receptor Agonist",
    category: "Metabolic",
    purity: "99.1%",
    size: "5 mg",
    price: "$89.99",
    featured: true,
    blurb: "Incretin-pathway agonist for metabolic and appetite-signaling research.",
  },
  {
    code: "Ipamorelin",
    name: "Ipamorelin",
    sub: "GH Secretagogue",
    category: "Growth",
    purity: "99.0%",
    size: "5 mg",
    price: "$39.99",
    featured: false,
    blurb: "Selective GHSR agonist used in growth-hormone release studies.",
  },
  {
    code: "CJC-1295",
    name: "CJC-1295 (No DAC)",
    sub: "GHRH Analog",
    category: "Growth",
    purity: "99.3%",
    size: "5 mg",
    price: "$44.99",
    featured: false,
    blurb: "GHRH analog frequently studied alongside secretagogues.",
  },
  {
    code: "GHK-Cu",
    name: "GHK-Cu",
    sub: "Copper Tripeptide",
    category: "Cosmetic",
    purity: "99.5%",
    size: "50 mg",
    price: "$54.99",
    featured: false,
    blurb: "Copper tripeptide investigated in skin and collagen models.",
  },
  {
    code: "Tesamorelin",
    name: "Tesamorelin",
    sub: "Stabilized GHRH",
    category: "Metabolic",
    purity: "99.2%",
    size: "5 mg",
    price: "$79.99",
    featured: false,
    blurb: "Stabilized GHRH studied for lipid and metabolic endpoints.",
  },
  {
    code: "Melanotan-II",
    name: "Melanotan II",
    sub: "Melanocortin Agonist",
    category: "Cosmetic",
    purity: "98.9%",
    size: "10 mg",
    price: "$34.99",
    featured: false,
    blurb: "Melanocortin receptor agonist used in pigmentation research.",
  },
];

export const FEATURED = PRODUCTS.filter((p) => p.featured);

export const CATEGORIES: FilterCategory[] = [
  "All",
  "Healing & Recovery",
  "Metabolic",
  "Growth",
  "Cosmetic",
];
