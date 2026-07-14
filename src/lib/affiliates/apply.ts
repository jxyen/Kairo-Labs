'use server'
import { createPublicClient } from '@/lib/catalog/client'
import { applyAffiliateSchema, type ApplyAffiliateState } from './apply-schema'

export async function applyAffiliate(
  _prev: ApplyAffiliateState,
  formData: FormData,
): Promise<ApplyAffiliateState> {
  const parsed = applyAffiliateSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    primary_platform: formData.get('primary_platform'),
    primary_handle: formData.get('primary_handle'),
    audience_size: formData.get('audience_size'),
    other_links: formData.get('other_links') || undefined,
    niche: formData.get('niche'),
    promo_plan: formData.get('promo_plan'),
    experience: formData.get('experience') || undefined,
    website: formData.get('website') || undefined,
    referral_source: formData.get('referral_source') || undefined,
    agreed_terms: formData.get('agreed_terms') === 'on',
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createPublicClient()
  const { error } = await supabase.rpc('submit_affiliate_application', { p_app: parsed.data })
  if (error) return { ok: false, error: 'Something went wrong submitting your application. Please try again.' }

  return { ok: true }
}
