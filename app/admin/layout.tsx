import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | AnswerPlacement',
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
