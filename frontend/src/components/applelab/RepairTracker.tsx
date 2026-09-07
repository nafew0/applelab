'use client'
import { useRef, useState, type FormEvent } from 'react'

/**
 * Repair status widget. Demo behaviour for now: submitting reveals the sample
 * timeline. Wiring it to the leads pipeline is a later phase.
 */
export default function RepairTracker() {
  const [showResult, setShowResult] = useState(true)
  const idRef = useRef<HTMLInputElement>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!idRef.current?.value.trim()) {
      idRef.current?.focus()
      return
    }
    setShowResult(true)
  }

  return (
    <div className="tracker-card reveal">
      <form className="tracker-form" id="tracker-form" autoComplete="off" onSubmit={onSubmit}>
        <input id="tracker-id" type="text" placeholder="Ticket ID  (e.g. APL-2026-04821)" ref={idRef} />
        <input id="tracker-phone" type="text" placeholder="Last 4 of phone" />
        <button type="submit" className="btn btn-primary">
          Track
        </button>
      </form>

      <div
        className={`tracker-result${showResult ? ' active' : ''}`}
        id="tracker-result"
        aria-live="polite"
      >
        <div className="tracker-meta">
          <span className="ticket">APL-2026-04821</span>
          <span className="device">MacBook Pro 14&quot; · Screen replacement</span>
          <span className="label">Estimated ready: tomorrow, 4:00 PM</span>
        </div>

        <div className="timeline" role="list">
          <div className="step-dot done" role="listitem">
            <div className="ring">✓</div>
            <div className="name">Received</div>
          </div>
          <div className="step-dot done" role="listitem">
            <div className="ring">✓</div>
            <div className="name">Diagnosed</div>
          </div>
          <div className="step-dot active" role="listitem">
            <div className="ring">3</div>
            <div className="name">In repair</div>
          </div>
          <div className="step-dot" role="listitem">
            <div className="ring">4</div>
            <div className="name">Quality test</div>
          </div>
          <div className="step-dot" role="listitem">
            <div className="ring">5</div>
            <div className="name">Ready</div>
          </div>
        </div>

        <div className="tracker-status-line">
          <span className="pulse" />
          <span>
            Your MacBook is with our engineers — display installed, currently in 24-hour burn-in
            test.
          </span>
        </div>
      </div>
    </div>
  )
}
