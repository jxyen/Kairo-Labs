import { z } from 'zod'

// Plain (non-'use server') module: shared by the client form and the server
// action. A "use server" file may only export async functions.

export const PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'X / Twitter',
  'Reddit',
  'Telegram',
  'Facebook',
  'Website / Blog',
  'Podcast',
  'Email list',
  'Other',
] as const

export const applyAffiliateSchema = z.object({
  full_name: z.string().min(1, 'Your name is required').max(120),
  email: z.email('Enter a valid email'),
  phone: z.string().max(40).optional(),
  primary_platform: z.enum(PLATFORMS, { message: 'Pick your main platform' }),
  primary_handle: z.string().min(1, 'Add your handle or profile URL').max(300),
  audience_size: z.string().min(1, 'Tell us your audience size').max(60),
  other_links: z.string().max(2000).optional(),
  niche: z.string().min(10, 'A little more detail helps us evaluate fit').max(2000),
  promo_plan: z.string().min(10, 'Tell us how you would promote Kairo Labs').max(2000),
  experience: z.string().max(2000).optional(),
  website: z.string().max(300).optional(),
  referral_source: z.string().max(300).optional(),
  agreed_terms: z.literal(true, { message: 'You must confirm eligibility to apply' }),
})

export type ApplyAffiliateInput = z.infer<typeof applyAffiliateSchema>
export type ApplyAffiliateState = { ok: true } | { ok: false; error: string } | null
