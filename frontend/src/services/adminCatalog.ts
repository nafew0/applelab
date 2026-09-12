import api from './api'

/**
 * Typed client for the staff catalog-management API (`/api/admin/catalog/`).
 * All endpoints require a staff JWT (handled by the shared axios client).
 */

const BASE = '/admin/catalog'

// ---------- Shared types ----------

export type FamilyKind = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'watch' | 'audio' | 'headset'

export const FAMILY_KINDS: FamilyKind[] = ['phone', 'tablet', 'laptop', 'desktop', 'watch', 'audio', 'headset']

export type IssueCategory =
  | 'screen'
  | 'battery'
  | 'power'
  | 'board'
  | 'audio'
  | 'camera'
  | 'input'
  | 'body'
  | 'software'
  | 'upgrade'
  | 'liquid'
  | 'connectivity'
  | 'other'

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'screen',
  'battery',
  'power',
  'board',
  'audio',
  'camera',
  'input',
  'body',
  'software',
  'upgrade',
  'liquid',
  'connectivity',
  'other',
]

export type IndexPolicy = 'auto' | 'index' | 'noindex'
export type ContentStatus = 'draft' | 'review' | 'published'

export const INDEX_POLICIES: IndexPolicy[] = ['auto', 'index', 'noindex']
export const CONTENT_STATUSES: ContentStatus[] = ['draft', 'review', 'published']

export interface FaqItem {
  q_en: string
  q_bn: string
  a_en: string
  a_bn: string
}

export interface PriceOption {
  label: string
  price: string
  warranty_days: number | null
}

// ---------- Families ----------

export interface FamilyAdmin {
  id: number
  slug: string
  name_en: string
  name_bn: string
  kind: FamilyKind
  icon: string
  /** Site-relative URL (/media/…) or ''; change it with uploadCatalogImage. */
  image: string
  display_order: number
  is_active: boolean
  intro_en: string
  intro_bn: string
  content_en: string
  content_bn: string
  faq: FaqItem[]
  seo_title_en: string
  seo_title_bn: string
  seo_description_en: string
  seo_description_bn: string
  model_count: number
  updated_at: string
}

export type FamilyPayload = Partial<
  Omit<FamilyAdmin, 'id' | 'image' | 'model_count' | 'updated_at'>
>

export async function getFamilies(): Promise<FamilyAdmin[]> {
  const response = await api.get(`${BASE}/families/`)
  const data = response.data
  return Array.isArray(data) ? data : data?.results ?? []
}

export async function getFamily(id: number | string): Promise<FamilyAdmin> {
  const response = await api.get(`${BASE}/families/${id}/`)
  return response.data
}

export async function createFamily(payload: FamilyPayload): Promise<FamilyAdmin> {
  const response = await api.post(`${BASE}/families/`, payload)
  return response.data
}

export async function updateFamily(id: number | string, payload: FamilyPayload): Promise<FamilyAdmin> {
  const response = await api.patch(`${BASE}/families/${id}/`, payload)
  return response.data
}

export async function deleteFamily(id: number | string): Promise<void> {
  await api.delete(`${BASE}/families/${id}/`)
}

export async function reorderFamilies(order: number[]): Promise<void> {
  await api.post(`${BASE}/families/reorder/`, { order })
}

// ---------- Models ----------

export interface ModelFamilyRef {
  id: number
  slug: string
  name_en: string
}

export interface ModelAdmin {
  id: number
  family: ModelFamilyRef
  slug: string
  name_en: string
  name_bn: string
  line: string
  size_label: string
  chip: string
  generation: string
  release_year: number | null
  release_label: string
  model_numbers: string[]
  apple_identifier: string
  image: string
  display_order: number
  is_active: boolean
  is_featured: boolean
  notes_en: string
  notes_bn: string
  content_en: string
  content_bn: string
  faq: FaqItem[]
  seo_title_en: string
  seo_title_bn: string
  seo_description_en: string
  seo_description_bn: string
  reference_source: string
  offering_count: number
  updated_at: string
}

export type ModelPayload = Partial<
  Omit<ModelAdmin, 'id' | 'family' | 'image' | 'offering_count' | 'updated_at'>
