'use client'
import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import type { CatalogImageKind, ContentStatus, FaqItem, OfferingAdmin, PriceOption } from '@/services/adminCatalog'
import { getErrorDetail, getErrorStatus, removeCatalogImage, uploadCatalogImage } from '@/services/adminCatalog'
import { cn } from '@/lib/utils'

export type FieldErrors = Record<string, string>

// ---------------------------------------------------------------- Layout bits

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
    >
      {children}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-600">{message}</p>
}

/** Label + control + inline error. */
export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode
  error?: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
      <FieldError message={error} />
    </div>
  )
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-t border-[rgb(var(--theme-border-rgb)/0.7)] pt-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function ErrorPanel({ error, subject }: { error: unknown; subject: string }) {
  const status = getErrorStatus(error)
  const message =
    status === 403
      ? `You do not have permission to view ${subject}.`
      : status === 404
        ? `${subject[0].toUpperCase()}${subject.slice(1)} could not be found.`
        : `Could not load ${subject} right now.`
  return <div className="theme-panel rounded-[1.8rem] p-6 text-sm text-rose-600">{message}</div>
}

export function LoadingPanel({ label }: { label: string }) {
  return <div className="theme-panel rounded-[1.8rem] p-6 text-sm text-muted-foreground">{label}</div>
}

/** Native select styled like the other inputs (keeps dialogs keyboard-friendly). */
export function NativeSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------- Bilingual pair

/** Side-by-side EN / BN inputs (or textareas) for one bilingual field. */
export function BilingualPair({
  label,
  valueEn,
  valueBn,
  onChangeEn,
  onChangeBn,
  errorEn,
  errorBn,
  multiline = false,
  rows = 4,
  placeholderEn,
  placeholderBn,
  required = false,
  hint,
  disabled,
  testIdEn,
}: {
  label: string
  valueEn: string
  valueBn: string
  onChangeEn: (value: string) => void
  onChangeBn: (value: string) => void
  errorEn?: string
  errorBn?: string
  multiline?: boolean
  rows?: number
  placeholderEn?: string
  placeholderBn?: string
  required?: boolean
  hint?: React.ReactNode
  disabled?: boolean
  testIdEn?: string
}) {
  const Control = multiline ? Textarea : Input
  return (
    <div>
      <FieldLabel>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Control
            value={valueEn}
            onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChangeEn(event.target.value)
            }
            placeholder={placeholderEn ?? 'English'}
            rows={multiline ? rows : undefined}
            disabled={disabled}
            data-testid={testIdEn}
            className={multiline ? 'font-mono text-xs' : undefined}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">EN</p>
          <FieldError message={errorEn} />
        </div>
        <div>
          <Control
            value={valueBn}
            onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChangeBn(event.target.value)
            }
            placeholder={placeholderBn ?? 'বাংলা'}
            rows={multiline ? rows : undefined}
            disabled={disabled}
            className={multiline ? 'font-mono text-xs' : undefined}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">BN</p>
          <FieldError message={errorBn} />
        </div>
      </div>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------- SEO counters

export const SEO_TITLE_GOOD = 60
export const SEO_TITLE_WARN = 70
export const SEO_DESCRIPTION_GOOD = 160

function counterTone(length: number, good: number, warn: number) {
  if (length === 0) return 'text-muted-foreground'
  if (length <= good) return 'text-emerald-600'
  if (length <= warn) return 'text-amber-600'
  return 'text-rose-600'
}

export function SeoCounter({ value, kind }: { value: string; kind: 'title' | 'description' }) {
  const length = value.length
  const good = kind === 'title' ? SEO_TITLE_GOOD : SEO_DESCRIPTION_GOOD
  const warn = kind === 'title' ? SEO_TITLE_WARN : SEO_DESCRIPTION_GOOD
  return (
    <span className={cn('font-mono text-[11px]', counterTone(length, good, warn))}>
      {length}/{good}
    </span>
  )
}

