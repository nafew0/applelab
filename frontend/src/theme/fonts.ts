import { Noto_Sans_Bengali } from 'next/font/google'

/**
 * Client font files (the token slots are named in tokens.css).
 *
 * Bengali is a launch requirement and the SF Pro system stack has no Bengali
 * glyphs, so Noto Sans Bengali is loaded through next/font: downloaded at
 * build time and self-hosted — no runtime request to Google, no CSP change.
 * The generated CSS variable feeds `--font-alt-script` in tokens.css; apply
 * `bengaliFont.variable` on <body> (see app/layout.tsx).
 */
export const bengaliFont = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-bengali',
})
