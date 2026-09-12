# Sync Log — applelab

Derived from bp-company @ f8da4c3 (2026-08-27).
See SYNC_GATE.md for the two-repo protocol. Statuses: synced / PENDING / n/a.

| Date | Phase | Commit(s) | Description | Class | Direction | Status |
|------|-------|-----------|-------------|-------|-----------|--------|
| 2026-08-27 | derive | (baseline) | Generated from bp-company @ f8da4c3 via setup.sh | generic | template→client | synced |
| 2026-08-28 | BP-4 fixup | 34a77bb | SiteFooter duplicate React keys — cherry-picked from template ae5cebd | generic | template→applelab | synced |
| 2026-09-12 | AL-0 | 53ec777..146586e | Owner-built homepage (design port), DEPLOY.md, gunicorn; moved template chrome into a `(site)` route group so the bespoke home renders its own nav/footer — client-specific by owner decision, NOT harvested | client | — | n/a |
| 2026-09-12 | AL-0 | (this commit set) | Homepage standardized on template files: tokens.css holds Apple Lab values, applelab-home.css consumes tokens, all copy in messages/*.json `applelab` namespace (EN+BN), NAP/hours/WhatsApp/map/meta from SiteConfig; Bengali font via next/font in theme/fonts.ts; body font class in app/layout.tsx | client | — | n/a |
| 2026-09-12 | AL-0 | (this commit set) | backend `repairs` app + `seed_applelab` (SiteConfig, 8-stage repair pipeline, archives generic stages, drops demo leads); LEADS_REFERENCE_PREFIX=APL; CI e2e runs seed_applelab | client | — | n/a |
| 2026-09-12 | AL-0 | (this commit set) | e2e: `site.config.ts` centralizes client expectations; generic specs (i18n, leads) read it; template demo-home spec (content.spec) retired; home.spec added | generic? | — (harvest of the site.config pattern deferred by owner: BP work paused) | n/a |
