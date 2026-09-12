/**
 * Site-specific expectations for the e2e suite (Apple Lab).
 *
 * The template's generic specs (smoke, i18n, styleguide, leads) read this
 * file instead of hardcoding client details, so a client site only edits
 * here — never the spec files themselves.
 */
export const SITE = {
  /** Substring of the homepage hero headline in each locale. */
  heroHeadline: {
    en: 'Your Apple device',
    bn: 'আপনার অ্যাপল ডিভাইস',
  },

  /** Pipeline stages as configured by the backend seed (seed_applelab). */
  stages: {
    /** Slug new leads land in (first active stage). */
    initial: 'pending',
    /** A non-terminal stage that needs no reason. */
    next: 'confirmed',
    /** A terminal stage that requires a reason. */
    terminalWithReason: 'cancelled',
    terminalWithReasonName: 'Cancelled',
    /** Every active stage name, in pipeline order. */
    names: [
      'Pending',
      'Confirmed',
      'Diagnosed',
      'In Progress',
      'Ready for Pickup',
      'Completed',
      'Cancelled',
      'Could Not Repair',
    ],
  },

  /** NAP values from SiteConfig (seed_applelab). */
  contact: {
    phonePrimary: '01603-710044',
    whatsappDigits: '8801603710044',
    brand: 'Apple Lab',
  },

  /** Device catalog (backend `seed_catalog`). */
  catalog: {
    familyCount: 10,
    family: { slug: 'iphone', name: 'iPhone', nameBn: 'আইফোন', minModels: 30 },
    model: { slug: '15-pro', name: 'iPhone 15 Pro', chip: 'A17 Pro', searchTerm: '15 Pro' },
    issue: { slug: 'screen-replacement', name: 'Screen Replacement', adminName: 'Screen Replacement' },
    /** Written and then cleared by the admin → public revalidation test. */
    testPrice: '23456',
    testPriceDisplay: '৳ 23,456',
  },
} as const
