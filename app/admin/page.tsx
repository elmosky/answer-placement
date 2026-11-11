'use client'

import { AdminApp } from '@elmosky/factory-admin'

/**
 * The factory CMS (@elmosky/factory-admin): posts, paid audits, traffic.
 * Same config as lib/admin-config.ts, repeated here in its client-safe shape
 * because that file is server-only.
 */
export default function AdminPage() {
  return (
    <AdminApp
      config={{
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
      }}
    />
  )
}
