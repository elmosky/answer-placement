import type { BankRate } from '@/lib/types'

export function RatesTable({ rates, compact = false }: { rates: BankRate[]; compact?: boolean }) {
  return (
    <div
      className="overflow-x-auto"
      style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-xs uppercase tracking-wider"
            style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
          >
            <th className="text-left px-4 py-3">Bank</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-left px-4 py-3">APY</th>
            <th className="text-left px-4 py-3">Min</th>
            {!compact && <th className="text-left px-4 py-3">Lock-up</th>}
            {!compact && <th className="text-left px-4 py-3">Protection</th>}
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate, i) => (
            <tr
              key={rate.id}
              className="transition-colors"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <span
                      className="text-xs px-2 py-0.5 font-medium shrink-0"
                      style={{
                        background: 'var(--color-accent)',
                        color: 'var(--color-brand)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      Top pick
                    </span>
                  )}
                  <span className="font-semibold">{rate.name}</span>
                </div>
              </td>
              <td className="px-4 py-4" style={{ color: 'var(--color-muted-foreground)' }}>{rate.type}</td>
              <td className="px-4 py-4">
                <span className="font-bold text-base" style={{ color: 'var(--color-brand)' }}>
                  {rate.apy}%
                </span>
              </td>
              <td className="px-4 py-4" style={{ color: 'var(--color-muted-foreground)' }}>
                {rate.min_deposit === 0 ? '$0' : `$${rate.min_deposit.toLocaleString()}`}
              </td>
              {!compact && (
                <td className="px-4 py-4" style={{ color: 'var(--color-muted-foreground)' }}>{rate.lockup}</td>
              )}
              {!compact && (
                <td className="px-4 py-4" style={{ color: 'var(--color-muted-foreground)' }}>{rate.protection}</td>
              )}
              <td className="px-4 py-4">
                <a
                  href={rate.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="text-xs font-semibold px-3 py-1.5 transition-colors whitespace-nowrap inline-block"
                  style={{
                    background: 'var(--color-brand)',
                    color: '#fff',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