> & { family_id?: number }

export interface ModelListParams {
  family?: string
  search?: string
  year?: string | number
  line?: string
  is_active?: string
  page?: string | number
  page_size?: string | number
}

export interface ModelListResponse {
  count: number
  next: string | null
  previous: string | null
  results: ModelAdmin[]
}

function buildParams(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    searchParams.set(key, String(value))
  })
  return searchParams
}

export async function getModels(params: ModelListParams = {}): Promise<ModelListResponse> {
  const response = await api.get(
    `${BASE}/models/?${buildParams(params as Record<string, string | number | undefined>).toString()}`
  )
  const data = response.data
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data }
  }
  return data
}

export async function getModel(id: number | string): Promise<ModelAdmin> {
  const response = await api.get(`${BASE}/models/${id}/`)
  return response.data
}

export async function createModel(payload: ModelPayload): Promise<ModelAdmin> {
  const response = await api.post(`${BASE}/models/`, payload)
  return response.data
}

export async function updateModel(id: number | string, payload: ModelPayload): Promise<ModelAdmin> {
  const response = await api.patch(`${BASE}/models/${id}/`, payload)
  return response.data
}

export async function deleteModel(id: number | string): Promise<void> {
  await api.delete(`${BASE}/models/${id}/`)
}

export interface DuplicateModelPayload {
  slug?: string
  name_en?: string
  name_bn?: string
  chip?: string
  release_year?: number | null
  model_numbers?: string[]
}

/** Copies attributes + offerings into a new (inactive) model. */
export async function duplicateModel(
  id: number | string,
  payload: DuplicateModelPayload = {}
): Promise<ModelAdmin> {
  const response = await api.post(`${BASE}/models/${id}/duplicate/`, payload)
  return response.data
}

export async function applyIssuesToModel(
  id: number | string,
  issueIds: number[]
): Promise<{ created: number; total: number }> {
  const response = await api.post(`${BASE}/models/${id}/apply-issues/`, { issue_ids: issueIds })
  return response.data
}

// ---------- Offerings ----------

export interface OfferingIssueRef {
  id: number
  slug: string
  name_en: string
  category: IssueCategory
}

export interface OfferingAdmin {
  id: number
  model_id: number
  issue: OfferingIssueRef
  is_active: boolean
  price_from: string | null
  price_options: PriceOption[]
  reference_price: string | null
  turnaround_hours: number | null
  warranty_days: number | null
  content_en: string
  content_bn: string
  faq: FaqItem[]
  index_policy: IndexPolicy
  content_status: ContentStatus
  unique_words: number
  is_indexable: boolean
  /** This model's own repair icon ('' → the repair type's icon, issue_image, is used). */
  image: string
  issue_image: string
  updated_at: string
}

export interface OfferingPayload {
  is_active?: boolean
  price_from?: string | null
  price_options?: PriceOption[]
  reference_price?: string | null
  turnaround_hours?: number | null
  warranty_days?: number | null
  content_en?: string
  content_bn?: string
  faq?: FaqItem[]
  index_policy?: IndexPolicy
  content_status?: ContentStatus
}

export async function getModelOfferings(modelId: number | string): Promise<OfferingAdmin[]> {
  const response = await api.get(`${BASE}/models/${modelId}/offerings/`)
  const data = response.data
  return Array.isArray(data) ? data : data?.results ?? []
}

export async function updateOffering(
  id: number | string,
  payload: OfferingPayload
): Promise<OfferingAdmin> {
  const response = await api.patch(`${BASE}/offerings/${id}/`, payload)
  return response.data
}

export async function deleteOffering(id: number | string): Promise<void> {
  await api.delete(`${BASE}/offerings/${id}/`)
}

// ---------- Issues ----------

export interface IssueAdmin {
  id: number
  slug: string
  name_en: string
  name_bn: string
  category: IssueCategory
  icon: string
  image: string
  applies_to: number[]
  display_order: number
  is_active: boolean
  default_content_en: string
  default_content_bn: string
  default_faq: FaqItem[]
  offering_count: number
  updated_at: string
}

