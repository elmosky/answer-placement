import 'server-only'
import type { AdminConfig } from '@elmosky/factory-admin/server'

/** Server copy of the /admin config (app/admin/page.tsx holds the client copy). */
export const adminConfig: AdminConfig = {
  site: { name: 'AnswerPlacement', slug: 'answerplacement', url: 'https://answerplacement.com' },
  panels: {
    blog: { enabled: true, postPath: ({ slug }) => `/blog/${slug}`, dripQueue: false },
    subscribers: { enabled: false },
    data: {
      enabled: true,
      tables: [
        {
          label: 'Audits',
          table: 'answerplacement_audits',
          select: 'created_at, url, email, seo_score, aeo_score, geo_score, stripe_session_id',
          order: 'created_at.desc',
          limit: 50,
          siteScoped: false,
        },
      ],
    },
    traffic: { enabled: true },
    health: { enabled: false },
  },
}
