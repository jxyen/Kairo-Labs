'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateCredentials } from '@/lib/auth/validate'

export async function login(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const invalid = validateCredentials(email, password)
  if (invalid) return { error: invalid }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
