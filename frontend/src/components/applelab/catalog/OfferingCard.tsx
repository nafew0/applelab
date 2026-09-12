import { Link } from '@/i18n/navigation'
import type { OfferingCard as OfferingCardData } from '@/lib/catalog'

export default function OfferingCard({
  offering,
  family,
  model,
  labels,
}: {
  offering: OfferingCardData
  family: string
  model: string
  labels: { from: string; quote: string; sameDay: string; hours: (n: number) => string; warranty: (n: number) => string }
}) {
  return (
    <Link
      href={`/services/${family}/${model}/${offering.issue.slug}`}
      className="offer-card"
      data-testid="offering-card"
    >
      <span className="offer-cat">{offering.issue.category}</span>
      <h4>{offering.issue.name}</h4>
      {offering.price_from ? (
        <span className="offer-price">
          {labels.from} <strong>{offering.price_from_display}</strong>
        </span>
      ) : (
        <span className="offer-price quote">{labels.quote}</span>
      )}
      <span className="offer-meta">
        <span>{offering.turnaround_hours ? labels.hours(offering.turnaround_hours) : labels.sameDay}</span>
        <span>{labels.warranty(offering.warranty_days)}</span>
      </span>
    </Link>
  )
}
