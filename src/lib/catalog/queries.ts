import { unstable_cache } from 'next/cache'
import { createPublicClient } from './client'
import {
  type Product, type Category, type SizeOption,
  productSlug,
} from '@/lib/products'
import { SEED_PRODUCTS } from '../../../scripts/seed-data'

/**
 * Supabase is only wired in deployed envs (NEXT_PUBLIC_* are inlined at build
 * time). When the keys are absent, or the DB is unreachable, we fall back to the
 * static seed so the storefront stays up instead of 500ing on a hard dependency.
 */
function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

type Row = {
  code: string; name: string; sub: string | null; category: string
  image: string | null; mechanism: string | null; tagline: string | null
  purity: string | null; rating: number | null; reviews: number | null
  bestseller: boolean; featured: boolean; blurb: string | null
  compare_at: number | null
  product_sizes: { id: string; mg: string; price: number }[]
}

function toProduct(r: Row): Product {
  const category = r.category as Category
  const sizes: SizeOption[] = [...r.product_sizes]
    .sort((a, b) => a.price - b.price)
    .map((s) => ({ id: s.id, mg: s.mg, price: Number(s.price) }))
  return {
    code: r.code, name: r.name, sub: r.sub ?? '', category,
    image: r.image ?? '', mechanism: r.mechanism ?? '', tagline: r.tagline ?? '',
    purity: r.purity ?? '', sizes,
    rating: Number(r.rating ?? 0), reviews: Number(r.reviews ?? 0),
    bestseller: r.bestseller, featured: r.featured, blurb: r.blurb ?? '',
    compareAt: r.compare_at ?? undefined,
  }
}

async function fetchCatalog(): Promise<Product[]> {
  if (!supabaseConfigured()) return SEED_PRODUCTS
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('products')
      .select('code,name,sub,category,image,mechanism,tagline,purity,rating,reviews,bestseller,featured,blurb,compare_at,product_sizes(id,mg,price)')
      .eq('active', true)
      .eq('is_accessory', false)
    if (error) throw error
    return (data as Row[]).map(toProduct)
  } catch (e) {
    console.warn('[catalog] Supabase fetch failed, using seed data:', (e as Error).message)
    return SEED_PRODUCTS
  }
}

export const getCatalog = unstable_cache(fetchCatalog, ['catalog'], { tags: ['catalog'], revalidate: 3600 })

async function fetchAccessories(): Promise<Product[]> {
  if (!supabaseConfigured()) return []
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('products')
      .select('code,name,sub,category,image,mechanism,tagline,purity,rating,reviews,bestseller,featured,blurb,compare_at,product_sizes(id,mg,price)')
      .eq('active', true)
      .eq('is_accessory', true)
    if (error) throw error
    return (data as Row[]).map(toProduct)
  } catch (e) {
    console.warn('[accessories] Supabase fetch failed, hiding add-ons:', (e as Error).message)
    return []
  }
}
export const getAccessories = unstable_cache(fetchAccessories, ['accessories'], { tags: ['catalog'], revalidate: 3600 })

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => productSlug(p) === slug)
}
export async function getFeatured(): Promise<Product[]> {
  return (await getCatalog()).filter((p) => p.featured)
}
export async function getBestsellers(): Promise<Product[]> {
  return (await getCatalog()).filter((p) => p.bestseller)
}
export async function getRelated(p: Product, n = 3): Promise<Product[]> {
  return (await getCatalog()).filter((x) => x.category === p.category && x.code !== p.code).slice(0, n)
}
