import { z } from 'zod'
import { CATEGORIES } from '@/lib/products'

const category = z.enum(CATEGORIES.filter((c) => c !== 'All') as [string, ...string[]])

export const sizeSchema = z.object({
  id: z.string().uuid().optional(),
  mg: z.string().min(1),
  price: z.number().positive(),
  sku: z.string().min(1),
})

export const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  sub: z.string().optional().default(''),
  category,
  image: z.string().optional().default(''),
  mechanism: z.string().optional().default(''),
  tagline: z.string().optional().default(''),
  purity: z.string().optional().default(''),
  blurb: z.string().optional().default(''),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.number().int().min(0).default(0),
  bestseller: z.boolean().default(false),
  featured: z.boolean().default(false),
  compareAt: z.number().positive().optional(),
  sizes: z.array(sizeSchema).min(1),
})

export type ProductInput = z.infer<typeof productSchema>
export type SizeInput = z.infer<typeof sizeSchema>
