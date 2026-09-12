'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react'

import { useToast } from '@/hooks/useToast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  applyIssuesToModel,
  CONTENT_STATUSES,
  ContentStatus,
  deleteModel,
  deleteOffering,
  getErrorDetail,
  getFamilies,
  getFieldErrors,
  getIssues,
  getModel,
  getModelOfferings,
  INDEX_POLICIES,
  IndexPolicy,
  ModelAdmin,
  ModelPayload,
  OfferingAdmin,
  OfferingPayload,
  updateModel,
  updateOffering,
} from '@/services/adminCatalog'
import { cn } from '@/lib/utils'

import { formatDateTime } from './admin-helpers'
import { FAMILIES_QUERY_KEY, ISSUES_QUERY_KEY } from './AdminCatalog'
import {
  ActiveBadge,
  BilingualPair,
  blankToNull,
  cleanFaq,
  cleanPriceOptions,
  ContentStatusBadge,
  ErrorPanel,
  FaqEditor,
  Field,
  FieldErrors,
  formatPrice,
  IndexableBadge,
  LoadingPanel,
  NativeSelect,
  normalizeFaq,
  normalizePriceOptions,
  parseModelNumbers,
  parseOptionalInt,
  PriceOptionsEditor,
  SectionHeading,
  SeoPair,
  CatalogImageField,
} from './catalog-shared'

// ---------------------------------------------------------------- Model edit form

interface ModelDraft {
  family_id: number
  name_en: string
  name_bn: string
  slug: string
  line: string
  size_label: string
  chip: string
  generation: string
  release_year: string
  release_label: string
  model_numbers: string
  apple_identifier: string
  display_order: string
  is_active: boolean
  is_featured: boolean
  notes_en: string
  notes_bn: string
  content_en: string
  content_bn: string
  faq: ModelAdmin['faq']
  seo_title_en: string
  seo_title_bn: string
  seo_description_en: string
  seo_description_bn: string
  reference_source: string
}

function draftFromModel(model: ModelAdmin): ModelDraft {
  return {
    family_id: model.family?.id,
    name_en: model.name_en ?? '',
    name_bn: model.name_bn ?? '',
    slug: model.slug ?? '',
    line: model.line ?? '',
    size_label: model.size_label ?? '',
    chip: model.chip ?? '',
    generation: model.generation ?? '',
    release_year: model.release_year === null || model.release_year === undefined ? '' : String(model.release_year),
    release_label: model.release_label ?? '',
    model_numbers: (model.model_numbers ?? []).join(', '),
    apple_identifier: model.apple_identifier ?? '',
    display_order: String(model.display_order ?? 0),
    is_active: model.is_active !== false,
    is_featured: !!model.is_featured,
    notes_en: model.notes_en ?? '',
    notes_bn: model.notes_bn ?? '',
    content_en: model.content_en ?? '',
    content_bn: model.content_bn ?? '',
    faq: normalizeFaq(model.faq),
    seo_title_en: model.seo_title_en ?? '',
    seo_title_bn: model.seo_title_bn ?? '',
    seo_description_en: model.seo_description_en ?? '',
    seo_description_bn: model.seo_description_bn ?? '',
    reference_source: model.reference_source ?? '',
  }
}

function payloadFromDraft(draft: ModelDraft): ModelPayload {
  return {
    family_id: draft.family_id,
    name_en: draft.name_en.trim(),
    name_bn: draft.name_bn,
    slug: draft.slug.trim(),
    line: draft.line.trim(),
    size_label: draft.size_label.trim(),
    chip: draft.chip.trim(),
    generation: draft.generation.trim(),
    release_year: parseOptionalInt(draft.release_year),
    release_label: draft.release_label.trim(),
    model_numbers: parseModelNumbers(draft.model_numbers),
    apple_identifier: draft.apple_identifier.trim(),
    display_order: parseOptionalInt(draft.display_order) ?? 0,
    is_active: draft.is_active,
    is_featured: draft.is_featured,
    notes_en: draft.notes_en,
    notes_bn: draft.notes_bn,
    content_en: draft.content_en,
    content_bn: draft.content_bn,
    faq: cleanFaq(draft.faq),
    seo_title_en: draft.seo_title_en,
    seo_title_bn: draft.seo_title_bn,
    seo_description_en: draft.seo_description_en,
    seo_description_bn: draft.seo_description_bn,
    reference_source: draft.reference_source.trim(),
  }
}