/** One SEO field (EN + BN) with a live character counter under each input. */
export function SeoPair({
  label,
  kind,
  valueEn,
  valueBn,
  onChangeEn,
  onChangeBn,
  errorEn,
  errorBn,
}: {
  label: string
  kind: 'title' | 'description'
  valueEn: string
  valueBn: string
  onChangeEn: (value: string) => void
  onChangeBn: (value: string) => void
  errorEn?: string
  errorBn?: string
}) {
  const multiline = kind === 'description'
  const Control = multiline ? Textarea : Input
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['EN', valueEn, onChangeEn, errorEn],
            ['BN', valueBn, onChangeBn, errorBn],
          ] as Array<[string, string, (value: string) => void, string | undefined]>
        ).map(([lang, value, onChange, error]) => (
          <div key={lang}>
            <Control
              value={value}
              onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange(event.target.value)
              }
              rows={multiline ? 3 : undefined}
              className={multiline ? 'min-h-[72px]' : undefined}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{lang}</span>
              <SeoCounter value={value} kind={kind} />
            </div>
            <FieldError message={error} />
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {kind === 'title'
          ? `Aim for ${SEO_TITLE_GOOD} characters or fewer; up to ${SEO_TITLE_WARN} is tolerated.`
          : `Aim for ${SEO_DESCRIPTION_GOOD} characters or fewer.`}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------- FAQ editor

export const EMPTY_FAQ_ITEM: FaqItem = { q_en: '', q_bn: '', a_en: '', a_bn: '' }

export function normalizeFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => ({
    q_en: String((item as FaqItem)?.q_en ?? ''),
    q_bn: String((item as FaqItem)?.q_bn ?? ''),
    a_en: String((item as FaqItem)?.a_en ?? ''),
    a_bn: String((item as FaqItem)?.a_bn ?? ''),
  }))
}

/** Drops rows where every field is blank (so the owner can leave an unused row). */
export function cleanFaq(items: FaqItem[]): FaqItem[] {
  return items.filter((item) => item.q_en.trim() || item.q_bn.trim() || item.a_en.trim() || item.a_bn.trim())
}

