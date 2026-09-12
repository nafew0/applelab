import { Link } from '@/i18n/navigation'

/** Dark "not sure what's wrong?" card for the side column of catalog articles. */
export default function AsideCta({ title, body, button }: { title: string; body: string; button: string }) {
  return (
    <div className="aside-card dark" data-testid="aside-cta">
      <h3>{title}</h3>
      <p>{body}</p>
      <Link href="/f/demo" className="btn btn-primary">
        {button}
      </Link>
    </div>
  )
}
