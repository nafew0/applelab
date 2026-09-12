'use client'
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, ExternalLink, Grid3x3, Pencil, Plus, Table2 } from 'lucide-react'

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
  createModel,
  duplicateModel,
  FamilyAdmin,
  getErrorDetail,
  getFamilies,
  getFieldErrors,
  getMatrix,
  getModels,
  MatrixCellInput,
  MatrixResponse,
  ModelAdmin,
  ModelPayload,
  saveMatrix,
} from '@/services/adminCatalog'
import { cn } from '@/lib/utils'

import { FAMILIES_QUERY_KEY, FamilyFormDialog } from './AdminCatalog'
import {
  ActiveBadge,
  BilingualPair,
  blankToNull,
  ErrorPanel,
  Field,
  FieldErrors,
  formatPrice,
  LoadingPanel,
  NativeSelect,
  parseModelNumbers,
  parseOptionalInt,
} from './catalog-shared'

const PAGE_SIZE = 25

function useFamilyBySlug(slug: string | undefined) {
  const query = useQuery({ queryKey: FAMILIES_QUERY_KEY, queryFn: getFamilies, enabled: !!slug })
  const family = useMemo(() => (query.data ?? []).find((item) => item.slug === slug) ?? null, [query.data, slug])
  return { ...query, family }
}

function updateSearchParams(
  searchParams: string,
  patch: Record<string, string>,
  router: { replace(url: string): void },
  pathname: string
) {
  const next = new URLSearchParams(searchParams)
  Object.entries(patch).forEach(([key, value]) => {
    if (!value) next.delete(key)
    else next.set(key, value)
  })
  if (patch.page === undefined && patch.tab === undefined) {
    next.delete('page')
  }
  const query = next.toString()
  router.replace(query ? `${pathname}?${query}` : pathname)
}

// ---------------------------------------------------------------- New model dialog

interface ModelDraft {
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
  image: string
  display_order: string
  is_active: boolean
  is_featured: boolean
}

const EMPTY_MODEL_DRAFT: ModelDraft = {
  name_en: '',
  name_bn: '',
  slug: '',
  line: '',
  size_label: '',
  chip: '',
  generation: '',
  release_year: '',
  release_label: '',
  model_numbers: '',
  apple_identifier: '',
  image: '',
  display_order: '0',
  is_active: true,
  is_featured: false,
}

