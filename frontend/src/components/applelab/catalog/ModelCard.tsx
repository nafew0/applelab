import { Link } from '@/i18n/navigation'
import { modelFacts, type ModelBrief } from '@/lib/catalog'

export default function ModelCard({ model }: { model: ModelBrief }) {
  const facts = modelFacts(model)
  return (
    <Link href={`/services/${model.family}/${model.slug}`} className="model-card" data-testid="model-card">
      <h4>{model.name}</h4>
      {facts.length ? <div className="model-meta">{facts.join(' · ')}</div> : null}
      {model.line && model.line !== 'standard' ? <span className="model-line">{model.line}</span> : null}
    </Link>
  )
}
