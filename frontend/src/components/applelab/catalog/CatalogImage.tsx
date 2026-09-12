/**
 * Catalog picture (served from /media/). Plain <img>: files are already
 * WebP-optimised on upload, and the fixed-ratio box around it prevents layout
 * shift. Renders nothing when there is no image.
 */
export default function CatalogImage({
  src,
  alt,
  className,
  priority = false,
  testId,
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  testId?: string
}) {
  if (!src) return null
  return (
    <div className={['cat-media', className].filter(Boolean).join(' ')}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        data-testid={testId}
      />
    </div>
  )
}
