'use client'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'

import type { ModelBrief } from '@/lib/catalog'

import ModelCard from './ModelCard'

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
const readHash = () => window.location.hash
const serverHash = () => ''

/**
 * Every model of a family in one continuous grid (newest first) with a year
 * filter. All cards are server-rendered, so crawlers see every model link;
 * the filter only hides cards. The chosen year lives in the URL hash (#y2024)
 * so a filtered view can be shared and survives reloads.
 */
export default function ModelBrowser({
  models,
  years,
  labels,
}: {
  models: ModelBrief[]
  years: number[]
  labels: { all: string; filter: string; showing: string; empty: string }
}) {
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash)
  const match = /^#y(\d{4})$/.exec(hash)
  const year = match && years.includes(Number(match[1])) ? Number(match[1]) : null
  const strip = useRef<HTMLDivElement>(null)
  const positioned = useRef(false)

  // On phones the chips are one swipeable row: bring the active one into view
  // by scrolling the row only (scrollIntoView would also move the page).
  useEffect(() => {
    const row = strip.current
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !active || row.scrollWidth <= row.clientWidth) return
    const offset = active.getBoundingClientRect().left - row.getBoundingClientRect().left
    // Instant for the year a shared link opens with (a smooth scroll can be cut
    // short by the page scrolling); smooth for taps.
    const behavior = positioned.current ? 'smooth' : 'auto'
    positioned.current = true
    row.scrollTo({ left: row.scrollLeft + offset - (row.clientWidth - active.offsetWidth) / 2, behavior })
  }, [year])

  const choose = (next: number | null) => {
    const url = `${window.location.pathname}${window.location.search}${next ? `#y${next}` : ''}`
    // replaceState: no history entry per click, no jump-scroll; notify the store ourselves.
    window.history.replaceState(window.history.state, '', url)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const model of models) {
      if (model.release_year) map.set(model.release_year, (map.get(model.release_year) ?? 0) + 1)
    }
    return map
  }, [models])

  const visible = year === null ? models : models.filter((model) => model.release_year === year)

  return (
    <div className="model-browser" data-testid="model-browser">
      {years.length > 1 ? (
        <div ref={strip} className="year-filter" role="group" aria-label={labels.filter} data-testid="year-filter">
          <button
            type="button"
            className="year-chip"
            aria-pressed={year === null}
            onClick={() => choose(null)}
            data-testid="year-chip-all"
          >
            {labels.all}
            <span className="year-chip-count">{models.length}</span>
          </button>
          {years.map((option) => (
            <button
              key={option}
              type="button"
              className="year-chip"
              aria-pressed={year === option}
              onClick={() => choose(option)}
              data-testid={`year-chip-${option}`}
            >
              {option}
              <span className="year-chip-count">{counts.get(option) ?? 0}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="model-browser-status" aria-live="polite" data-testid="model-browser-status">
        {labels.showing.replace('{count}', String(visible.length)).replace('{total}', String(models.length))}
      </p>

      {visible.length > 0 ? (
        <div className="model-grid" key={year ?? 'all'} data-testid="model-grid">
          {visible.map((model) => (
            <ModelCard key={model.slug} model={model} />
          ))}
        </div>
      ) : (
        <p className="sub">{labels.empty}</p>
      )}
    </div>
  )
}
