'use client'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Repair status widget (Apple Lab design). DEMO behaviour for now: submitting
 * reveals a sample timeline from messages `applelab.tracker.demo`. The real
 * lookup against the leads pipeline arrives in AL-4.
 */
export default function RepairTracker() {
  const t = useTranslations('applelab.tracker')
  const [showResult, setShowResult] = useState(true)
  const idRef = useRef<HTMLInputElement>(null)
  const steps = t.raw('demo.steps') as string[]
  const activeIndex = 2

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!idRef.current?.value.trim()) {
      idRef.current?.focus()
      return
    }
    setShowResult(true)
  }

  return (
    <div className="tracker-card reveal" data-testid="repair-tracker">
      <form className="tracker-form" id="tracker-form" autoComplete="off" onSubmit={onSubmit}>
        <input id="tracker-id" type="text" placeholder={t('idPlaceholder')} ref={idRef} />
        <input id="tracker-phone" type="text" placeholder={t('phonePlaceholder')} />
        <button type="submit" className="btn btn-primary">
          {t('submit')}
        </button>
      </form>

      <div
        className={`tracker-result${showResult ? ' active' : ''}`}
        id="tracker-result"
        aria-live="polite"
      >
        <div className="tracker-meta">
          <span className="ticket">{t('demo.ticket')}</span>
          <span className="device">{t('demo.device')}</span>
          <span className="label">{t('demo.eta')}</span>
        </div>

        <div className="timeline" role="list">
          {steps.map((name, index) => (
            <div
              key={name}
              className={`step-dot${index < activeIndex ? ' done' : index === activeIndex ? ' active' : ''}`}
              role="listitem"
            >
              <div className="ring">{index < activeIndex ? '✓' : index + 1}</div>
              <div className="name">{name}</div>
            </div>
          ))}
        </div>

        <div className="tracker-status-line">
          <span className="pulse" />
          <span>{t('demo.statusLine')}</span>
        </div>
      </div>
    </div>
  )
}
