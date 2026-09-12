import { Link } from '@/i18n/navigation'
import type { IssueBrief } from '@/lib/catalog'

/**
 * Repair types as a quiet icon + name list on hairline dividers. Columns come
 * from the container (`.issue-list` = 4 across, `.issue-list.stacked` = one).
 * Pass `hrefFor` to make each row a link.
 */
export default function IssueList({
  issues,
  hrefFor,
  stacked = false,
  testId,
}: {
  issues: IssueBrief[]
  hrefFor?: (issue: IssueBrief) => string
  stacked?: boolean
  testId?: string
}) {
  return (
    <ul className={`issue-list${stacked ? ' stacked' : ''}`} data-testid={testId}>
      {issues.map((issue) => {
        const body = (
          <>
            <span className="issue-ic" aria-hidden="true">
              {issue.image ? <img src={issue.image} alt="" loading="lazy" decoding="async" /> : null}
            </span>
            <span className="issue-name">{issue.name}</span>
          </>
        )
        return (
          <li key={issue.slug}>
            {hrefFor ? (
              <Link href={hrefFor(issue)} className="issue-row">
                {body}
              </Link>
            ) : (
              <span className="issue-row">{body}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