export type IssuePayload = Partial<Omit<IssueAdmin, 'id' | 'image' | 'offering_count' | 'updated_at'>>

export async function getIssues(): Promise<IssueAdmin[]> {
  const response = await api.get(`${BASE}/issues/`)
  const data = response.data
  return Array.isArray(data) ? data : data?.results ?? []
}

export async function createIssue(payload: IssuePayload): Promise<IssueAdmin> {
  const response = await api.post(`${BASE}/issues/`, payload)
  return response.data
}

export async function updateIssue(id: number | string, payload: IssuePayload): Promise<IssueAdmin> {
  const response = await api.patch(`${BASE}/issues/${id}/`, payload)
  return response.data
}

export async function deleteIssue(id: number | string): Promise<void> {
  await api.delete(`${BASE}/issues/${id}/`)
}

// ---------- Matrix ----------

export interface MatrixModel {
  id: number
  slug: string
  name_en: string
  release_year: number | null
  line: string
}

export interface MatrixIssue {
  id: number
  slug: string
  name_en: string
  category: IssueCategory
}

export interface MatrixCell {
  id: number
  model_id: number
  issue_id: number
  is_active: boolean
  price_from: string | null
  reference_price: string | null
  content_status: ContentStatus
}

export interface MatrixResponse {
  family: ModelFamilyRef
  models: MatrixModel[]
  issues: MatrixIssue[]
  cells: MatrixCell[]
}

export interface MatrixCellInput {
  model_id: number
  issue_id: number
  is_active?: boolean
  price_from?: string | null
}

export async function getMatrix(familySlug: string): Promise<MatrixResponse> {
  const response = await api.get(`${BASE}/matrix/?${buildParams({ family: familySlug }).toString()}`)
  return response.data
}

/** Upserts offerings for the given cells (max 2000 per request). */
export async function saveMatrix(cells: MatrixCellInput[]): Promise<{ created: number; updated: number }> {
  const response = await api.post(`${BASE}/matrix/`, { cells })
  return response.data
}

// ---------- Error helpers ----------

interface AxiosLikeError {
  response?: {
    status?: number
    data?: unknown
  }
}

export function getErrorStatus(error: unknown): number | undefined {
  return (error as AxiosLikeError)?.response?.status
}

/**
 * Field-level errors from a DRF 400 (`{field: [msg]}`) keyed by field name.
 * `detail` / `non_field_errors` are excluded; use `getErrorDetail` for those.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const data = (error as AxiosLikeError)?.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  const result: Record<string, string> = {}
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (key === 'detail' || key === 'non_field_errors') return
    if (Array.isArray(value)) {
      result[key] = value.map((item) => String(item)).join(' ')
    } else if (typeof value === 'string') {
      result[key] = value
    } else if (value && typeof value === 'object') {
      // Nested serializer errors (e.g. faq[0].q_en) — flatten to one line.
      result[key] = JSON.stringify(value)
    }
  })
  return result
}

/** Human-readable message for a failed request: `detail`, non-field errors, or the first field error. */
export function getErrorDetail(error: unknown, fallback: string): string {
  const e = error as AxiosLikeError
  const data = e?.response?.data
  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    if (record.non_field_errors) {
      const nfe = record.non_field_errors
      return Array.isArray(nfe) ? nfe.join(' ') : String(nfe)
    }
    const fields = getFieldErrors(error)
    const first = Object.entries(fields)[0]
    if (first) return `${first[0]}: ${first[1]}`
  }
  if (Array.isArray(data) && data.length) return data.map(String).join(' ')
  return fallback
}

// ---------- Images ----------

export type CatalogImageKind = 'families' | 'models' | 'issues' | 'offerings'

/** Upload (or replace) a catalog image; the server stores it as WebP. Returns the new URL. */
export async function uploadCatalogImage(kind: CatalogImageKind, id: number, file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const response = await api.post(`${BASE}/${kind}/${id}/image/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data?.image ?? ''
}

export async function removeCatalogImage(kind: CatalogImageKind, id: number): Promise<void> {
  await api.delete(`${BASE}/${kind}/${id}/image/`)
}
