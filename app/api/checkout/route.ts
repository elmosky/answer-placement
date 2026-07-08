import { stripe, AUDIT_PRICE_CENTS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Pay-first: create a $29 Checkout Session and hand back its hosted URL.
// After payment, Stripe returns the user to /audit/result?session_id=… which
// verifies the session is paid before running the audit.
export async function POST(request: Request) {
  let url: string | undefined
  try {
    url = (await request.json())?.url
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'A url is required' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || 'https://answerplacement.com'

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: AUDIT_PRICE_CENTS,
            product_data: {
              name: 'AnswerPlacement Audit',
              description: 'Full SEO, AEO & GEO visibility audit with a prioritized fix list.',
            },
          },
        },
      ],
      metadata: { url: url.trim() },
      success_url: `${origin}/audit/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/audit`,
    })
    return Response.json({ redirectUrl: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start checkout'
    return Response.json({ error: message }, { status: 500 })
  }
}