function ModelCreateForm({
  family,
  onCreated,
  onCancel,
}: {
  family: FamilyAdmin
  onCreated: (model: ModelAdmin) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [draft, setDraft] = useState<ModelDraft>(EMPTY_MODEL_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const patch = (partial: Partial<ModelDraft>) => setDraft((current) => ({ ...current, ...partial }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.name_en.trim()) {
      setErrors({ name_en: 'Name (EN) is required.' })
      return
    }
    setSaving(true)
    setErrors({})
    const payload: ModelPayload = {
      family_id: family.id,
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
      image: draft.image.trim(),
      display_order: parseOptionalInt(draft.display_order) ?? 0,
      is_active: draft.is_active,
      is_featured: draft.is_featured,
    }
    try {
      const created = await createModel(payload)
      toast({ title: 'Model created', description: `"${created.name_en}" was added to ${family.name_en}.`, variant: 'success' })
      onCreated(created)
    } catch (err: unknown) {
      setErrors(getFieldErrors(err))
      toast({ title: 'Create failed', description: getErrorDetail(err, 'Could not create this model right now.'), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="model-form">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <BilingualPair
          label="Name"
          required
          valueEn={draft.name_en}
          valueBn={draft.name_bn}
          onChangeEn={(value) => patch({ name_en: value })}
          onChangeBn={(value) => patch({ name_bn: value })}
          errorEn={errors.name_en}
          errorBn={errors.name_bn}
          placeholderEn="iPhone 15 Pro"
          testIdEn="model-name-en"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Slug" error={errors.slug} hint="Blank = auto.">
            <Input value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} placeholder="iphone-15-pro" />
          </Field>
          <Field label="Line" error={errors.line} hint="Sub-line, e.g. Pro, Air, mini.">
            <Input value={draft.line} onChange={(event) => patch({ line: event.target.value })} placeholder="Pro" />
          </Field>
          <Field label="Size label" error={errors.size_label}>
            <Input value={draft.size_label} onChange={(event) => patch({ size_label: event.target.value })} placeholder='6.1"' />
          </Field>
          <Field label="Chip" error={errors.chip}>
            <Input value={draft.chip} onChange={(event) => patch({ chip: event.target.value })} placeholder="A17 Pro" />
          </Field>
          <Field label="Generation" error={errors.generation}>
            <Input value={draft.generation} onChange={(event) => patch({ generation: event.target.value })} placeholder="15" />
          </Field>
          <Field label="Release year" error={errors.release_year}>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={draft.release_year}
              onChange={(event) => patch({ release_year: event.target.value })}
              placeholder="2023"
              data-testid="model-release-year"
            />
          </Field>
          <Field label="Release label" error={errors.release_label} hint="Shown instead of the year, e.g. Late 2023.">
            <Input value={draft.release_label} onChange={(event) => patch({ release_label: event.target.value })} />
          </Field>
          <Field label="Apple identifier" error={errors.apple_identifier}>
            <Input value={draft.apple_identifier} onChange={(event) => patch({ apple_identifier: event.target.value })} placeholder="iPhone16,1" />
          </Field>
          <Field label="Display order" error={errors.display_order}>
            <Input type="number" value={draft.display_order} onChange={(event) => patch({ display_order: event.target.value })} />
          </Field>
        </div>
        <Field label="Model numbers (A-numbers)" error={errors.model_numbers} hint="Comma-separated, e.g. A2848, A3101.">
          <Input
            value={draft.model_numbers}
            onChange={(event) => patch({ model_numbers: event.target.value })}
            placeholder="A2848, A3101, A3102"
            data-testid="model-numbers"
          />
        </Field>
        <Field label="Image URL" error={errors.image}>
          <Input value={draft.image} onChange={(event) => patch({ image: event.target.value })} placeholder="https://…" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-foreground">Active</p>
              <p className="text-[11px] text-muted-foreground">Inactive models are hidden publicly.</p>
            </div>
            <Switch checked={draft.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-foreground">Featured</p>
              <p className="text-[11px] text-muted-foreground">Promoted on the family page.</p>
            </div>
            <Switch checked={draft.is_featured} onCheckedChange={(checked) => patch({ is_featured: checked })} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={saving} data-testid="model-save">
          {saving ? 'Creating...' : 'Create model'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ---------------------------------------------------------------- Duplicate dialog

function DuplicateForm({
  source,
  onDuplicated,
  onCancel,
}: {
  source: ModelAdmin
  onDuplicated: (model: ModelAdmin) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const nextYear = source.release_year ? source.release_year + 1 : new Date().getFullYear()
  const [draft, setDraft] = useState({
    name_en: source.name_en,
    slug: '',
    chip: source.chip ?? '',
    release_year: String(nextYear),
    model_numbers: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const created = await duplicateModel(source.id, {
        name_en: draft.name_en.trim() || undefined,
        slug: draft.slug.trim() || undefined,
        chip: draft.chip.trim(),
        release_year: parseOptionalInt(draft.release_year),
        model_numbers: parseModelNumbers(draft.model_numbers),
      })
      toast({
        title: 'Model duplicated',
        description: `"${created.name_en}" was created as an inactive copy with all offerings.`,
        variant: 'success',
      })
      onDuplicated(created)
    } catch (err: unknown) {
      setErrors(getFieldErrors(err))
      toast({ title: 'Duplicate failed', description: getErrorDetail(err, 'Could not duplicate this model.'), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="model-duplicate-form">
      <Field label="New name (EN)" error={errors.name_en}>
        <Input
          value={draft.name_en}
          onChange={(event) => setDraft({ ...draft, name_en: event.target.value })}
          data-testid="duplicate-name-en"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Slug" error={errors.slug} hint="Blank = auto.">
          <Input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
        </Field>
        <Field label="Chip" error={errors.chip}>
          <Input value={draft.chip} onChange={(event) => setDraft({ ...draft, chip: event.target.value })} />
        </Field>
        <Field label="Release year" error={errors.release_year}>
          <Input
            type="number"
            value={draft.release_year}
            onChange={(event) => setDraft({ ...draft, release_year: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Model numbers (A-numbers)" error={errors.model_numbers} hint="Comma-separated. Blank keeps the source list.">
        <Input
          value={draft.model_numbers}
          onChange={(event) => setDraft({ ...draft, model_numbers: event.target.value })}
          placeholder="A3201, A3202"
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        The copy starts <span className="font-semibold">inactive</span> with the same offerings and prices. Review it, then
        activate.
      </p>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={saving} data-testid="model-duplicate-save">
          {saving ? 'Duplicating...' : 'Duplicate model'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ---------------------------------------------------------------- Models tab

function ModelsTab({ family }: { family: FamilyAdmin }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const searchParamString = searchParams?.toString() ?? ''
  const queryClient = useQueryClient()

  const params = useMemo(() => {
    const next = new URLSearchParams(searchParamString)
    return {
      page: next.get('page') || '1',
      search: next.get('search') || '',
      year: next.get('year') || '',
      line: next.get('line') || '',
      is_active: next.get('active') || '',
    }
  }, [searchParamString])

  const [searchInput, setSearchInput] = useState(params.search)
  const [lineInput, setLineInput] = useState(params.line)
  const [createOpen, setCreateOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<ModelAdmin | null>(null)

  const queryKey = useMemo(() => ['admin-catalog-models', family.slug, params], [family.slug, params])
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getModels({ family: family.slug, page_size: PAGE_SIZE, ...params }),
  })

  const applyFilters = (patch: Record<string, string>) => updateSearchParams(searchParamString, patch, router, pathname)

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-catalog-models', family.slug] })
    await queryClient.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })
  }

  const currentPage = Number(params.page || 1)
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE))

  return (
    <>
      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Models</CardTitle>
              <CardDescription>
                {data ? `${data.count} model${data.count === 1 ? '' : 's'} in ${family.name_en}.` : 'Loading…'}
              </CardDescription>
            </div>
            <Button className="rounded-xl" onClick={() => setCreateOpen(true)} data-testid="model-create-button">
              <Plus className="mr-2 h-4 w-4" />
              New model
            </Button>
          </div>
          <form
            className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,0.7fr))_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              applyFilters({ search: searchInput.trim(), line: lineInput.trim() })
            }}
          >
            <Input
              data-testid="models-search"
              placeholder="Search name, slug, A-number"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Input
              type="number"
              placeholder="Year"
              value={params.year}
              onChange={(event) => applyFilters({ year: event.target.value })}
            />
            <Input placeholder="Line (Pro, Air…)" value={lineInput} onChange={(event) => setLineInput(event.target.value)} />
            <NativeSelect value={params.is_active} onChange={(event) => applyFilters({ active: event.target.value })}>
              <option value="">All models</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </NativeSelect>
            <Button type="submit" variant="outline" className="rounded-xl">
              Filter
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <ErrorPanel error={error} subject="models" />
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading models...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm" data-testid="family-models-table">
                <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Chip</th>
                    <th className="pb-3 pr-4">Year</th>
                    <th className="pb-3 pr-4">A-numbers</th>
                    <th className="pb-3 pr-4">Line</th>
                    <th className="pb-3 pr-4">Offerings</th>
                    <th className="pb-3 pr-4">Featured</th>
                    <th className="pb-3 pr-4">Active</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.results ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-sm text-muted-foreground">
                        No models match. Add one with &quot;New model&quot; or clear the filters.
                      </td>
                    </tr>
                  ) : (
                    (data?.results ?? []).map((model) => (
                      <tr
                        key={model.id}
                        data-testid={`model-row-${model.id}`}
                        className={cn(
                          'cursor-pointer border-t border-[rgb(var(--theme-border-rgb)/0.7)] transition hover:bg-white/50',
                          !model.is_active && 'opacity-60'
                        )}
                        onClick={() => router.push(`/admin/catalog/models/${model.id}`)}
                      >
                        <td className="py-3 pr-4 align-middle">
                          <p className="font-medium text-foreground">{model.name_en}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{model.slug}</p>
                        </td>
                        <td className="py-3 pr-4 align-middle">{model.chip || '—'}</td>
                        <td className="py-3 pr-4 align-middle">{model.release_label || model.release_year || '—'}</td>
                        <td className="py-3 pr-4 align-middle font-mono text-xs text-muted-foreground">
                          {model.model_numbers?.length ? model.model_numbers.join(', ') : '—'}
                        </td>
                        <td className="py-3 pr-4 align-middle">{model.line || '—'}</td>
                        <td className="py-3 pr-4 align-middle">{model.offering_count}</td>
                        <td className="py-3 pr-4 align-middle">
                          {model.is_featured ? <Badge>Featured</Badge> : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          <ActiveBadge active={model.is_active} />
                        </td>
                        <td className="py-3 text-right align-middle" onClick={(event) => event.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setDuplicateSource(model)}
                            data-testid="model-duplicate-button"
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Duplicate
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing page {currentPage} of {totalPages}.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ page: String(currentPage - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters({ page: String(currentPage + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New model in {family.name_en}</DialogTitle>
            <DialogDescription>
              Structured facts only. Content, FAQ, and SEO are edited on the model page after creation.
            </DialogDescription>
          </DialogHeader>
          {createOpen ? (
            <ModelCreateForm
              family={family}
              onCreated={async (model) => {
                setCreateOpen(false)
                await refreshAll()
                router.push(`/admin/catalog/models/${model.id}`)
              }}
              onCancel={() => setCreateOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!duplicateSource} onOpenChange={(open) => !open && setDuplicateSource(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duplicate {duplicateSource?.name_en}</DialogTitle>
            <DialogDescription>
              Yearly refresh: copy this model with its offerings, then adjust the new facts.
            </DialogDescription>
          </DialogHeader>
          {duplicateSource ? (
            <DuplicateForm
              source={duplicateSource}
              onDuplicated={async (model) => {
                setDuplicateSource(null)
                await refreshAll()
                router.push(`/admin/catalog/models/${model.id}`)
              }}
              onCancel={() => setDuplicateSource(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------- Matrix tab

interface CellValue {
  is_active: boolean
  price_from: string
}

const cellKey = (modelId: number, issueId: number) => `${modelId}:${issueId}`

function normalizePrice(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  const number = Number(trimmed)
  return Number.isNaN(number) ? trimmed : String(number)
}

function sameCell(a: CellValue, b: CellValue) {
  return a.is_active === b.is_active && normalizePrice(a.price_from) === normalizePrice(b.price_from)
}

function MatrixTab({ family }: { family: FamilyAdmin }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const queryKey = useMemo(() => ['admin-catalog-matrix', family.slug], [family.slug])
  const { data, isLoading, error } = useQuery({ queryKey, queryFn: () => getMatrix(family.slug) })

  // Dirty tracking: `edits` holds only cells the user touched, keyed "model:issue".
  // Baseline is the server cell (or "inactive, blank" when no offering exists yet).
  // A cell is dirty when its edit differs from its baseline; Save posts dirty cells only.
  const [edits, setEdits] = useState<Record<string, CellValue>>({})
  const [saving, setSaving] = useState(false)

  const baseline = useMemo(() => {
    const map = new Map<string, MatrixResponse['cells'][number]>()
    data?.cells.forEach((cell) => map.set(cellKey(cell.model_id, cell.issue_id), cell))
    return map
  }, [data])

  const baselineValue = useCallback(
    (modelId: number, issueId: number): CellValue => {
      const cell = baseline.get(cellKey(modelId, issueId))
      return cell ? { is_active: cell.is_active, price_from: cell.price_from ?? '' } : { is_active: false, price_from: '' }
    },
    [baseline]
  )

  const currentValue = (modelId: number, issueId: number): CellValue =>
    edits[cellKey(modelId, issueId)] ?? baselineValue(modelId, issueId)

  const setCell = (modelId: number, issueId: number, patch: Partial<CellValue>) => {
    setEdits((current) => {
      const key = cellKey(modelId, issueId)
      const next = { ...(current[key] ?? baselineValue(modelId, issueId)), ...patch }
      if (sameCell(next, baselineValue(modelId, issueId))) {
        const rest = { ...current }
        delete rest[key]
        return rest
      }
      return { ...current, [key]: next }
    })
  }

  const dirtyCells = useMemo<MatrixCellInput[]>(() => {
    return Object.entries(edits)
      .filter(([key, value]) => {
        const [modelId, issueId] = key.split(':').map(Number)
        return !sameCell(value, baselineValue(modelId, issueId))
      })
      .map(([key, value]) => {
        const [model_id, issue_id] = key.split(':').map(Number)
        return { model_id, issue_id, is_active: value.is_active, price_from: blankToNull(value.price_from) }
      })
  }, [edits, baselineValue])

  const models = data?.models ?? []
  const issues = data?.issues ?? []

  const stageApplyAll = () => {
    let staged = 0
    setEdits((current) => {
      const next = { ...current }
      models.forEach((model) => {
        issues.forEach((issue) => {
          const key = cellKey(model.id, issue.id)
          if (!baseline.has(key) && !next[key]) {
            next[key] = { is_active: true, price_from: '' }
            staged += 1
          }
        })
      })
      return next
    })
    toast({
      title: 'Cells staged',
      description: `${staged} missing offering${staged === 1 ? '' : 's'} marked active. Click "Save changes" to create them.`,
      variant: 'info',
    })
  }

  const toggleColumn = (issueId: number) => {
    const allActive = models.every((model) => currentValue(model.id, issueId).is_active)
    models.forEach((model) => setCell(model.id, issueId, { is_active: !allActive }))
  }

  const save = async () => {
    if (dirtyCells.length === 0) return
    setSaving(true)
    try {
      const result = await saveMatrix(dirtyCells)
      setEdits({})
      await queryClient.invalidateQueries({ queryKey })
      await queryClient.invalidateQueries({ queryKey: ['admin-catalog-models', family.slug] })
      toast({
        title: 'Matrix saved',
        description: `${result.created} created, ${result.updated} updated.`,
        variant: 'success',
      })
    } catch (err: unknown) {
      toast({ title: 'Save failed', description: getErrorDetail(err, 'Could not save the matrix right now.'), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingPanel label="Loading matrix..." />
  if (error) return <ErrorPanel error={error} subject="the price matrix" />

  const missingCount = models.length * issues.length - (data?.cells.length ?? 0)

  return (
    <Card className="theme-panel rounded-[1.8rem] border-0" data-testid="catalog-matrix">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Price &amp; availability matrix</CardTitle>
          <CardDescription>
            Tick to offer a repair for a model; enter a starting price or leave blank for &quot;quote&quot;. Grey
            reference prices are internal only.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={stageApplyAll}
            disabled={saving || missingCount <= 0}
            data-testid="matrix-apply-all"
            title={missingCount > 0 ? `${missingCount} cells have no offering yet` : 'Every model already has every issue'}
          >
            Apply all issues to all models
          </Button>
          <Button className="rounded-xl" onClick={save} disabled={saving || dirtyCells.length === 0} data-testid="matrix-save">
            {saving ? 'Saving...' : dirtyCells.length ? `Save changes (${dirtyCells.length})` : 'Save changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {models.length === 0 || issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {models.length === 0
              ? 'Add at least one model to this family first.'
              : 'No issues apply to this family yet. Edit an issue in Catalog → Issues and tick this family under "Applies to".'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white/90 pb-3 pr-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Model
                  </th>
                  {issues.map((issue) => {
                    const allActive = models.every((model) => currentValue(model.id, issue.id).is_active)
                    return (
                      <th key={issue.id} className="pb-3 pr-3 align-bottom text-xs font-semibold text-foreground">
                        <div className="flex min-w-[9rem] flex-col gap-1">
                          <span>{issue.name_en}</span>
                          <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-muted-foreground">
                            {issue.category}
                          </span>
                          <button
                            type="button"
                            className="w-fit rounded-md border border-[rgb(var(--theme-border-rgb)/0.8)] bg-white/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => toggleColumn(issue.id)}
                            data-testid={`matrix-toggle-column-${issue.id}`}
                          >
                            {allActive ? 'Untick all' : 'Tick all'}
                          </button>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-t">
                    <td className="sticky left-0 z-10 border-t border-[rgb(var(--theme-border-rgb)/0.7)] bg-white/90 py-2 pr-4 align-middle">
                      <Link href={`/admin/catalog/models/${model.id}`} className="font-medium text-foreground hover:underline">
                        {model.name_en}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {[model.release_year, model.line].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    {issues.map((issue) => {
                      const value = currentValue(model.id, issue.id)
                      const base = baselineValue(model.id, issue.id)
                      const serverCell = baseline.get(cellKey(model.id, issue.id))
                      const dirty = !sameCell(value, base)
                      return (
                        <td
                          key={issue.id}
                          className="border-t border-[rgb(var(--theme-border-rgb)/0.7)] py-2 pr-3 align-middle"
                        >
                          <div
                            data-testid={`matrix-cell-${model.id}-${issue.id}`}
                            data-dirty={dirty ? 'true' : undefined}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition',
                              dirty
                                ? 'border-amber-300 bg-amber-50'
                                : value.is_active
                                  ? 'border-[rgb(var(--theme-border-rgb)/0.8)] bg-white/70'
                                  : 'border-transparent bg-transparent'
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 shrink-0 accent-[rgb(var(--theme-primary-rgb))]"
                              checked={value.is_active}
                              aria-label={`${issue.name_en} for ${model.name_en} active`}
                              onChange={(event) => setCell(model.id, issue.id, { is_active: event.target.checked })}
                              data-testid={`matrix-cell-${model.id}-${issue.id}-active`}
                            />
                            <div className="flex flex-col">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={value.price_from}
                                placeholder="Quote"
                                aria-label={`${issue.name_en} for ${model.name_en} price from`}
                                onChange={(event) => setCell(model.id, issue.id, { price_from: event.target.value })}
                                className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                                data-testid={`matrix-cell-${model.id}-${issue.id}-price`}
                              />
                              {serverCell?.reference_price ? (
                                <span
                                  className="mt-0.5 text-[10px] text-muted-foreground"
                                  title="Internal reference price (not shown publicly)"
                                >
                                  ref {formatPrice(serverCell.reference_price)}
                                </span>
                              ) : null}
                              {serverCell && serverCell.content_status !== 'published' ? (
                                <span className="text-[10px] text-amber-600">{serverCell.content_status}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {dirtyCells.length > 0 ? (
          <p className="mt-4 text-xs text-amber-700" data-testid="matrix-dirty-hint">
            {dirtyCells.length} unsaved change{dirtyCells.length === 1 ? '' : 's'}. Highlighted cells are not yet saved.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------- Page shell

export default function AdminCatalogFamily() {
  const routeParams = useParams()
  const slug = routeParams?.slug as string | undefined
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const searchParamString = searchParams?.toString() ?? ''
  const tab = searchParams?.get('tab') === 'matrix' ? 'matrix' : 'models'
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const { family, isLoading, error } = useFamilyBySlug(slug)

  if (isLoading) return <LoadingPanel label="Loading family..." />
  if (error) return <ErrorPanel error={error} subject="this family" />
  if (!family) {
    return (
      <div className="theme-panel rounded-[1.8rem] p-6 text-sm text-rose-600">
        No family with slug &quot;{slug}&quot;.{' '}
        <Link href="/admin/catalog" className="underline">
          Back to catalog
        </Link>
      </div>
    )
  }

  const setTab = (next: 'models' | 'matrix') =>
    updateSearchParams(searchParamString, { tab: next === 'models' ? '' : next }, router, pathname)

  return (
    <div className="space-y-5">
      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="icon" className="rounded-xl" aria-label="Back to catalog">
              <Link href="/admin/catalog">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground" data-testid="family-heading">
                  {family.name_en}
                </h2>
                <Badge variant="secondary">{family.kind}</Badge>
                <ActiveBadge active={family.is_active} inactiveLabel="Archived" />
              </div>
              <p className="text-xs text-muted-foreground">
                Public page: <span className="font-mono">/services/{family.slug}</span>{' '}
                <a
                  href={`/en/services/${family.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  open <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(true)} data-testid="family-edit-button">
              <Pencil className="mr-2 h-4 w-4" />
              Edit family
            </Button>
            <Button
              data-testid="family-tab-models"
              variant={tab === 'models' ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setTab('models')}
            >
              <Table2 className="mr-2 h-4 w-4" />
              Models
            </Button>
            <Button
              data-testid="family-tab-matrix"
              variant={tab === 'matrix' ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setTab('matrix')}
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
              Matrix
            </Button>
          </div>
        </CardContent>
      </Card>

      {tab === 'matrix' ? <MatrixTab family={family} /> : <ModelsTab family={family} />}

      <FamilyFormDialog
        open={editOpen}
        family={family}
        onOpenChange={setEditOpen}
        onSaved={async (saved) => {
          setEditOpen(false)
          await queryClient.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })
          if (saved.slug !== family.slug) {
            router.replace(`/admin/catalog/families/${saved.slug}`)
          }
        }}
      />
    </div>
  )
}
