import Stripe from 'stripe'

// Server-only. Uses the restricted live key (Checkout Sessions scope).
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key)
}

export const AUDIT_PRICE_CENTS = 2900 // $29 one-time