export function FaqEditor({
  items,
  onChange,
  label = 'FAQ',
  hint,
  error,
  disabled,
}: {
  items: FaqItem[]
  onChange: (items: FaqItem[]) => void
  label?: string
  hint?: React.ReactNode
  error?: string
  disabled?: boolean
}) {
  const update = (index: number, patch: Partial<FaqItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))
  const add = () => onChange([...items, { ...EMPTY_FAQ_ITEM }])

  return (
    <div data-testid="faq-editor">
      <div className="mb-1 flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={add} disabled={disabled}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add question
        </Button>
      </div>
      {hint ? <p className="mb-2 text-[11px] text-muted-foreground">{hint}</p> : null}
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[rgb(var(--theme-border-rgb)/0.8)] px-3 py-3 text-center text-xs text-muted-foreground">
          No questions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-[rgb(var(--theme-border-rgb)/0.8)] bg-white/60 p-3"
              data-testid={`faq-row-${index}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-rose-600 hover:text-rose-700"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => remove(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={item.q_en}
                  placeholder="Question (EN)"
                  onChange={(event) => update(index, { q_en: event.target.value })}
                  disabled={disabled}
                />
                <Input
                  value={item.q_bn}
                  placeholder="প্রশ্ন (BN)"
                  onChange={(event) => update(index, { q_bn: event.target.value })}
                  disabled={disabled}
                />
                <Textarea
                  value={item.a_en}
                  placeholder="Answer (EN)"
                  rows={2}
                  className="min-h-[60px]"
                  onChange={(event) => update(index, { a_en: event.target.value })}
                  disabled={disabled}
                />
                <Textarea
                  value={item.a_bn}
                  placeholder="উত্তর (BN)"
                  rows={2}
                  className="min-h-[60px]"
                  onChange={(event) => update(index, { a_bn: event.target.value })}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <FieldError message={error} />
    </div>
  )
}

// ---------------------------------------------------------------- Price options editor

export const EMPTY_PRICE_OPTION: PriceOption = { label: '', price: '', warranty_days: null }

export function normalizePriceOptions(value: unknown): PriceOption[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const record = (item ?? {}) as Partial<PriceOption>
    const warranty = record.warranty_days
    return {
      label: String(record.label ?? ''),
      price: record.price === null || record.price === undefined ? '' : String(record.price),
      warranty_days:
        warranty === null || warranty === undefined || warranty === ('' as unknown) ? null : Number(warranty),
    }
  })
}

export function cleanPriceOptions(items: PriceOption[]): PriceOption[] {
  return items.filter((item) => item.label.trim() || item.price.trim())
}

export function PriceOptionsEditor({
  items,
  onChange,
  error,
  disabled,
}: {
  items: PriceOption[]
  onChange: (items: PriceOption[]) => void
  error?: string
  disabled?: boolean
}) {
  const update = (index: number, patch: Partial<PriceOption>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }
  return (
    <div data-testid="price-options-editor">
      <div className="mb-1 flex items-center justify-between">
        <FieldLabel>Price options</FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => onChange([...items, { ...EMPTY_PRICE_OPTION }])}
          disabled={disabled}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add option
        </Button>
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        Optional tiers shown on the public page (e.g. &quot;Original&quot; vs &quot;Compatible&quot; part).
      </p>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[rgb(var(--theme-border-rgb)/0.8)] px-3 py-3 text-center text-xs text-muted-foreground">
          No price tiers. The single &quot;price from&quot; is used.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_7rem_6rem_auto] items-center gap-2">
              <Input
                value={item.label}
                placeholder="Label"
                onChange={(event) => update(index, { label: event.target.value })}
                disabled={disabled}
              />
              <Input
                value={item.price}
                placeholder="Price"
                inputMode="decimal"
                onChange={(event) => update(index, { price: event.target.value })}
                disabled={disabled}
              />
              <Input
                value={item.warranty_days ?? ''}
                placeholder="Warranty d"
                type="number"
                min={0}
                onChange={(event) =>
                  update(index, {
                    warranty_days: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg text-rose-600 hover:text-rose-700"
                aria-label={`Remove option ${index + 1}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                disabled={disabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <FieldError message={error} />
    </div>
  )
}

// ---------------------------------------------------------------- Badges

const STATUS_VARIANT: Record<ContentStatus, 'warning' | 'secondary' | 'success'> = {
  draft: 'warning',
  review: 'secondary',
  published: 'success',
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant={STATUS_VARIANT[status] ?? 'warning'}>{status}</Badge>
}

export function ActiveBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return <Badge variant={active ? 'success' : 'warning'}>{active ? activeLabel : inactiveLabel}</Badge>
}

export const MIN_INDEXABLE_WORDS = 250

/** Explains why an offering page is (not) indexable, mirroring the backend policy. */
export function indexableReason(offering: OfferingAdmin): string {
  if (offering.index_policy === 'noindex') return 'policy: noindex'
  if (offering.index_policy === 'index') return 'policy: index'
  if (offering.content_status !== 'published') return `${offering.content_status}, not published`
  if (offering.unique_words < MIN_INDEXABLE_WORDS) {
    return `needs ${MIN_INDEXABLE_WORDS} words (has ${offering.unique_words})`
  }
  return `published + ${offering.unique_words} words`
}

export function IndexableBadge({ offering }: { offering: OfferingAdmin }) {
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Badge variant={offering.is_indexable ? 'success' : 'outline'}>
        {offering.is_indexable ? 'Indexable' : 'Not indexed'}
      </Badge>
      <span className="text-[11px] text-muted-foreground">{indexableReason(offering)}</span>
    </span>
  )
}

