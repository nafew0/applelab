'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'

type Msg = { from: 'bot' | 'user'; text: string; em?: string }

const INITIAL: Msg[] = [
  {
    from: 'bot',
    text: "Hi! 👋 I'm AppleBot — ask me about prices, repair times, or how to book. I can also help track a repair.",
  },
  { from: 'bot', text: 'Try: ', em: '"How much for an iPhone 13 screen?"' },
]

function pickBotReply(q: string): string {
  const lc = q.toLowerCase()
  if (/(price|cost|quote|kt|tk|৳|taka)/.test(lc))
    return 'Most repairs start with a free diagnosis — once we know what is needed we send a fixed quote. Type your device + issue (e.g. “iPhone 13 screen”) and I will share a starting price.'
  if (/(screen|display|crack|broken|glass)/.test(lc))
    return 'Screen replacements use genuine Apple-grade parts. Service usually completes within 24 hours. Want me to start a booking?'
  if (/(battery|charge|charging)/.test(lc))
    return 'Battery service for iPhone, MacBook, iPad and Apple Watch — original cells, 90-day warranty. Free health check on walk-in.'
  if (/(track|status|ticket)/.test(lc))
    return 'You can track any repair with your ticket ID right on the homepage — or paste it here and I will look it up.'
  if (/(warranty|guarantee)/.test(lc))
    return 'Every repair is covered by our 90-day warranty. No-fix, no-fee — if we cannot fix it, you owe nothing.'
  if (/(hi|hello|hey|asalam|salam)/.test(lc))
    return 'Hi! I am AppleBot — ask me about prices, repair times, or how to book. I can also help track a repair.'
  return 'Got it. A human engineer can take over any time — tap “Book a Repair” at the top, or share your device + issue here and I will guide you.'
}

/**
 * Floating AppleBot widget. Canned replies for now — the real assistant lands
 * in a later phase (see the content plan's feature spec).
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>(INITIAL)
  const [value, setValue] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const val = value.trim()
    if (!val) return
    setMessages((m) => [...m, { from: 'user', text: val }])
    setValue('')
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'bot', text: pickBotReply(val) }])
    }, 600)
  }

  return (
    <>
      <button
        id="chat-trigger"
        className="chat-trigger"
        type="button"
        aria-label="Chat with AppleBot"
        onClick={() => setOpen((v) => !v)}
      >
        <img src="/applelab/icon-white.svg" alt="" aria-hidden="true" />
      </button>

      <div
        id="chat-window"
        className={`chat-window${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Apple Lab chat assistant"
      >
        <div className="chat-header">
          <div className="avatar">
            <img src="/applelab/icon-white.svg" alt="" />
          </div>
          <div className="who">
            <strong>AppleBot</strong>
            <span>AI-powered · usually replies instantly</span>
          </div>
          <button
            id="chat-close"
            className="chat-close"
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            <svg width="16" height="16">
              <use href="#i-x" />
            </svg>
          </button>
        </div>
        <div className="chat-body" id="chat-body" ref={bodyRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.from}`}>
              {m.text}
              {m.em ? <em>{m.em}</em> : null}
            </div>
          ))}
        </div>
        <form className="chat-input" id="chat-form" onSubmit={onSubmit}>
          <input
            id="chat-input"
            type="text"
            placeholder="Type a message…"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            ref={inputRef}
          />
          <button type="submit" aria-label="Send">
            <svg>
              <use href="#i-send" />
            </svg>
          </button>
        </form>
      </div>
    </>
  )
}
