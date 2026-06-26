export function validateCredentials(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!password) return 'Password is required.'
  if (!email.includes('@')) return 'Enter a valid email.'
  return null
}
