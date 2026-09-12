import type { FaqItem } from '@/lib/catalog'

export default function FaqList({ items, heading }: { items: FaqItem[]; heading: string }) {
  if (!items.length) return null
  return (
    <div className="faq-block reveal" data-testid="catalog-faq">
      <h2 className="h-lg">{heading}</h2>
      <div className="faq">
        {items.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <div className="faq-a" dangerouslySetInnerHTML={{ __html: item.answer_html }} />
          </details>
        ))}
      </div>
    </div>
  )
}