function ModelEditForm({ model, onSaved }: { model: ModelAdmin; onSaved: (saved: ModelAdmin) => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [image, setImage] = useState(model.image ?? '')
  const [draft, setDraft] = useState<ModelDraft>(() => draftFromModel(model))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const { data: families } = useQuery({ queryKey: FAMILIES_QUERY_KEY, queryFn: getFamilies })

  const baseline = useMemo(() => JSON.stringify(payloadFromDraft(draftFromModel(model))), [model])
  const dirty = JSON.stringify(payloadFromDraft(draft)) !== baseline

  const patch = (partial: Partial<ModelDraft>) => setDraft((current) => ({ ...current, ...partial }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.name_en.trim()) {
      setErrors({ name_en: 'Name (EN) is required.' })
      return
    }
    setSaving(true)
    setErrors({})
    try {
      const saved = await updateModel(model.id, payloadFromDraft(draft))
      toast({ title: 'Model saved', description: `"${saved.name_en}" was updated.`, variant: 'success' })
      onSaved(saved)
    } catch (err: unknown) {
      setErrors(getFieldErrors(err))
      toast({ title: 'Save failed', description: getErrorDetail(err, 'Could not save this model right now.'), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="model-edit-form">
      <BilingualPair
        label="Name"
        required
        valueEn={draft.name_en}
        valueBn={draft.name_bn}
        onChangeEn={(value) => patch({ name_en: value })}
        onChangeBn={(value) => patch({ name_bn: value })}
        errorEn={errors.name_en}
        errorBn={errors.name_bn}
        testIdEn="model-edit-name-en"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Family" error={errors.family_id}>
          <NativeSelect value={draft.family_id} onChange={(event) => patch({ family_id: Number(event.target.value) })}>
            {(families ?? []).map((family) => (
              <option key={family.id} value={family.id}>
                {family.name_en}
              </option>
            ))}
            {!families?.some((family) => family.id === draft.family_id) ? (
              <option value={draft.family_id}>{model.family?.name_en ?? `#${draft.family_id}`}</option>
            ) : null}
          </NativeSelect>
        </Field>
        <Field label="Slug" error={errors.slug} hint="Changing the slug changes the public URL.">
          <Input value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} />
        </Field>
        <Field label="Line" error={errors.line}>
          <Input value={draft.line} onChange={(event) => patch({ line: event.target.value })} placeholder="Pro" />
        </Field>
        <Field label="Size label" error={errors.size_label}>
          <Input value={draft.size_label} onChange={(event) => patch({ size_label: event.target.value })} />
        </Field>
        <Field label="Chip" error={errors.chip}>
          <Input value={draft.chip} onChange={(event) => patch({ chip: event.target.value })} />
        </Field>
        <Field label="Generation" error={errors.generation}>
          <Input value={draft.generation} onChange={(event) => patch({ generation: event.target.value })} />
        </Field>
        <Field label="Release year" error={errors.release_year}>
          <Input type="number" min={2000} max={2100} value={draft.release_year} onChange={(event) => patch({ release_year: event.target.value })} />
        </Field>
        <Field label="Release label" error={errors.release_label}>
          <Input value={draft.release_label} onChange={(event) => patch({ release_label: event.target.value })} placeholder="Late 2023" />
        </Field>
        <Field label="Apple identifier" error={errors.apple_identifier}>
          <Input value={draft.apple_identifier} onChange={(event) => patch({ apple_identifier: event.target.value })} />
        </Field>
        <Field label="Display order" error={errors.display_order}>
          <Input type="number" value={draft.display_order} onChange={(event) => patch({ display_order: event.target.value })} />
        </Field>
        <Field label="Reference source" error={errors.reference_source} hint="Where the facts were checked (URL or note).">
          <Input value={draft.reference_source} onChange={(event) => patch({ reference_source: event.target.value })} />
        </Field>
      </div>
      <CatalogImageField
        kind="models"
        id={model.id}
        value={image}
        onChange={(url) => {
          setImage(url)
          queryClient.invalidateQueries({ queryKey: ['admin-catalog-models'] })
        }}
        label="Model photo"
        hint="Product photo on the model, repair and family pages. Transparent PNG/WebP looks best."
        testId="model-image"
      />
      <Field label="Model numbers (A-numbers)" error={errors.model_numbers} hint="Comma-separated.">
        <Input value={draft.model_numbers} onChange={(event) => patch({ model_numbers: event.target.value })} data-testid="model-edit-numbers" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Active</p>
            <p className="text-[11px] text-muted-foreground">Inactive models are hidden from the public site.</p>
          </div>
          <Switch checked={draft.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} data-testid="model-edit-active" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Featured</p>
            <p className="text-[11px] text-muted-foreground">Promoted on the family page.</p>
          </div>
          <Switch checked={draft.is_featured} onCheckedChange={(checked) => patch({ is_featured: checked })} />
        </div>
      </div>

      <SectionHeading title="Copy" description="Notes are short internal-facing remarks shown as a callout; content is Markdown." />
      <BilingualPair
        label="Notes"
        multiline
        rows={2}
        valueEn={draft.notes_en}
        valueBn={draft.notes_bn}
        onChangeEn={(value) => patch({ notes_en: value })}
        onChangeBn={(value) => patch({ notes_bn: value })}
        errorEn={errors.notes_en}
        errorBn={errors.notes_bn}
      />
      <BilingualPair
        label="Content (Markdown)"
        multiline
        rows={10}
        valueEn={draft.content_en}
        valueBn={draft.content_bn}
        onChangeEn={(value) => patch({ content_en: value })}
        onChangeBn={(value) => patch({ content_bn: value })}
        errorEn={errors.content_en}
        errorBn={errors.content_bn}
      />
      <FaqEditor items={draft.faq} onChange={(faq) => patch({ faq })} error={errors.faq} />

      <SectionHeading title="SEO" />
      <SeoPair
        label="SEO title"
        kind="title"
        valueEn={draft.seo_title_en}
        valueBn={draft.seo_title_bn}
        onChangeEn={(value) => patch({ seo_title_en: value })}
        onChangeBn={(value) => patch({ seo_title_bn: value })}
        errorEn={errors.seo_title_en}
        errorBn={errors.seo_title_bn}
      />
      <SeoPair
        label="SEO description"
        kind="description"
        valueEn={draft.seo_description_en}
        valueBn={draft.seo_description_bn}
        onChangeEn={(value) => patch({ seo_description_en: value })}
        onChangeBn={(value) => patch({ seo_description_bn: value })}
        errorEn={errors.seo_description_en}
        errorBn={errors.seo_description_bn}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--theme-border-rgb)/0.7)] pt-4">
        <p className="text-xs text-muted-foreground">
          {dirty ? 'Unsaved changes.' : `Last saved ${formatDateTime(model.updated_at)}.`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={!dirty || saving}
            onClick={() => {
              setDraft(draftFromModel(model))
              setErrors({})
            }}
          >
            Reset
          </Button>
          <Button type="submit" className="rounded-xl" disabled={saving || !dirty} data-testid="model-edit-save">
            {saving ? 'Saving...' : 'Save model'}
          </Button>
        </div>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------- Offering editor

interface OfferingDraft {
  is_active: boolean
  price_from: string
  reference_price: string
  turnaround_hours: string
  warranty_days: string
  price_options: OfferingAdmin['price_options']
  content_en: string
  content_bn: string
  faq: OfferingAdmin['faq']
  index_policy: IndexPolicy
  content_status: ContentStatus
}

function draftFromOffering(offering: OfferingAdmin): OfferingDraft {
  return {
    is_active: offering.is_active !== false,
    price_from: offering.price_from ?? '',
    reference_price: offering.reference_price ?? '',
    turnaround_hours:
      offering.turnaround_hours === null || offering.turnaround_hours === undefined ? '' : String(offering.turnaround_hours),
    warranty_days: offering.warranty_days === null || offering.warranty_days === undefined ? '' : String(offering.warranty_days),
    price_options: normalizePriceOptions(offering.price_options),
    content_en: offering.content_en ?? '',
    content_bn: offering.content_bn ?? '',
    faq: normalizeFaq(offering.faq),
    index_policy: offering.index_policy ?? 'auto',
    content_status: offering.content_status ?? 'draft',
  }
}

function OfferingForm({
  offering,
  onSaved,
  onCancel,
  onImageChange,
}: {
  offering: OfferingAdmin
  onSaved: (saved: OfferingAdmin) => void
  onCancel: () => void
  onImageChange: () => void
}) {
  const { toast } = useToast()
  const [image, setImage] = useState(offering.image ?? '')
  const [draft, setDraft] = useState<OfferingDraft>(() => draftFromOffering(offering))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const patch = (partial: Partial<OfferingDraft>) => setDraft((current) => ({ ...current, ...partial }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    const payload: OfferingPayload = {
      is_active: draft.is_active,
      price_from: blankToNull(draft.price_from),
      reference_price: blankToNull(draft.reference_price),
      turnaround_hours: parseOptionalInt(draft.turnaround_hours),
      warranty_days: parseOptionalInt(draft.warranty_days),
      price_options: cleanPriceOptions(draft.price_options),
      content_en: draft.content_en,
      content_bn: draft.content_bn,
      faq: cleanFaq(draft.faq),
      index_policy: draft.index_policy,
      content_status: draft.content_status,
    }
    try {
      const saved = await updateOffering(offering.id, payload)
      toast({ title: 'Offering saved', description: `${offering.issue.name_en} was updated.`, variant: 'success' })
      onSaved(saved)
    } catch (err: unknown) {
      setErrors(getFieldErrors(err))
      toast({ title: 'Save failed', description: getErrorDetail(err, 'Could not save this offering right now.'), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="offering-form">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <CatalogImageField
          kind="offerings"
          id={offering.id}
          value={image}
          fallback={offering.issue_image}
          onChange={(url) => {
            setImage(url)
            onImageChange()
          }}
          label="Repair icon"
          hint="Only for this model. Empty = the repair type's default icon."
          testId="offering-image"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price from" error={errors.price_from} hint="Blank = quote on request.">
            <Input
              value={draft.price_from}
              inputMode="decimal"
              placeholder="Quote"
              onChange={(event) => patch({ price_from: event.target.value })}
              data-testid="offering-price-from"
            />
          </Field>
          <Field label="Reference price" error={errors.reference_price} hint="Internal only; never shown publicly.">
            <Input value={draft.reference_price} inputMode="decimal" onChange={(event) => patch({ reference_price: event.target.value })} />
          </Field>
          <Field label="Turnaround (hours)" error={errors.turnaround_hours}>
            <Input type="number" min={0} value={draft.turnaround_hours} onChange={(event) => patch({ turnaround_hours: event.target.value })} />
          </Field>
          <Field label="Warranty (days)" error={errors.warranty_days}>
            <Input type="number" min={0} value={draft.warranty_days} onChange={(event) => patch({ warranty_days: event.target.value })} />
          </Field>
        </div>
        <PriceOptionsEditor items={draft.price_options} onChange={(price_options) => patch({ price_options })} error={errors.price_options} />

        <SectionHeading title="Content" description="Leave blank to use the issue's default template for this model." />
        <BilingualPair
          label="Content (Markdown)"
          multiline
          rows={10}
          valueEn={draft.content_en}
          valueBn={draft.content_bn}
          onChangeEn={(value) => patch({ content_en: value })}
          onChangeBn={(value) => patch({ content_bn: value })}
          errorEn={errors.content_en}
          errorBn={errors.content_bn}
          placeholderEn="blank = issue default template"
          placeholderBn="blank = issue default template"
          hint={`Currently ${offering.unique_words} unique words. Auto-indexing needs 250+ and a published status.`}
        />
        <FaqEditor items={draft.faq} onChange={(faq) => patch({ faq })} error={errors.faq} hint="Blank = issue default FAQ." />

        <SectionHeading title="Publishing" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Status" error={errors.content_status}>
            <NativeSelect
              value={draft.content_status}
              onChange={(event) => patch({ content_status: event.target.value as ContentStatus })}
              data-testid="offering-status"
            >
              {CONTENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label="Index policy"
            error={errors.index_policy}
            hint="auto = index only when published with 250+ words."
          >
            <NativeSelect value={draft.index_policy} onChange={(event) => patch({ index_policy: event.target.value as IndexPolicy })}>
              {INDEX_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Active" error={errors.is_active} hint="Inactive offerings are hidden publicly.">
            <div className="flex h-10 items-center">
              <Switch checked={draft.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} />
            </div>
          </Field>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={saving} data-testid="offering-save">
          {saving ? 'Saving...' : 'Save offering'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ---------------------------------------------------------------- Apply issues dialog

function ApplyIssuesForm({
  model,
  existingIssueIds,
  onApplied,
  onCancel,
}: {
  model: ModelAdmin
  existingIssueIds: Set<number>
  onApplied: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const { data, isLoading } = useQuery({ queryKey: ISSUES_QUERY_KEY, queryFn: getIssues })
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const candidates = useMemo(
    () =>
      (data ?? []).filter(
        (issue) =>
          issue.is_active &&
          !existingIssueIds.has(issue.id) &&
          (issue.applies_to.length === 0 || issue.applies_to.includes(model.family?.id))
      ),
    [data, existingIssueIds, model.family?.id]
  )

  const toggle = (id: number) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const submit = async () => {
    if (selected.length === 0) return
    setSaving(true)
    try {
      const result = await applyIssuesToModel(model.id, selected)
      toast({
        title: 'Issues applied',
        description: `${result.created} new offering${result.created === 1 ? '' : 's'} created (${result.total} total).`,
        variant: 'success',
      })
      onApplied()
    } catch (err: unknown) {
      toast({ title: 'Apply failed', description: getErrorDetail(err, 'Could not apply the issues right now.'), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4" data-testid="apply-issues-form">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading issues...</p>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Every active issue that applies to {model.family?.name_en ?? 'this family'} is already on this model.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{selected.length} selected</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setSelected(selected.length === candidates.length ? [] : candidates.map((issue) => issue.id))
              }
            >
              {selected.length === candidates.length ? 'Clear' : 'Select all'}
            </Button>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {candidates.map((issue) => (
              <label
                key={issue.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition',
                  selected.includes(issue.id)
                    ? 'border-primary/40 bg-[rgb(var(--theme-primary-soft-rgb)/0.72)]'
                    : 'border-[rgb(var(--theme-border-rgb)/0.8)] bg-white/60'
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[rgb(var(--theme-primary-rgb))]"
                  checked={selected.includes(issue.id)}
                  onChange={() => toggle(issue.id)}
                  data-testid={`apply-issue-${issue.id}`}
                />
                <span className="font-medium text-foreground">{issue.name_en}</span>
                <Badge variant="secondary" className="ml-auto">
                  {issue.category}
                </Badge>
              </label>
            ))}
          </div>
        </>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" className="rounded-xl" onClick={submit} disabled={saving || selected.length === 0} data-testid="apply-issues-save">
          {saving ? 'Applying...' : `Apply ${selected.length || ''}`.trim()}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ---------------------------------------------------------------- Offerings section

function OfferingsSection({ model }: { model: ModelAdmin }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const queryKey = useMemo(() => ['admin-catalog-offerings', model.id], [model.id])
  const { data, isLoading, error } = useQuery({ queryKey, queryFn: () => getModelOfferings(model.id) })
  const offerings = useMemo(() => data ?? [], [data])
  const existingIssueIds = useMemo(() => new Set(offerings.map((offering) => offering.issue.id)), [offerings])

  const [editing, setEditing] = useState<OfferingAdmin | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)
  const [toDelete, setToDelete] = useState<OfferingAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey })
    await queryClient.invalidateQueries({ queryKey: ['admin-catalog-model', model.id] })
    await queryClient.invalidateQueries({ queryKey: ['admin-catalog-matrix'] })
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteOffering(toDelete.id)
      setToDelete(null)
      await refresh()
      toast({ title: 'Offering deleted', variant: 'success' })
    } catch (err: unknown) {
      setDeleteError(getErrorDetail(err, 'Could not delete this offering right now.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Offerings</CardTitle>
            <CardDescription>The repairs offered for this model, with pricing and per-page content.</CardDescription>
          </div>
          <Button className="rounded-xl" onClick={() => setApplyOpen(true)} data-testid="apply-issues-button">
            <Plus className="mr-2 h-4 w-4" />
            Apply issues
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading offerings...</p>
          ) : error ? (
            <ErrorPanel error={error} subject="offerings" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm" data-testid="model-offerings-table">
                <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="pb-3 pr-4">Issue</th>
                    <th className="pb-3 pr-4">Active</th>
                    <th className="pb-3 pr-4">Price from</th>
                    <th className="pb-3 pr-4">Reference</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Indexing</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-sm text-muted-foreground">
                        No offerings yet. Use &quot;Apply issues&quot; to add repairs to this model.
                      </td>
                    </tr>
                  ) : (
                    offerings.map((offering) => (
                      <tr
                        key={offering.id}
                        data-testid={`offering-row-${offering.id}`}
                        className={cn(
                          'border-t border-[rgb(var(--theme-border-rgb)/0.7)] transition hover:bg-white/50',
                          !offering.is_active && 'opacity-60'
                        )}
                      >
                        <td className="py-3 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/70">
                              {offering.image || offering.issue_image ? (
                                <img
                                  src={offering.image || offering.issue_image}
                                  alt=""
                                  className={cn('max-h-full max-w-full object-contain', !offering.image && 'opacity-50')}
                                  loading="lazy"
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{offering.issue.name_en}</p>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{offering.issue.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <ActiveBadge active={offering.is_active} />
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <span className="font-medium text-foreground">{formatPrice(offering.price_from)}</span>
                          {offering.price_options?.length ? (
                            <p className="text-[11px] text-muted-foreground">
                              {offering.price_options.length} tier{offering.price_options.length === 1 ? '' : 's'}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 align-middle text-muted-foreground">
                          {offering.reference_price ? formatPrice(offering.reference_price) : '—'}
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <ContentStatusBadge status={offering.content_status} />
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <IndexableBadge offering={offering} />
                        </td>
                        <td className="py-3 text-right align-middle">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => setEditing(offering)}
                              data-testid={`offering-edit-${offering.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl text-rose-600 hover:text-rose-700"
                              aria-label={`Delete ${offering.issue.name_en} offering`}
                              onClick={() => {
                                setDeleteError('')
                                setToDelete(offering)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.issue.name_en} · {model.name_en}
            </DialogTitle>
            <DialogDescription>Pricing, turnaround, and page content for this specific model + issue.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <OfferingForm
              offering={editing}
              onSaved={async () => {
                setEditing(null)
                await refresh()
              }}
              onCancel={() => setEditing(null)}
              onImageChange={refresh}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply issues to {model.name_en}</DialogTitle>
            <DialogDescription>
              Creates an active offering for each selected issue using the issue&apos;s default content.
            </DialogDescription>
          </DialogHeader>
          {applyOpen ? (
            <ApplyIssuesForm
              model={model}
              existingIssueIds={existingIssueIds}
              onApplied={async () => {
                setApplyOpen(false)
                await refresh()
              }}
              onCancel={() => setApplyOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(open) => !deleting && !open && setToDelete(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete offering</DialogTitle>
            <DialogDescription>
              Remove &quot;{toDelete?.issue.name_en}&quot; from {model.name_en}? Its custom content and prices are lost. To hide
              it temporarily, set it inactive instead.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{deleteError}</p> : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete offering'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------- Page shell

export default function AdminCatalogModel() {
  const routeParams = useParams()
  const modelId = routeParams?.modelId as string | undefined
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const queryKey = useMemo(() => ['admin-catalog-model', Number(modelId)], [modelId])
  const { data: model, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getModel(modelId as string),
    enabled: !!modelId,
  })

  const handleDelete = async () => {
    if (!model) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteModel(model.id)
      await queryClient.invalidateQueries({ queryKey: ['admin-catalog-models'] })
      await queryClient.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })
      toast({ title: 'Model deleted', variant: 'success' })
      router.replace(`/admin/catalog/families/${model.family.slug}`)
    } catch (err: unknown) {
      setDeleteError(getErrorDetail(err, 'Could not delete this model right now.'))
      setDeleting(false)
    }
  }

  if (isLoading) return <LoadingPanel label="Loading model..." />
  if (error || !model) return <ErrorPanel error={error} subject="this model" />

  return (
    <div className="space-y-6">
      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="icon" className="rounded-xl" aria-label="Back to family">
              <Link href={`/admin/catalog/families/${model.family.slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground" data-testid="model-heading">
                  {model.name_en}
                </h2>
                <ActiveBadge active={model.is_active} />
                {model.is_featured ? <Badge>Featured</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                <Link href={`/admin/catalog/families/${model.family.slug}`} className="underline">
                  {model.family.name_en}
                </Link>{' '}
                · <span className="font-mono">/services/{model.family.slug}/{model.slug}</span>{' '}
                <a
                  href={`/en/services/${model.family.slug}/${model.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  open <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-xl text-rose-600 hover:text-rose-700"
            onClick={() => {
              setDeleteError('')
              setDeleteOpen(true)
            }}
            data-testid="model-delete-button"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete model
          </Button>
        </CardContent>
      </Card>

      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardHeader>
          <CardTitle>Model details</CardTitle>
          <CardDescription>Facts, bilingual copy, FAQ, and SEO for the model page.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModelEditForm
            key={model.updated_at}
            model={model}
            onSaved={async (saved) => {
              queryClient.setQueryData(queryKey, saved)
              await queryClient.invalidateQueries({ queryKey: ['admin-catalog-models'] })
              await queryClient.invalidateQueries({ queryKey: ['admin-catalog-matrix'] })
            }}
          />
        </CardContent>
      </Card>

      <OfferingsSection model={model} />

      <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete model</DialogTitle>
            <DialogDescription>
              Delete &quot;{model.name_en}&quot; and all {model.offering_count} of its offerings? This cannot be undone. To hide
              it from the site instead, set it inactive.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{deleteError}</p> : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={deleting} data-testid="model-delete-confirm">
              {deleting ? 'Deleting...' : 'Delete model'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
