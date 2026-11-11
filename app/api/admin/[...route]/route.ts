import { revalidatePath } from 'next/cache'
import { createAdminRoutes } from '@elmosky/factory-admin/server'
import { adminConfig } from '@/lib/admin-config'

/** Every /api/admin/* endpoint: sign-in, posts, publish, data, traffic. */
const routes = createAdminRoutes(adminConfig)

type Handler = typeof routes.POST

/**
 * Blog pages are cached for an hour, so a save, publish or delete would not
 * show until then. After a successful write this marks every page stale, and
 * each one rebuilds once on its next visit.
 *
 * auth/* is skipped because auth/request needs no session and answers 200 for
 * any address, so counting it would let anyone empty the cache with a POST.
 * Every other write route checks the session first.
 */
const revalidateAfter =
  (handler: Handler): Handler =>
  async (req, ctx) => {
    const res = await handler(req, ctx)
    const { route = [] } = await ctx.params
    if (res.ok && route[0] !== 'auth') revalidatePath('/', 'layout')
    return res
  }

export const GET = routes.GET
export const POST = revalidateAfter(routes.POST)
export const PATCH = revalidateAfter(routes.PATCH)
export const DELETE = revalidateAfter(routes.DELETE)

export const dynamic = 'force-dynamic'
