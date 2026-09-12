'use client'
import { useMemo, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Layers, Plus, Trash2, Wrench } from 'lucide-react'

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
  createFamily,
  createIssue,
  deleteFamily,
  deleteIssue,
  FAMILY_KINDS,
  FamilyAdmin,
  FamilyPayload,
  getErrorDetail,
  getFamilies,
  getFieldErrors,
  getIssues,
  ISSUE_CATEGORIES,
  IssueAdmin,
  IssuePayload,
  reorderFamilies,
  updateFamily,
  updateIssue,
} from '@/services/adminCatalog'
import { cn } from '@/lib/utils'

import {
  BilingualPair,
  cleanFaq,
  ErrorPanel,
  FaqEditor,
  Field,
  FieldErrors,
  LoadingPanel,
  NativeSelect,
  normalizeFaq,
  SectionHeading,
  SeoPair,
  TemplateVariablesHelp,
} from './catalog-shared'

export const FAMILIES_QUERY_KEY = ['admin-catalog-families']
export const ISSUES_QUERY_KEY = ['admin-catalog-issues']

// ---------------------------------------------------------------- Family form

type FamilyDraft = Omit<FamilyAdmin, 'id' | 'model_count' | 'updated_at'>

function emptyFamilyDraft(): FamilyDraft {
  return {
    slug: '',
    name_en: '',
    name_bn: '',
    kind: 'phone',
    icon: '',
    hero_image: '',
    display_order: 0,
    is_active: true,
    intro_en: '',
    intro_bn: '',
    content_en: '',
    content_bn: '',
    faq: [],
    seo_title_en: '',
    seo_title_bn: '',
    seo_description_en: '',
    seo_description_bn: '',
  }
}

function draftFromFamily(family: FamilyAdmin): FamilyDraft {
  return {
    slug: family.slug ?? '',
    name_en: family.name_en ?? '',
    name_bn: family.name_bn ?? '',
    kind: family.kind ?? 'phone',
    icon: family.icon ?? '',
    hero_image: family.hero_image ?? '',
    display_order: family.display_order ?? 0,
    is_active: family.is_active !== false,
    intro_en: family.intro_en ?? '',
    intro_bn: family.intro_bn ?? '',
    content_en: family.content_en ?? '',
    content_bn: family.content_bn ?? '',
    faq: normalizeFaq(family.faq),
    seo_title_en: family.seo_title_en ?? '',
    seo_title_bn: family.seo_title_bn ?? '',
    seo_description_en: family.seo_description_en ?? '',
    seo_description_bn: family.seo_description_bn ?? '',
  }
}

