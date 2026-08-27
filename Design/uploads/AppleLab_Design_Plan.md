# AppleLab — Design System & Homepage Design Plan
**Version:** 1.0 | **Date:** May 2026  
**Design Direction:** Apple-Mirrored Premium Repair Identity  
**Reference:** apple.com visual language, adapted for a service brand

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Spacing & Layout Grid](#4-spacing--layout-grid)
5. [Component Library](#5-component-library)
6. [Animation & Motion System](#6-animation--motion-system)
7. [Backgrounds & Visual Atmosphere](#7-backgrounds--visual-atmosphere)
8. [Responsive Breakpoints](#8-responsive-breakpoints)
9. [CSS Custom Properties Reference](#9-css-custom-properties-reference)
10. [Homepage Section-by-Section Plan](#10-homepage-section-by-section-plan)
11. [Asset & Icon Strategy](#11-asset--icon-strategy)
12. [Dark / Light Mode Strategy](#12-dark--light-mode-strategy)

---

## 1. Design Philosophy

### Direction: "Apple Store — Repair Edition"

The site mirrors apple.com's visual DNA exactly: cinematic whitespace, product-first imagery, restrained typography, and surgical use of color. The only thing that changes is the *subject* — instead of selling devices, we're selling trust, expertise, and speed of repair.

**Three Core Principles:**

| Principle | What it means |
|-----------|--------------|
| **Cinematic clarity** | Each section tells one story. No clutter, no competing elements. Device imagery breathes. |
| **Typography as hero** | Bold, large headlines do the emotional work. Body copy is efficient and factual. |
| **Color as precision tool** | The brand gradient (`#009BFF → #00FFF4`) appears sparingly — on CTAs, icons, and highlights only. It earns its appearance. |

### What We Copy Exactly from Apple.com

- Full-width sections, each with a single background color
- Section-to-section alternating: white → light gray → black → white
- Centered typographic hierarchy with huge leading headlines
- Pill-shaped buttons (primary filled, secondary outlined)
- Product/device imagery centered, floating, with subtle drop shadow
- Sticky translucent navigation bar (`backdrop-filter: blur(20px)`)
- Horizontal feature card rows with caption above headline
- Link style: colored text + right-arrow chevron, no underline
- Icon labels with round-rect backgrounds or plain inline SVG
- Breadcrumb-style small category labels above section headings

---

## 2. Color System

### 2.1 Brand Origin

The AppleLab logo uses a linear gradient:
```
#009BFF → #00FFF4
```
This is the brand's DNA. It reads as electric, tech-forward, and uniquely "AppleLab" against Apple's own blue. We build the entire system from this.

### 2.2 Primary Color — Brand Blue

**Base:** `#009BFF`

| Token | Hex | Usage |
|-------|-----|-------|
| `--blue-50` | `#E6F6FF` | Tint backgrounds, selected states |
| `--blue-100` | `#B3E2FF` | Light badge fills |
| `--blue-200` | `#80CDFF` | Hover tint overlays |
| `--blue-300` | `#4DB9FF` | Decorative accents |
| `--blue-400` | `#1AA6FF` | Secondary interactive |
| `--blue-500` | `#009BFF` | **Primary — buttons, links, key icons** |
| `--blue-600` | `#007FD4` | Button hover state |
| `--blue-700` | `#0063A9` | Button active/pressed |
| `--blue-800` | `#004880` | Dark section links |
| `--blue-900` | `#002E57` | Deep dark accents |

### 2.3 Accent Color — Brand Cyan

**Base:** `#00FFF4`

| Token | Hex | Usage |
|-------|-----|-------|
| `--cyan-50` | `#E6FFFD` | Very light tint |
| `--cyan-100` | `#B3FFF9` | Subtle glow backgrounds |
| `--cyan-200` | `#80FFF5` | Icon shimmer |
| `--cyan-300` | `#4DFFF2` | Gradient midpoint |
| `--cyan-400` | `#1AFFE` | Secondary CTA glow |
| `--cyan-500` | `#00FFF4` | **Accent — gradient endpoint, highlights** |
| `--cyan-600` | `#00D4CA` | Active states |
| `--cyan-700` | `#00A99F` | Muted accent |
| `--cyan-800` | `#007F77` | Dark section only |
| `--cyan-900` | `#005450` | Deepest accent |

### 2.4 Brand Gradient

```css
--gradient-brand: linear-gradient(90deg, #009BFF 0%, #00FFF4 100%);
--gradient-brand-diagonal: linear-gradient(135deg, #009BFF 0%, #00FFF4 100%);
--gradient-brand-vertical: linear-gradient(180deg, #009BFF 0%, #00FFF4 100%);

/* Glow version for dark sections */
--gradient-brand-glow: linear-gradient(90deg, #009BFF 0%, #00FFF4 100%);
```

**Usage rules:**
- Applied to: CTA buttons (as background), key icon fills, section divider lines, trust badge text
- NOT applied to: body text, card backgrounds, navigation, headings
- Max 2 gradient elements per viewport at any time

### 2.5 Neutral Palette (Apple Mirrors)

These match Apple's exact neutral system, which is the backbone of the design.

| Token | Hex | Apple Equivalent | Usage |
|-------|-----|-----------------|-------|
| `--gray-0` | `#FFFFFF` | White | Primary background |
| `--gray-50` | `#F5F5F7` | `#f5f5f7` (Apple exact) | Alternate section BG |
| `--gray-100` | `#E8E8ED` | — | Dividers, borders |
| `--gray-200` | `#D2D2D7` | — | Input borders, disabled |
| `--gray-300` | `#B8B8BF` | — | Placeholder text |
| `--gray-400` | `#86868B` | — | Caption text |
| `--gray-500` | `#6E6E73` | `#6e6e73` (Apple exact) | Secondary body text |
| `--gray-600` | `#515154` | — | Meta text |
| `--gray-700` | `#3A3A3C` | — | Subheadings on dark |
| `--gray-800` | `#1D1D1F` | `#1d1d1f` (Apple exact) | Primary text |
| `--gray-900` | `#0A0A0A` | — | Near-black for dark sections |
| `--black` | `#000000` | `#000000` | Full-black hero sections |

### 2.6 Semantic Color Tokens

```css
/* Backgrounds */
--bg-primary:     #FFFFFF;
--bg-secondary:   #F5F5F7;   /* Apple's gray sections */
--bg-dark:        #000000;   /* Full-black sections */
--bg-dark-card:   #1D1D1F;   /* Cards on dark BG */
--bg-nav:         rgba(255, 255, 255, 0.82);   /* Translucent nav */
--bg-nav-dark:    rgba(0, 0, 0, 0.82);

/* Text */
--text-primary:   #1D1D1F;
--text-secondary: #6E6E73;
--text-tertiary:  #86868B;
--text-inverse:   #FFFFFF;
--text-link:      #009BFF;   /* Brand blue replaces Apple's #0071e3 */

/* States */
--color-success:  #34C759;   /* iOS green */
--color-warning:  #FF9F0A;   /* iOS amber */
--color-error:    #FF3B30;   /* iOS red */
--color-info:     #009BFF;   /* Brand blue */

/* Status (repair tracking) */
--status-pending:     #FF9F0A;
--status-confirmed:   #007AFF;
--status-diagnosed:   #AF52DE;
--status-inprogress:  #009BFF;
--status-ready:       #34C759;
--status-completed:   #34C759;
--status-nofig:       #FF3B30;
--status-cancelled:   #8E8E93;
```

---

## 3. Typography System

### 3.1 Font Stack

Apple uses **SF Pro** (their proprietary font). We use the same system font stack that delivers SF Pro on Apple devices and Segoe UI on Windows — exactly what apple.com itself uses:

```css
--font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                "Helvetica Neue", Helvetica, Arial, sans-serif;

--font-text:    -apple-system, BlinkMacSystemFont, "SF Pro Text",
                "Helvetica Neue", Helvetica, Arial, sans-serif;

--font-mono:    "SF Mono", "Fira Mono", "Roboto Mono", monospace;
```

**Brand-specific:**  
The logo uses `Geom Graphic SemiBold`. We import this font and use it ONLY for the logotype wordmark in the nav and footer. Nowhere else — this maintains visual hierarchy.

```css
@font-face {
  font-family: 'Geom Graphic';
  src: url('/fonts/GeomGraphic-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
--font-brand: 'Geom Graphic', -apple-system, sans-serif;
```

### 3.2 Type Scale (Apple-Exact Sizing)

All sizes match apple.com's actual rendered font sizes as precisely as possible.

| Token | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| `--text-hero` | `80px` | `1.05` | `700` | `-0.015em` | Hero mega headline |
| `--text-hero-sm` | `56px` | `1.07` | `700` | `-0.012em` | Hero on smaller viewports |
| `--text-headline-xl` | `56px` | `1.07` | `700` | `-0.005em` | Major section headlines |
| `--text-headline-lg` | `48px` | `1.08` | `700` | `-0.003em` | Section headlines |
| `--text-headline-md` | `40px` | `1.1` | `700` | `0` | Subsection heads |
| `--text-headline-sm` | `32px` | `1.125` | `700` | `0` | Card headlines |
| `--text-title-xl` | `28px` | `1.14` | `600` | `0` | Feature titles |
| `--text-title-lg` | `24px` | `1.166` | `600` | `0` | Card titles |
| `--text-title-md` | `21px` | `1.19` | `600` | `0` | Sub-titles |
| `--text-body-xl` | `21px` | `1.381` | `400` | `0` | Lead paragraph |
| `--text-body-lg` | `19px` | `1.421` | `400` | `0` | Main body copy |
| `--text-body` | `17px` | `1.47` | `400` | `0` | Standard body (Apple default) |
| `--text-body-sm` | `15px` | `1.46` | `400` | `0` | Secondary body |
| `--text-caption` | `13px` | `1.38` | `400` | `0` | Captions, meta |
| `--text-label` | `12px` | `1.33` | `400` | `0.05em` | Category labels (uppercase) |

### 3.3 Typographic Patterns (Apple-Exact)

**Pattern 1 — Section with category label:**
```
[EYEBROW LABEL — 12px uppercase, --gray-500, letter-spacing: 0.05em]
[Headline — 56px bold, --text-primary]
[Subheadline — 21px regular, --text-secondary, max-width: 600px, centered]
```

**Pattern 2 — Feature card (dark background):**
```
[Category — 12px, brand blue, uppercase]
[Title — 28px bold, white]
[Body — 17px, #86868B]
```

**Pattern 3 — Hero:**
```
[Pre-headline optional — 17px, --text-secondary]
[Hero headline — 80px bold, black or white depending on BG]
[Sub — 28px regular, --text-secondary, max-width: 640px, centered]
[CTA row — pill button group, centered, margin-top: 32px]
```

**Pattern 4 — Trust bar:**
```
[Inline pipe-separated items — 17px regular, --text-secondary]
[Numbers/highlights in --text-primary or gradient]
```

### 3.4 Link Styles

```css
/* Standard text link (Apple blue) */
.link-primary {
  color: var(--text-link);          /* #009BFF */
  text-decoration: none;
  font-size: 17px;
}
.link-primary::after {
  content: " ›";                   /* Apple's chevron style */
}
.link-primary:hover {
  text-decoration: underline;
}

/* White link (on dark sections) */
.link-inverse {
  color: #FFFFFF;
  opacity: 0.92;
}

/* Small navigation link */
.link-nav {
  font-size: 14px;
  color: var(--gray-800);
  opacity: 0.88;
}
```

---

## 4. Spacing & Layout Grid

### 4.1 Spacing Scale

Apple uses an 8pt grid system. All spacing values are multiples of 8.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-4` | `4px` | Icon padding, micro gaps |
| `--space-8` | `8px` | Tight component internal padding |
| `--space-12` | `12px` | Small component gaps |
| `--space-16` | `16px` | Component internal spacing |
| `--space-20` | `20px` | — |
| `--space-24` | `24px` | Card padding, list gaps |
| `--space-32` | `32px` | Component grouping |
| `--space-40` | `40px` | — |
| `--space-48` | `48px` | Section internal padding |
| `--space-64` | `64px` | Section padding (mobile) |
| `--space-80` | `80px` | Section padding (tablet) |
| `--space-100` | `100px` | Section padding (desktop) |
| `--space-120` | `120px` | Hero section padding |
| `--space-140` | `140px` | Mega hero sections |

### 4.2 Layout Grid

```css
/* Content widths matching Apple exactly */
--content-max:      1200px;   /* Max content width */
--content-wide:     980px;    /* Standard Apple page width */
--content-narrow:   692px;    /* Text-heavy sections */
--content-tight:    560px;    /* Subheadlines, centered copy */

/* Section padding */
--section-py-desktop:  100px;
--section-py-tablet:   80px;
--section-py-mobile:   60px;

/* Grid */
--grid-cols: 12;
--grid-gap:  24px;
```

### 4.3 Section Backgrounds (Alternating Pattern)

Apple alternates section backgrounds in a defined rhythm. We follow this exactly:

```
Hero           → White (#FFFFFF) or full bleed image
Why Us         → Light Gray (#F5F5F7)
Device Grid    → White (#FFFFFF)
How It Works   → Black (#000000) ← dark section
Quote CTA      → Light Gray (#F5F5F7)
Status Tracker → White (#FFFFFF)
Testimonials   → Black (#000000) ← dark section
Corporate CTA  → Light Gray (#F5F5F7)
Blog Preview   → White (#FFFFFF)
Map / Contact  → Light Gray (#F5F5F7)
Footer         → #1D1D1F (dark gray)
```

---

## 5. Component Library

### 5.1 Buttons (Apple-Exact)

Apple's buttons are distinctive: pill-shaped, precise weight, no shadows.

```css
/* === PRIMARY BUTTON (Brand Blue) === */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  background-color: var(--blue-500);     /* #009BFF */
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.17;
  letter-spacing: -0.022em;
  border-radius: 980px;                  /* True pill */
  border: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
  white-space: nowrap;
  text-decoration: none;
}
.btn-primary:hover  { background-color: var(--blue-600); }
.btn-primary:active { background-color: var(--blue-700); transform: scale(0.98); }

/* === GRADIENT PRIMARY (for hero only) === */
.btn-gradient {
  background: var(--gradient-brand);
  color: #000;   /* Dark text on light gradient */
  /* ... same geometry as btn-primary */
}
.btn-gradient:hover { opacity: 0.88; }

/* === SECONDARY / OUTLINE === */
.btn-secondary {
  padding: 12px 22px;
  background: transparent;
  color: var(--blue-500);
  border: 1px solid var(--blue-500);
  border-radius: 980px;
  font-size: 17px;
  font-weight: 400;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.btn-secondary:hover {
  background-color: var(--blue-500);
  color: #FFFFFF;
}

/* === GHOST (on dark sections) === */
.btn-ghost-dark {
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 980px;
  /* ... same geometry */
  backdrop-filter: blur(8px);
}
.btn-ghost-dark:hover { background: rgba(255,255,255,0.2); }

/* === SMALL VARIANT === */
.btn-sm { padding: 8px 16px; font-size: 15px; }

/* === BUTTON GROUP (Apple pair layout) === */
.btn-group {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}
```

### 5.2 Navigation Bar

```
Height: 44px (Apple exact)
Background: rgba(255,255,255,0.82) — light mode
            rgba(0,0,0,0.82)       — on dark page sections
Backdrop filter: saturate(180%) blur(20px)
Border-bottom: 1px solid rgba(0,0,0,0.16)
Position: sticky top:0, z-index: 1000

Layout:
  [Logo + Wordmark] ←→ [Nav links] ←→ [CTA button + Lang toggle]

Logo:
  SVG AppleLab mark (32px height) + "Apple Lab" text in Geom Graphic
  Inline the gradient SVG — on dark sections it auto-reads as colored

Nav links:
  font-size: 14px
  color: #1D1D1F at 88% opacity
  Gap between links: 28px
  Hover: opacity 1.0

Right group:
  [বাংলা / EN toggle] — text, 13px — [Book a Repair — btn-primary btn-sm]

Mobile:
  Logo + Hamburger icon only
  Full-screen menu drawer (slides down from nav, 100vw)
```

### 5.3 Device Cards (Home Grid)

```
Layout: 3-col grid on desktop, 2-col on tablet, 1-col on mobile
Card anatomy:
  Container: 
    background: #FFFFFF
    border-radius: 20px
    padding: 32px 24px
    border: 1px solid rgba(0,0,0,0.06)
    transition: transform 0.3s ease, box-shadow 0.3s ease
  
  Hover state:
    transform: translateY(-6px)
    box-shadow: 0 20px 60px rgba(0,155,255,0.08), 0 4px 12px rgba(0,0,0,0.06)

  Content (vertically centered):
    [Device icon — 56px, gradient fill or monochrome]
    [Device name — 24px, 600 weight, #1D1D1F, mt: 20px]
    [Tap/click area label — 14px, brand blue, mt: 8px] → "View Services ›"
```

### 5.4 Feature / Why-Us Cards

Matching Apple's highlight feature grid:

```
Container: background #F5F5F7, border-radius 20px, padding 32px
No card border (Apple style on light gray BG)

Layout: 3-col on desktop, 2-col tablet, 1-col mobile

Card anatomy:
  [Icon — 40px round, background: white, icon in brand gradient]
  [Title — 21px, 600 weight, #1D1D1F, mt: 16px]
  [Body — 17px, #6E6E73, mt: 8px, max-width: 240px]
  [Link — 15px, brand blue, mt: 12px] → "Learn more ›"
```

### 5.5 How-It-Works Steps (Dark Section)

```
Dark background: #000000
Text hierarchy:
  Section eyebrow: 12px, brand blue, uppercase
  Section headline: 56px, bold, white
  
Step cards (horizontal scroll on mobile, 4-col grid desktop):
  No card background (cards are just content blocks)
  Step number: gradient text (brand gradient)
  Step icon: 40px, white with gradient stroke
  Title: 24px, 600, white
  Body: 17px, #86868B
  
  Connector line between steps: 1px dashed rgba(255,255,255,0.12)
```

### 5.6 Testimonial Cards (Dark Section)

```
Dark section: #000000
Card:
  background: #1D1D1F
  border-radius: 20px
  padding: 32px
  border: 1px solid rgba(255,255,255,0.06)

Anatomy:
  [Stars — 5 × iOS gold #FF9F0A, 14px]
  [Quote body — 19px, #E8E8ED, line-height 1.5]
  [Customer name — 15px, #86868B, mt: 16px]
  [Device repaired badge — 12px, brand blue, pill bg]
  
Carousel: 3 visible on desktop, 1 on mobile
Auto-plays with 4s interval, fade transition
Dot indicators below (brand blue active dot)
```

### 5.7 Trust Bar

```
Layout: Horizontal, pipe-separated on desktop | 2x2 grid on mobile
Background: Transparent (sits in hero section)

Item anatomy:
  [Number/highlight — 28px, 700, gradient text]
  [Label — 15px, #6E6E73]
  
Items:
  15+ Years Experience
  10,000+ Devices Repaired
  90-Day Warranty
  No Fix, No Fee
```

### 5.8 Sticky Repair Status Widget

```
A compact form widget embedded in the homepage (not a full section):
  Background: white, border-radius: 16px, shadow: 0 4px 24px rgba(0,0,0,0.08)
  padding: 24px 32px
  
  Layout (inline on desktop):
    [Ticket ID input] [Phone suffix input] [Track → btn-primary btn-sm]
  
  Result state: Slides in below with status timeline
  
  Input style:
    height: 44px (Apple form field standard)
    border: 1px solid #D2D2D7
    border-radius: 10px
    font-size: 17px
    padding: 0 14px
    focus: border-color: #009BFF, box-shadow: 0 0 0 3px rgba(0,155,255,0.15)
```

### 5.9 AI Chat Widget

```
Position: fixed, bottom: 32px, right: 32px
z-index: 9999

Trigger button:
  width: 56px, height: 56px
  background: gradient-brand (circular)
  box-shadow: 0 8px 24px rgba(0,155,255,0.35)
  icon: AppleLab mark (white, 24px)
  pulse animation when idle (subtle ring expansion)

Chat window:
  width: 380px, height: 560px (max)
  background: #FFFFFF (light) / #1D1D1F (dark)
  border-radius: 20px
  box-shadow: 0 24px 80px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)
  
  Header:
    gradient bar (3px height, brand gradient, top of window)
    avatar: gradient circle (brand gradient), "AppleBot 🍎"
    "AI-powered" badge: 11px, #86868B
  
  Messages:
    User: right-aligned, background: gradient-brand, white text, border-radius: 18px 18px 4px 18px
    Bot: left-aligned, background: #F5F5F7, #1D1D1F text, border-radius: 18px 18px 18px 4px
  
  Input:
    height: 44px, border-radius: 22px, border: 1px solid #D2D2D7
    Send button: brand blue circle, arrow icon
```

### 5.10 Blog Post Card

```
Card:
  background: #FFFFFF
  border-radius: 16px
  overflow: hidden
  
  [Thumbnail — 16:9, object-fit: cover, border-radius top only]
  [Content — padding: 24px]
    [Category badge — 11px uppercase, brand blue, bg: --blue-50, border-radius: 6px, padding: 3px 10px]
    [Title — 21px, 700, #1D1D1F, mt: 12px]
    [Excerpt — 15px, #6E6E73, mt: 8px, 2-line clamp]
    [Meta row — 13px, #86868B] → [avatar 20px] [Author] · [Read time] · [Date]
  
  Hover:
    thumbnail: scale(1.04) 0.4s ease
    title color: brand blue
```

---

## 6. Animation & Motion System

### 6.1 Core Principles (Apple-Matched)

Apple's animations follow these rules:
- **Ease:** `cubic-bezier(0.25, 0.1, 0.25, 1)` — Apple's default ease
- **Ease-out (enter):** `cubic-bezier(0, 0, 0.2, 1)` — natural deceleration
- **Duration:** Micro 120ms, Standard 300ms, Emphasis 500ms
- **Never:** Spring physics on layout, jarring bounces, or long delays

```css
--ease-standard:    cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-decelerate:  cubic-bezier(0, 0, 0.2, 1);
--ease-accelerate:  cubic-bezier(0.4, 0, 1, 1);

--duration-micro:   120ms;
--duration-fast:    200ms;
--duration-standard: 300ms;
--duration-emphasis: 500ms;
--duration-slow:    700ms;
```

### 6.2 Scroll Reveal (Intersection Observer)

Every section's content animates in on scroll. Pattern:

```css
/* Initial state (before visible) */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s var(--ease-decelerate),
              transform 0.7s var(--ease-decelerate);
}

/* Triggered state (on viewport enter) */
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered children */
.reveal-stagger > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s var(--ease-decelerate),
              transform 0.6s var(--ease-decelerate);
}
.reveal-stagger.is-visible > *:nth-child(1) { transition-delay: 0ms; }
.reveal-stagger.is-visible > *:nth-child(2) { transition-delay: 80ms; }
.reveal-stagger.is-visible > *:nth-child(3) { transition-delay: 160ms; }
.reveal-stagger.is-visible > *:nth-child(4) { transition-delay: 240ms; }
.reveal-stagger.is-visible > *:nth-child(5) { transition-delay: 320ms; }
.reveal-stagger.is-visible > *:nth-child(6) { transition-delay: 400ms; }
```

### 6.3 Hero Entrance Animation

```css
/* Hero headline: splits into words, staggered fade-up */
.hero-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(32px);
  animation: heroWord 0.8s var(--ease-decelerate) forwards;
}
.hero-word:nth-child(1) { animation-delay: 0ms; }
.hero-word:nth-child(2) { animation-delay: 60ms; }
.hero-word:nth-child(3) { animation-delay: 120ms; }
/* ... */

@keyframes heroWord {
  to { opacity: 1; transform: translateY(0); }
}

/* Hero device image: fade + subtle scale */
.hero-image {
  opacity: 0;
  transform: scale(0.96);
  animation: heroImage 1.2s var(--ease-decelerate) 0.4s forwards;
}
@keyframes heroImage {
  to { opacity: 1; transform: scale(1); }
}
```

### 6.4 Hover Interactions

```css
/* Device card lift */
.device-card {
  transition: transform 0.3s var(--ease-decelerate),
              box-shadow 0.3s var(--ease-decelerate);
}
.device-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(0,155,255,0.1);
}

/* Nav link underline sweep */
.nav-link::after {
  content: '';
  display: block;
  width: 0;
  height: 1px;
  background: var(--gradient-brand);
  transition: width 0.25s var(--ease-decelerate);
}
.nav-link:hover::after { width: 100%; }

/* Button scale */
.btn-primary:active { transform: scale(0.97); }

/* Icon gradient fill on card hover */
.feature-card:hover .feature-icon {
  filter: drop-shadow(0 4px 12px rgba(0,155,255,0.3));
  transform: scale(1.08);
  transition: all 0.25s var(--ease-standard);
}
```

### 6.5 Chat Widget Pulse

```css
@keyframes chatPulse {
  0%   { box-shadow: 0 0 0 0 rgba(0,155,255,0.5); }
  60%  { box-shadow: 0 0 0 16px rgba(0,155,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,155,255,0); }
}
.chat-trigger { animation: chatPulse 2.5s ease-out infinite; }
```

### 6.6 Number Counter Animation

For the trust bar statistics (e.g. "10,000+ Devices Repaired"):

```javascript
// Triggered when trust bar enters viewport
// Count from 0 to target over 1500ms with easeOut
function animateCounter(el, target, duration) {
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.floor(ease * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString() + '+';
  };
  requestAnimationFrame(update);
}
```

---

## 7. Backgrounds & Visual Atmosphere

### 7.1 Section Background Types

**Type A — Pure White**
```css
background: #FFFFFF;
```

**Type B — Apple Light Gray**
```css
background: #F5F5F7;
```

**Type C — Full Black (Hero/Feature dark sections)**
```css
background: #000000;
/* Optional: very subtle noise texture for depth */
background-image: url("data:image/svg+xml,..."); /* SVG noise */
```

**Type D — Gradient Brand Wash (accent sections)**
```css
background: linear-gradient(180deg, #E6F6FF 0%, #FFFFFF 100%);
/* Used sparingly — e.g., under hero, or quote CTA band */
```

**Type E — Dark Card on Black**
```css
background: #1D1D1F;
border: 1px solid rgba(255,255,255,0.08);
border-radius: 20px;
```

### 7.2 Gradient Brand Line (Section Divider)

Between major sections, a 1px line with the brand gradient:

```css
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #009BFF 30%, #00FFF4 70%, transparent);
  opacity: 0.3;
  margin: 0 auto;
  max-width: 960px;
}
```

### 7.3 Hero Background Depth Effect

For the hero, a subtle radial gradient creates depth under the device image:

```css
.hero-bg-glow {
  position: absolute;
  width: 800px;
  height: 600px;
  background: radial-gradient(ellipse at center,
    rgba(0,155,255,0.06) 0%,
    rgba(0,255,244,0.03) 40%,
    transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
```

---

## 8. Responsive Breakpoints

Matching Apple's exact breakpoints:

| Name | Min Width | Description |
|------|----------|-------------|
| `xs` | `0px` | Mobile portrait |
| `sm` | `480px` | Mobile landscape |
| `md` | `768px` | iPad portrait |
| `lg` | `1024px` | iPad landscape / small desktop |
| `xl` | `1280px` | Desktop |
| `2xl` | `1440px` | Wide desktop |

```css
/* Apple's approach: mobile-first, key breakpoints */
@media (max-width: 767px)  { /* Mobile */ }
@media (min-width: 768px)  { /* Tablet+ */ }
@media (min-width: 1024px) { /* Desktop+ */ }
@media (min-width: 1280px) { /* Wide+ */ }
```

### Key Responsive Behaviors

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hero headline | 40px | 56px | 80px |
| Section headline | 32px | 40px | 56px |
| Device grid | 2 col | 3 col | 4–5 col |
| Feature cards | 1 col | 2 col | 3 col |
| Nav | Hamburger | Hamburger | Full links |
| Button group | Stack vertical | Inline | Inline |
| Testimonials | 1 card | 2 cards | 3 cards |
| Blog cards | 1 col | 2 col | 3 col |

---

## 9. CSS Custom Properties Reference

Complete listing for the project's design token file (`tokens.css`):

```css
:root {
  /* === BRAND === */
  --brand-blue:       #009BFF;
  --brand-cyan:       #00FFF4;
  --gradient-brand:   linear-gradient(90deg, #009BFF 0%, #00FFF4 100%);
  --gradient-diagonal: linear-gradient(135deg, #009BFF 0%, #00FFF4 100%);

  /* === BLUE SCALE === */
  --blue-50:  #E6F6FF;
  --blue-100: #B3E2FF;
  --blue-200: #80CDFF;
  --blue-300: #4DB9FF;
  --blue-400: #1AA6FF;
  --blue-500: #009BFF;
  --blue-600: #007FD4;
  --blue-700: #0063A9;
  --blue-800: #004880;
  --blue-900: #002E57;

  /* === CYAN SCALE === */
  --cyan-50:  #E6FFFD;
  --cyan-100: #B3FFF9;
  --cyan-200: #80FFF5;
  --cyan-300: #4DFFF2;
  --cyan-400: #1AFFEE;
  --cyan-500: #00FFF4;
  --cyan-600: #00D4CA;
  --cyan-700: #00A99F;
  --cyan-800: #007F77;
  --cyan-900: #005450;

  /* === NEUTRALS === */
  --gray-0:   #FFFFFF;
  --gray-50:  #F5F5F7;
  --gray-100: #E8E8ED;
  --gray-200: #D2D2D7;
  --gray-300: #B8B8BF;
  --gray-400: #86868B;
  --gray-500: #6E6E73;
  --gray-600: #515154;
  --gray-700: #3A3A3C;
  --gray-800: #1D1D1F;
  --gray-900: #0A0A0A;
  --black:    #000000;

  /* === SEMANTIC === */
  --bg-primary:    #FFFFFF;
  --bg-secondary:  #F5F5F7;
  --bg-dark:       #000000;
  --bg-dark-card:  #1D1D1F;
  --bg-nav:        rgba(255,255,255,0.82);

  --text-primary:   #1D1D1F;
  --text-secondary: #6E6E73;
  --text-tertiary:  #86868B;
  --text-inverse:   #FFFFFF;
  --text-link:      #009BFF;

  --color-success: #34C759;
  --color-warning: #FF9F0A;
  --color-error:   #FF3B30;

  /* === TYPOGRAPHY === */
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                  "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-text:    -apple-system, BlinkMacSystemFont, "SF Pro Text",
                  "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-brand:   'Geom Graphic', -apple-system, sans-serif;

  --text-hero:        80px;
  --text-headline-xl: 56px;
  --text-headline-lg: 48px;
  --text-headline-md: 40px;
  --text-headline-sm: 32px;
  --text-title-xl:    28px;
  --text-title-lg:    24px;
  --text-title-md:    21px;
  --text-body-xl:     21px;
  --text-body-lg:     19px;
  --text-body:        17px;
  --text-body-sm:     15px;
  --text-caption:     13px;
  --text-label:       12px;

  /* === SPACING === */
  --space-4:   4px;
  --space-8:   8px;
  --space-12:  12px;
  --space-16:  16px;
  --space-24:  24px;
  --space-32:  32px;
  --space-48:  48px;
  --space-64:  64px;
  --space-80:  80px;
  --space-100: 100px;
  --space-120: 120px;

  /* === LAYOUT === */
  --content-max:    1200px;
  --content-wide:   980px;
  --content-narrow: 692px;
  --content-tight:  560px;

  /* === BORDERS === */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  20px;
  --radius-2xl: 28px;
  --radius-pill: 980px;

  /* === SHADOWS === */
  --shadow-sm:    0 1px 4px rgba(0,0,0,0.08);
  --shadow-md:    0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.10);
  --shadow-xl:    0 20px 60px rgba(0,0,0,0.12);
  --shadow-brand: 0 8px 24px rgba(0,155,255,0.25);
  --shadow-card:  0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);

  /* === ANIMATION === */
  --ease-standard:   cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

  --duration-micro:    120ms;
  --duration-fast:     200ms;
  --duration-standard: 300ms;
  --duration-emphasis: 500ms;
  --duration-slow:     700ms;

  /* === NAV === */
  --nav-height:        44px;
  --nav-backdrop:      saturate(180%) blur(20px);
}
```

---

## 10. Homepage Section-by-Section Plan

### Section 1 — Navigation Bar
```
BG: rgba(255,255,255,0.82) | backdrop-filter: saturate(180%) blur(20px)
Height: 44px
Sticky: top 0

LEFT:   [SVG Logo mark 32px] + [Apple Lab — Geom Graphic 18px 600]
CENTER: [Services] [Booking] [Track Repair] [Corporate] [Blog]
RIGHT:  [বাংলা/EN — text toggle 13px] [Book a Repair — btn-primary btn-sm]

Mobile: Logo left | ☰ hamburger right
```

---

### Section 2 — Hero
```
BG: #FFFFFF
Padding: 120px top, 80px bottom
Max-width: 980px centered

Eyebrow (12px, brand blue, uppercase, tracking-wide):
  "Bangladesh's Most Trusted Apple Repair Lab · Since 2010"

Headline (80px desktop / 48px mobile, 700, #1D1D1F, centered):
  "Your Apple Device, Perfectly Repaired."

Subheadline (28px desktop / 21px mobile, 400, #6E6E73, centered, max-w: 640px):
  "MacBook · iPhone · iPad · iMac · Apple Watch
   Genuine parts. 90-day warranty. Free diagnosis."

Button group (centered, mt: 32px):
  [Book a Repair — btn-primary] [Get an Instant Quote — btn-secondary]

Link below buttons (17px, brand blue):
  "Or walk in at Dhanmondi, Dhaka ›"

Device showcase (mt: 64px):
  Floating collage of Apple devices (MacBook + iPhone + iPad)
  Subtle brand glow radial behind them
  Animation: heroImage fade+scale on load

Trust bar (mt: 48px, centered, gray-400):
  [15+ Years] | [10,000+ Devices] | [90-Day Warranty] | [No Fix No Fee]
  Numbers in brand gradient text, labels in #6E6E73
```

---

### Section 3 — Device Grid ("What Needs Fixing?")
```
BG: #F5F5F7
Padding: 100px top/bottom

Eyebrow: "Our Services"
Headline: "Every Apple device, every repair."
Subheadline (17px, #6E6E73): 
  "From cracked screens to logic board repairs — if Apple made it, we fix it."

Grid: 3-col (desktop), 2-col (tablet), 2-col (mobile)
9 device cards (see Component 5.3):
  MacBook Pro | MacBook Air | iPhone | iPad | iMac
  Mac Mini | Mac Studio | Apple Watch | AirPods

Stagger animation: cards reveal left to right, 80ms delay between each
```

---

### Section 4 — Why Choose AppleLab
```
BG: #FFFFFF
Padding: 100px top/bottom

Eyebrow: "Why AppleLab"
Headline: "Repairs you can trust. Every time."

6-card grid (3×2 desktop, 2×3 tablet, 1-col mobile):
  1. Certified Technicians — icon: badge
  2. Genuine Parts Only — icon: sparkles/atom
  3. 90-Day Warranty — icon: shield-check
  4. No Fix, No Fee — icon: receipt-off
  5. Same-Day Service — icon: zap
  6. Nationwide Courier — icon: package

Each card: white BG on gray section? → Use cards on white BG section
  → Change this section to #F5F5F7 if needed
  → Actually keep white, use cards with subtle border: 1px solid rgba(0,0,0,0.06)
```

---

### Section 5 — How It Works (DARK)
```
BG: #000000
Padding: 100px top/bottom

Eyebrow (brand blue): "Simple Process"
Headline (white, 56px): "From broken to like-new in 4 steps."

4 steps (horizontal on desktop, vertical on mobile):
  Step 01: "Book Online or Walk In"
    Book a slot in seconds, or just walk into Dhanmondi.
  Step 02: "Free Diagnosis"
    Our engineers run a full diagnostic — always free.
  Step 03: "Repair with Genuine Parts"
    You approve the quote. We repair with original components.
  Step 04: "Pickup with 90-Day Warranty"
    In-store or courier. Every repair backed by our warranty.

Step number: brand gradient text (large, ~80px, behind-content decorative)
Connector: dashed horizontal line (1px, white 12% opacity) between steps
CTA below: [Book Your Repair — btn-ghost-dark]
```

---

### Section 6 — Most Requested Repairs (Pricing Preview)
```
BG: #F5F5F7
Padding: 80px top/bottom

Eyebrow: "Common Repairs"
Headline: "Know your price before you visit."
Link: "See all pricing — with Instant Quote ›"

Horizontal scrollable row of repair pills (or cards):
  Each pill/card: [Device icon 20px] [Repair name] [From ৳X,XXX]
  14 items: Screen replacement (iPhone/MacBook/iPad/iMac), Battery, Water damage, etc.
  
CTA button: [Get an Instant Quote — btn-primary] centered below
Note: "Prices may vary after free diagnosis"
```

---

### Section 7 — Repair Status Tracker Widget
```
BG: #FFFFFF
Padding: 80px top/bottom

Eyebrow: "Track Your Repair"
Headline: "Know exactly where your device is."
Body (17px, gray-500): 
  "Enter your ticket ID to see real-time status updates."

Widget (centered card, max-w: 600px):
  Background: white, shadow-md, border-radius: 20px, padding: 32px
  [Ticket ID input (APL-XXXXXX-XXXXX)] [Last 4 of phone] [Track →]
  
  Result preview (static demo on homepage):
    Status timeline: ● Received → ● Confirmed → ○ In Progress → ○ Ready
    "Your device is with our engineers"
```

---

### Section 8 — Testimonials (DARK)
```
BG: #000000
Padding: 100px top/bottom

Eyebrow (brand blue): "Customer Stories"
Headline (white, 56px): "Thousands of happy Apple users."
Sub (gray-400): "Real reviews from customers across Bangladesh."

Testimonial carousel: 3 cards visible (desktop), auto-play
Each card: (see Component 5.6)
  [★★★★★] [Quote] [Name] [Device badge]

Dots below (brand blue active)
"See all Google reviews ›" link (brand blue) below carousel
```

---

### Section 9 — Corporate Services CTA
```
BG: #F5F5F7
Padding: 100px top/bottom

Two-column layout:
  LEFT:
    Eyebrow (brand blue): "Corporate"
    Headline (48px): "Apple fleet management for Dhaka businesses."
    Body: "Priority repair, SLA contracts, bulk servicing, and monthly invoicing for teams using Apple devices."
    [Contact Us — btn-primary] [Learn More — btn-secondary]
  RIGHT:
    Graphic: Stylized MacBook fleet illustration or office environment image
    Brand gradient subtle glow behind image
```

---

### Section 10 — Blog Preview
```
BG: #FFFFFF
Padding: 100px top/bottom

Eyebrow: "Tips & Guides"
Headline: "From our repair experts."
Link: "See all articles ›"

3-card grid (3 latest posts):
  Post cards (see Component 5.10)

Note: Section only renders if there are published blog posts
```

---

### Section 11 — Map & Contact
```
BG: #F5F5F7
Padding: 100px top/bottom

Two-column:
  LEFT (contact):
    Headline: "Visit Our Lab"
    [Icon] Address: ADC Empire Plaza, 183 Satmasjid Road, Dhanmondi, Dhaka 1205
    [Icon] Phone: 01603-710044 / 01737-292828
    [Icon] Email: jusef@applelab.com.bd
    [Icon] Hours: Open Daily (Closed on Public Holidays)
    [WhatsApp us — btn-primary (WhatsApp green)] or brand btn
  RIGHT:
    Google Maps embed: border-radius 20px, overflow hidden
    height: 360px
```

---

### Section 12 — Footer
```
BG: #1D1D1F
Color: #F5F5F7

Top row:
  [Logo + Wordmark]     [Language toggle: English | বাংলা]

Main grid (4 col desktop, 2 col mobile):
  Services:             Quick Links:
  MacBook Pro Repair    Book a Repair
  MacBook Air Repair    Track Repair
  iPhone Repair         Get a Quote
  iPad Repair           Corporate Services
  iMac Repair           Sell Your Mac
  Apple Watch Repair    FAQ
  AirPods Repair        Warranty Policy

  Contact:              Follow:
  01603-710044          [Facebook icon]
  01737-292828          [Instagram icon]
  jusef@applelab.com.bd [YouTube icon]
  Dhanmondi, Dhaka      [LinkedIn icon]

Divider: 1px rgba(255,255,255,0.1)

Bottom row (12px, #86868B):
  © 2026 AppleLab Original. All rights reserved.
  [Privacy Policy] [Terms of Service]
  Dhanmondi, Dhaka, Bangladesh.
```

---

## 11. Asset & Icon Strategy

### Icons
Use **Lucide Icons** (React library already supported in the stack):
- All icons: 24px default, strokeWidth 1.5 (matches Apple's icon weight)
- On dark sections: white stroke
- On light sections: #1D1D1F stroke
- Accent icons: fill with brand gradient using SVG `fill="url(#brandGradient)"`

### Device Illustrations
**Option A (Recommended):** Use official Apple product renders (freely available from Apple's press kit) for device imagery — high quality, white-background, consistent lighting.

**Option B:** Source from Mockup sites (e.g. Smartmockups, PixSellz) for contextual shots.

**Hero collage:** Composite of MacBook Air (open), iPhone (front), iPad (angled) — floating arrangement, brand glow underneath.

### Logo Usage
- In nav: SVG logo mark (32px height) + "Apple Lab" wordmark in Geom Graphic
- In footer: Same, but inverted to white
- On dark backgrounds: Logo mark SVG renders naturally (gradient is always visible)
- Favicon: Simplified Apple mark from SVG, 32×32px

---

## 12. Dark / Light Mode Strategy

### Current Scope (v1.0)
The site does **not** implement system-level dark mode switching. This matches apple.com's behavior — it is always light by default. The dark sections are design choices, not theme toggles.

**Dark sections are:** How It Works, Testimonials — these are always dark.  
**Light sections are:** Everything else — always light.

### Future (v2.0 consideration)
If dark mode is requested later:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary:    #000000;
    --bg-secondary:  #1D1D1F;
    --text-primary:  #F5F5F7;
    --text-secondary: #86868B;
    /* ... etc */
  }
}
```

---

## Summary Cheatsheet

| Property | Value |
|----------|-------|
| Primary color | `#009BFF` (Brand Blue) |
| Accent color | `#00FFF4` (Brand Cyan) |
| Brand gradient | `linear-gradient(90deg, #009BFF, #00FFF4)` |
| Primary text | `#1D1D1F` |
| Secondary text | `#6E6E73` |
| Light BG | `#F5F5F7` |
| Dark BG | `#000000` |
| Nav BG | `rgba(255,255,255,0.82)` + blur |
| Button radius | `980px` (pill) |
| Card radius | `20px` |
| Body font | SF Pro (system font stack) |
| Brand font | Geom Graphic SemiBold (logo only) |
| Hero headline | `80px / 700 / -0.015em` |
| Section headline | `56px / 700 / -0.005em` |
| Body text | `17px / 400 / 1.47` |
| Button font | `17px / 400` |
| Button padding | `12px 22px` |
| Scroll reveal | `translateY(24px) → 0`, `0.7s ease-out` |
| Card hover | `translateY(-6px)`, brand shadow |
| Section padding | `100px` desktop, `80px` tablet, `60px` mobile |
```
