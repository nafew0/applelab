'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'

type Msg = { from: 'bot' | 'user'; text: string; em?: string }

type ReplyKey = 'price' | 'screen' | 'battery' | 'track' | 'warranty' | 'hello' | 'fallback'

/** Keyword → canned reply key (both EN and BN keywords). */
const REPLY_RULES: Array<[RegExp, ReplyKey]> = [
  [/(price|cost|quote|kt|tk|৳|taka|দাম|খরচ|টাকা)/, 'price'],
  [/(screen|display|crack|broken|glass|স্ক্রিন|ডিসপ্লে|ভাঙা)/, 'screen'],
  [/(battery|charge|charging|ব্যাটারি|চার্জ)/, 'battery'],
  [/(track|status|ticket|ট্র্যাক|টিকিট|স্ট্যাটাস)/, 'track'],
  [/(warranty|guarantee|ওয়ারেন্টি|গ্যারান্টি)/, 'warranty'],
  [/(hi|hello|hey|asalam|salam|হাই|হ্যালো|সালাম)/, 'hello'],
]

function pickReplyKey(q: string): ReplyKey {
  const lc = q.toLowerCase()
  for (const [pattern, key] of REPLY_RULES) {
    if (pattern.test(lc)) return key
  }
  return 'fallback'
}

/**
 * Floating AppleBot widget (Apple Lab design). Canned, localized replies from
 * messages `applelab.chat` — the real assistant is a post-MVP phase.
 */
export default function ChatWidget() {
  const t = useTranslations('applelab.chat')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>(() => [
    { from: 'bot', text: t('greeting') },
    { from: 'bot', text: t('tryPrefix'), em: t('tryExample') },
  ])
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
    const reply = t(`replies.${pickReplyKey(val)}`)
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'bot', text: reply }])
    }, 600)
  }

  return (
    <>
      <button
        id="chat-trigger"
        className="chat-trigger"
        type="button"
        aria-label={t('open')}
        onClick={() => setOpen((v) => !v)}
      >
        <img src="/applelab/icon-white.svg" alt="" aria-hidden="true" />
      </button>

      <div
        id="chat-window"
        className={`chat-window${open ? ' open' : ''}`}
        role="dialog"
        aria-label={t('windowLabel')}
      >
        <div className="chat-header">
          <div className="avatar">
            <img src="/applelab/icon-white.svg" alt="" />
          </div>
          <div className="who">
            <strong>{t('title')}</strong>
            <span>{t('subtitle')}</span>
          </div>
          <button
            id="chat-close"
            className="chat-close"
            type="button"
            aria-label={t('close')}
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
            placeholder={t('placeholder')}
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            ref={inputRef}
          />
          <button type="submit" aria-label={t('send')}>
            <svg>
              <use href="#i-send" />
            </svg>
          </button>
        </form>
      </div>
    </>
  )
}