// ---------------------------------------------------------------- Helpers

/** "A2483, A2633" → ["A2483", "A2633"] */
export function parseModelNumbers(value: string): string[] {
  return value
    .split(/[,\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

/** "" → null so blank price inputs mean "quote". */
export function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function formatPrice(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Quote'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `৳${number.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export const TEMPLATE_VARIABLES: Array<{ token: string; meaning: string }> = [
  { token: '{{model.name}}', meaning: 'Model name, e.g. "iPhone 15 Pro"' },
  { token: '{{model.chip}}', meaning: 'Chip, e.g. "A17 Pro"' },
  { token: '{{model.year}}', meaning: 'Release year' },
  { token: '{{family.name}}', meaning: 'Family name, e.g. "iPhone"' },
  { token: '{{issue.name}}', meaning: 'Issue name, e.g. "Screen replacement"' },
  { token: '{{price_from}}', meaning: 'Formatted starting price of the offering' },
  { token: '{{brand}}', meaning: 'Business name from branding settings' },
  { token: '{{city}}', meaning: 'City from branding settings' },
]

export function TemplateVariablesHelp() {
  return (
    <div className="rounded-xl bg-white/60 p-3 text-[11px] text-muted-foreground">
      <p className="mb-1 font-semibold text-foreground">Template variables</p>
      <p className="mb-2">
        Default content is rendered per model. Use these placeholders and they are replaced automatically:
      </p>
      <dl className="grid gap-x-3 gap-y-1 sm:grid-cols-[auto_1fr]">
        {TEMPLATE_VARIABLES.map((variable) => (
          <div key={variable.token} className="contents">
            <dt className="font-mono text-foreground">{variable.token}</dt>
            <dd>{variable.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ---------------------------------------------------------------- Images

/**
 * Preview + upload/replace/remove for one catalog image. Saves immediately
 * (its own endpoint), independent of the surrounding form's Save button.
 * `fallback` is what the public site shows while this image is empty.
 */
export function CatalogImageField({
  kind,
  id,
  value,
  onChange,
  label = 'Image',
  hint,
  fallback,
  testId,
}: {
  kind: CatalogImageKind
  id: number | null
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
  fallback?: string
  testId?: string
}) {
  const { toast } = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const shown = value || fallback || ''

  const upload = async (file: File | undefined) => {
    if (!file || id === null) return
    setBusy(true)
    try {
      const url = await uploadCatalogImage(kind, id, file)
      onChange(url)
      toast({ title: 'Image saved', variant: 'success' })
    } catch (err: unknown) {
      toast({ title: 'Upload failed', description: getErrorDetail(err, 'Could not save this image.'), variant: 'error' })
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const remove = async () => {
    if (id === null) return
    setBusy(true)
    try {
      await removeCatalogImage(kind, id)
      onChange('')
      toast({ title: 'Image removed', variant: 'success' })
    } catch (err: unknown) {
      toast({ title: 'Remove failed', description: getErrorDetail(err, 'Could not remove this image.'), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[rgb(var(--theme-border-rgb)/0.7)] bg-white/60">
          {shown ? (
            <img
              src={shown}
              alt=""
              className={cn('max-h-full max-w-full object-contain', !value && 'opacity-40')}
              data-testid={testId ? `${testId}-preview` : undefined}
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => upload(event.target.files?.[0])}
            data-testid={testId ? `${testId}-input` : undefined}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={busy || id === null}
              onClick={() => input.current?.click()}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value ? (
              <Button type="button" variant="outline" size="sm" className="rounded-xl text-rose-600" disabled={busy} onClick={remove}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {id === null
              ? 'Save first, then add an image.'
              : hint ?? 'PNG, JPEG, WebP or GIF up to 5 MB — stored as WebP.'}
            {!value && fallback ? ' Faded preview = what the site shows now.' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