function FamilyForm({
  family,
  onSaved,
  onCancel,
}: {
  family: FamilyAdmin | null
  onSaved: (saved: FamilyAdmin) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [draft, setDraft] = useState<FamilyDraft>(() => (family ? draftFromFamily(family) : emptyFamilyDraft()))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const patch = (partial: Partial<FamilyDraft>) => setDraft((current) => ({ ...current, ...partial }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.name_en.trim()) {
      setErrors({ name_en: 'Name (EN) is required.' })
      return
    }
    setSaving(true)
    setErrors({})
    const payload: FamilyPayload = {
      ...draft,
      slug: draft.slug.trim(),
      name_en: draft.name_en.trim(),
      faq: cleanFaq(draft.faq),
    }
    try {
      const saved = family ? await updateFamily(family.id, payload) : await createFamily(payload)
      toast({
        title: family ? 'Family saved' : 'Family created',
        description: `"${saved.name_en}" was ${family ? 'updated' : 'created'}.`,
        variant: 'success',
      })
      onSaved(saved)
    } catch (err: unknown) {
      const fieldErrors = getFieldErrors(err)
      setErrors(fieldErrors)
      toast({
        title: 'Save failed',
        description: getErrorDetail(err, 'Could not save this family right now.'),
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="family-form">
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
          placeholderEn="iPhone"
          testIdEn="family-name-en"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Slug" error={errors.slug} hint="Leave blank to generate from the name.">
            <Input value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} placeholder="iphone" />
          </Field>
          <Field label="Kind" error={errors.kind}>
            <NativeSelect value={draft.kind} onChange={(event) => patch({ kind: event.target.value as FamilyDraft['kind'] })}>
              {FAMILY_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Icon" error={errors.icon} hint="Icon key used by the public site.">
            <Input value={draft.icon} onChange={(event) => patch({ icon: event.target.value })} placeholder="smartphone" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Hero image URL" error={errors.hero_image}>
            <Input value={draft.hero_image} onChange={(event) => patch({ hero_image: event.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Active" error={errors.is_active}>
            <div className="flex h-10 items-center">
              <Switch checked={draft.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} />
            </div>
          </Field>
        </div>

        <SectionHeading title="Public copy" description="Intro shows under the heading; content is Markdown." />
        <BilingualPair
          label="Intro"
          multiline
          rows={2}
          valueEn={draft.intro_en}
          valueBn={draft.intro_bn}
          onChangeEn={(value) => patch({ intro_en: value })}
          onChangeBn={(value) => patch({ intro_bn: value })}
          errorEn={errors.intro_en}
          errorBn={errors.intro_bn}
        />
        <BilingualPair
          label="Content (Markdown)"
          multiline
          rows={8}
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
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={saving} data-testid="family-save">
          {saving ? 'Saving...' : family ? 'Save family' : 'Create family'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Create/edit dialog. Reused by the family workspace ("Edit family"). */
export function FamilyFormDialog({
  open,
  family,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  family: FamilyAdmin | null
  onOpenChange: (open: boolean) => void
  onSaved: (saved: FamilyAdmin) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{family ? `Edit ${family.name_en}` : 'New family'}</DialogTitle>
          <DialogDescription>
            A family is a device line (iPhone, MacBook Pro…). Models and the price matrix live under it.
          </DialogDescription>
        </DialogHeader>
        {open ? <FamilyForm family={family} onSaved={onSaved} onCancel={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------- Families tab

function FamiliesTab() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [dialog, setDialog] = useState<{ open: boolean; family: FamilyAdmin | null }>({ open: false, family: null })
  const [reordering, setReordering] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<FamilyAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data, isLoading, error } = useQuery({ queryKey: FAMILIES_QUERY_KEY, queryFn: getFamilies })
  const families = useMemo(() => data ?? [], [data])

  const refresh = () => queryClient.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= families.length) return
    const ids = families.map((family) => family.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setReordering(true)
    try {
      await reorderFamilies(ids)
      await refresh()
    } catch (err: unknown) {
      toast({ title: 'Reorder failed', description: getErrorDetail(err, 'Could not reorder families.'), variant: 'error' })
    } finally {
      setReordering(false)
    }
  }

  const toggleActive = async (family: FamilyAdmin) => {
    setTogglingId(family.id)
    try {
      await updateFamily(family.id, { is_active: !family.is_active })
      await refresh()
      toast({
        title: family.is_active ? 'Family archived' : 'Family restored',
        description: family.is_active
          ? `"${family.name_en}" is hidden from the public site.`
          : `"${family.name_en}" is visible again.`,
        variant: 'success',
      })
    } catch (err: unknown) {
      toast({ title: 'Update failed', description: getErrorDetail(err, 'Could not update this family.'), variant: 'error' })
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteFamily(toDelete.id)
      setToDelete(null)
      await refresh()
      toast({ title: 'Family deleted', variant: 'success' })
    } catch (err: unknown) {
      setDeleteError(getErrorDetail(err, 'Could not delete this family right now.'))
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) return <LoadingPanel label="Loading families..." />
  if (error) return <ErrorPanel error={error} subject="families" />

  return (
    <>
      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Device families</CardTitle>
            <CardDescription>
              Order here is the order on the public site. Open a family to manage its models and price matrix.
            </CardDescription>
          </div>
          <Button className="rounded-xl" onClick={() => setDialog({ open: true, family: null })} data-testid="family-create-button">
            <Plus className="mr-2 h-4 w-4" />
            New family
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="catalog-families-table">
              <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-3 w-12">Order</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Slug</th>
                  <th className="pb-3 pr-4">Kind</th>
                  <th className="pb-3 pr-4">Models</th>
                  <th className="pb-3 pr-4">Active</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {families.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-sm text-muted-foreground">
                      No families yet. Create the first one (e.g. iPhone) to start the catalog.
                    </td>
                  </tr>
                ) : (
                  families.map((family, index) => (
                    <tr
                      key={family.id}
                      data-testid={`family-row-${family.slug}`}
                      className={cn(
                        'cursor-pointer border-t border-[rgb(var(--theme-border-rgb)/0.7)] transition hover:bg-white/50',
                        !family.is_active && 'opacity-60'
                      )}
                      onClick={() => router.push(`/admin/catalog/families/${family.slug}`)}
                    >
                      <td className="py-2 pr-3 align-middle" onClick={(event) => event.stopPropagation()}>
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            aria-label={`Move ${family.name_en} up`}
                            disabled={reordering || index === 0}
                            onClick={() => handleMove(index, -1)}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            aria-label={`Move ${family.name_en} down`}
                            disabled={reordering || index === families.length - 1}
                            onClick={() => handleMove(index, 1)}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-middle">
                        <p className="font-medium text-foreground">{family.name_en}</p>
                        {family.name_bn ? <p className="text-xs text-muted-foreground">{family.name_bn}</p> : null}
                      </td>
                      <td className="py-3 pr-4 align-middle font-mono text-xs text-muted-foreground">{family.slug}</td>
                      <td className="py-3 pr-4 align-middle">
                        <Badge variant="secondary">{family.kind}</Badge>
                      </td>
                      <td className="py-3 pr-4 align-middle">{family.model_count}</td>
                      <td className="py-3 pr-4 align-middle" onClick={(event) => event.stopPropagation()}>
                        <Switch
                          checked={family.is_active}
                          disabled={togglingId === family.id}
                          aria-label={`${family.is_active ? 'Archive' : 'Restore'} ${family.name_en}`}
                          onCheckedChange={() => toggleActive(family)}
                        />
                      </td>
                      <td className="py-3 text-right align-middle" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setDialog({ open: true, family })}
                            data-testid={`family-edit-${family.slug}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-rose-600 hover:text-rose-700"
                            aria-label={`Delete ${family.name_en}`}
                            onClick={() => {
                              setDeleteError('')
                              setToDelete(family)
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
        </CardContent>
      </Card>

      <FamilyFormDialog
        open={dialog.open}
        family={dialog.family}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        onSaved={async () => {
          setDialog({ open: false, family: null })
          await refresh()
        }}
      />

      <Dialog open={!!toDelete} onOpenChange={(open) => !deleting && !open && setToDelete(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete family</DialogTitle>
            <DialogDescription>
              Delete &quot;{toDelete?.name_en}&quot;? Families that still have models cannot be deleted; archive them
              instead or delete the models first.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" data-testid="family-delete-error">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete family'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------- Issue form

type IssueDraft = Omit<IssueAdmin, 'id' | 'offering_count' | 'updated_at'>

function emptyIssueDraft(): IssueDraft {
  return {
    slug: '',
    name_en: '',
    name_bn: '',
    category: 'other',
    icon: '',
    applies_to: [],
    display_order: 0,
    is_active: true,
    default_content_en: '',
    default_content_bn: '',
    default_faq: [],
  }
}

function draftFromIssue(issue: IssueAdmin): IssueDraft {
  return {
    slug: issue.slug ?? '',
    name_en: issue.name_en ?? '',
    name_bn: issue.name_bn ?? '',
    category: issue.category ?? 'other',
    icon: issue.icon ?? '',
    applies_to: Array.isArray(issue.applies_to) ? issue.applies_to.map(Number) : [],
    display_order: issue.display_order ?? 0,
    is_active: issue.is_active !== false,
    default_content_en: issue.default_content_en ?? '',
    default_content_bn: issue.default_content_bn ?? '',
    default_faq: normalizeFaq(issue.default_faq),
  }
}

function IssueForm({
  issue,
  families,
  onSaved,
  onCancel,
}: {
  issue: IssueAdmin | null
  families: FamilyAdmin[]
  onSaved: (saved: IssueAdmin) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [draft, setDraft] = useState<IssueDraft>(() => (issue ? draftFromIssue(issue) : emptyIssueDraft()))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const patch = (partial: Partial<IssueDraft>) => setDraft((current) => ({ ...current, ...partial }))

  const toggleFamily = (familyId: number) => {
    patch({
      applies_to: draft.applies_to.includes(familyId)
        ? draft.applies_to.filter((id) => id !== familyId)
        : [...draft.applies_to, familyId],
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.name_en.trim()) {
      setErrors({ name_en: 'Name (EN) is required.' })
      return
    }
    setSaving(true)
    setErrors({})
    const payload: IssuePayload = {
      ...draft,
      slug: draft.slug.trim(),
      name_en: draft.name_en.trim(),
      default_faq: cleanFaq(draft.default_faq),
    }
    try {
      const saved = issue ? await updateIssue(issue.id, payload) : await createIssue(payload)
      toast({
        title: issue ? 'Issue saved' : 'Issue created',
        description: `"${saved.name_en}" was ${issue ? 'updated' : 'created'}.`,
        variant: 'success',
      })
      onSaved(saved)
    } catch (err: unknown) {
      setErrors(getFieldErrors(err))
      toast({
        title: 'Save failed',
        description: getErrorDetail(err, 'Could not save this issue right now.'),
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="issue-form">
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
          placeholderEn="Screen replacement"
          testIdEn="issue-name-en"
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Slug" error={errors.slug} hint="Blank = auto.">
            <Input value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} placeholder="screen" />
          </Field>
          <Field label="Category" error={errors.category}>
            <NativeSelect
              value={draft.category}
              onChange={(event) => patch({ category: event.target.value as IssueDraft['category'] })}
            >
              {ISSUE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Icon" error={errors.icon}>
            <Input value={draft.icon} onChange={(event) => patch({ icon: event.target.value })} placeholder="monitor" />
          </Field>
          <Field label="Active" error={errors.is_active}>
            <div className="flex h-10 items-center">
              <Switch checked={draft.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} />
            </div>
          </Field>
        </div>

        <Field
          label="Applies to families"
          error={errors.applies_to}
          hint="Only these families show this issue in their matrix. Leave all unchecked to hide it everywhere."
        >
          {families.length === 0 ? (
            <p className="text-xs text-muted-foreground">No families yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {families.map((family) => {
                const checked = draft.applies_to.includes(family.id)
                return (
                  <label
                    key={family.id}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition',
                      checked
                        ? 'border-primary/40 bg-[rgb(var(--theme-primary-soft-rgb)/0.72)] text-[rgb(var(--theme-primary-ink-rgb))]'
                        : 'border-[rgb(var(--theme-border-rgb)/0.8)] bg-white/60 text-foreground'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[rgb(var(--theme-primary-rgb))]"
                      checked={checked}
                      onChange={() => toggleFamily(family.id)}
                      data-testid={`issue-applies-${family.slug}`}
                    />
                    {family.name_en}
                  </label>
                )
              })}
            </div>
          )}
        </Field>

        <SectionHeading
          title="Default content"
          description="Used for every model offering of this issue that has no custom content of its own."
        />
        <TemplateVariablesHelp />
        <BilingualPair
          label="Default content (Markdown)"
          multiline
          rows={10}
          valueEn={draft.default_content_en}
          valueBn={draft.default_content_bn}
          onChangeEn={(value) => patch({ default_content_en: value })}
          onChangeBn={(value) => patch({ default_content_bn: value })}
          errorEn={errors.default_content_en}
          errorBn={errors.default_content_bn}
          placeholderEn={'## {{issue.name}} for {{model.name}}\n\nAt {{brand}} in {{city}} we…'}
        />
        <FaqEditor
          label="Default FAQ"
          items={draft.default_faq}
          onChange={(default_faq) => patch({ default_faq })}
          error={errors.default_faq}
          hint="Template variables work here too."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={saving} data-testid="issue-save">
          {saving ? 'Saving...' : issue ? 'Save issue' : 'Create issue'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ---------------------------------------------------------------- Issues tab

function IssuesTab() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [dialog, setDialog] = useState<{ open: boolean; issue: IssueAdmin | null }>({ open: false, issue: null })
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<IssueAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data, isLoading, error } = useQuery({ queryKey: ISSUES_QUERY_KEY, queryFn: getIssues })
  const { data: familiesData } = useQuery({ queryKey: FAMILIES_QUERY_KEY, queryFn: getFamilies })
  const issues = useMemo(() => data ?? [], [data])
  const families = useMemo(() => familiesData ?? [], [familiesData])
  const familyById = useMemo(() => new Map(families.map((family) => [family.id, family])), [families])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ISSUES_QUERY_KEY })

  const toggleActive = async (issue: IssueAdmin) => {
    setTogglingId(issue.id)
    try {
      await updateIssue(issue.id, { is_active: !issue.is_active })
      await refresh()
    } catch (err: unknown) {
      toast({ title: 'Update failed', description: getErrorDetail(err, 'Could not update this issue.'), variant: 'error' })
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteIssue(toDelete.id)
      setToDelete(null)
      await refresh()
      toast({ title: 'Issue deleted', variant: 'success' })
    } catch (err: unknown) {
      setDeleteError(getErrorDetail(err, 'Could not delete this issue right now.'))
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) return <LoadingPanel label="Loading issues..." />
  if (error) return <ErrorPanel error={error} subject="issues" />

  return (
    <>
      <Card className="theme-panel rounded-[1.8rem] border-0">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Repair issues</CardTitle>
            <CardDescription>
              The repair types offered across the catalog. Each issue carries a default content template.
            </CardDescription>
          </div>
          <Button className="rounded-xl" onClick={() => setDialog({ open: true, issue: null })} data-testid="issue-create-button">
            <Plus className="mr-2 h-4 w-4" />
            New issue
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="catalog-issues-table">
              <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Slug</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Applies to</th>
                  <th className="pb-3 pr-4">Offerings</th>
                  <th className="pb-3 pr-4">Active</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-sm text-muted-foreground">
                      No issues yet. Create one (e.g. Screen replacement) and choose which families it applies to.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr
                      key={issue.id}
                      data-testid={`issue-row-${issue.slug}`}
                      className={cn(
                        'border-t border-[rgb(var(--theme-border-rgb)/0.7)] transition hover:bg-white/50',
                        !issue.is_active && 'opacity-60'
                      )}
                    >
                      <td className="py-3 pr-4 align-middle">
                        <p className="font-medium text-foreground">{issue.name_en}</p>
                        {issue.name_bn ? <p className="text-xs text-muted-foreground">{issue.name_bn}</p> : null}
                      </td>
                      <td className="py-3 pr-4 align-middle font-mono text-xs text-muted-foreground">{issue.slug}</td>
                      <td className="py-3 pr-4 align-middle">
                        <Badge variant="secondary">{issue.category}</Badge>
                      </td>
                      <td className="py-3 pr-4 align-middle">
                        {issue.applies_to.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {issue.applies_to.map((familyId) => (
                              <span
                                key={familyId}
                                className="rounded-full bg-[rgb(var(--theme-neutral-rgb))] px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                              >
                                {familyById.get(familyId)?.name_en ?? `#${familyId}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-middle">{issue.offering_count}</td>
                      <td className="py-3 pr-4 align-middle">
                        <Switch
                          checked={issue.is_active}
                          disabled={togglingId === issue.id}
                          aria-label={`${issue.is_active ? 'Deactivate' : 'Activate'} ${issue.name_en}`}
                          onCheckedChange={() => toggleActive(issue)}
                        />
                      </td>
                      <td className="py-3 text-right align-middle">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setDialog({ open: true, issue })}
                            data-testid={`issue-edit-${issue.slug}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-rose-600 hover:text-rose-700"
                            aria-label={`Delete ${issue.name_en}`}
                            onClick={() => {
                              setDeleteError('')
                              setToDelete(issue)
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
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{dialog.issue ? `Edit ${dialog.issue.name_en}` : 'New issue'}</DialogTitle>
            <DialogDescription>
              Issues are repair types (screen, battery…). Default content is the fallback for every model.
            </DialogDescription>
          </DialogHeader>
          {dialog.open ? (
            <IssueForm
              issue={dialog.issue}
              families={families}
              onSaved={async () => {
                setDialog({ open: false, issue: null })
                await refresh()
              }}
              onCancel={() => setDialog((current) => ({ ...current, open: false }))}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(open) => !deleting && !open && setToDelete(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete issue</DialogTitle>
            <DialogDescription>
              Delete &quot;{toDelete?.name_en}&quot;? Issues that already have offerings cannot be deleted; deactivate
              them instead.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" data-testid="issue-delete-error">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------- Page shell

export default function AdminCatalog() {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const tab = searchParams?.get('tab') === 'issues' ? 'issues' : 'families'

  const setTab = (next: 'families' | 'issues') => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (next === 'families') params.delete('tab')
    else params.set('tab', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Device families, repair issues, and per-family price matrices for the public catalog.
        </p>
        <div className="flex gap-2">
          <Button
            data-testid="catalog-tab-families"
            variant={tab === 'families' ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setTab('families')}
          >
            <Layers className="mr-2 h-4 w-4" />
            Families
          </Button>
          <Button
            data-testid="catalog-tab-issues"
            variant={tab === 'issues' ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setTab('issues')}
          >
            <Wrench className="mr-2 h-4 w-4" />
            Issues
          </Button>
        </div>
      </div>

      {tab === 'issues' ? <IssuesTab /> : <FamiliesTab />}
    </div>
  )
}
