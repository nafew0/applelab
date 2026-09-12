import { Link } from '@/i18n/navigation'

export interface Crumb {
  href?: string
  label: string
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb" data-testid="breadcrumbs">
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="crumb">
            {index > 0 ? <span className="sep">›</span> : null}{' '}
            {item.href && !last ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current={last ? 'page' : undefined}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
