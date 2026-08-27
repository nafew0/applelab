# Product Requirements Document
# AppleLab — Apple Device Repair & Services Website
**Version:** 1.0  
**Date:** May 2026  
**Client:** AppleLab Original, Dhanmondi, Dhaka  
**Prepared by:** Development Team  
**Status:** Draft for Review

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Information Architecture & Pages](#4-information-architecture--pages)
5. [Feature Specifications](#5-feature-specifications)
6. [Bilingual Content System](#6-bilingual-content-system)
7. [Django Apps & Models](#7-django-apps--models)
8. [API Endpoints](#8-api-endpoints)
9. [Frontend Structure (Next.js)](#9-frontend-structure-nextjs)
10. [SEO Strategy](#10-seo-strategy)
11. [Meta CAPI & Analytics Data Layer](#11-meta-capi--analytics-data-layer)
12. [AI Chat Support Agent](#12-ai-chat-support-agent)
13. [CMS / Admin Panel](#13-cms--admin-panel)
14. [Security & Compliance](#14-security--compliance)
15. [Third-Party Integrations](#15-third-party-integrations)
16. [Environment Variables](#16-environment-variables)
17. [Deployment & Infrastructure](#17-deployment--infrastructure)
18. [Phased Rollout Plan](#18-phased-rollout-plan)
19. [Open Questions](#19-open-questions)

---

## 1. Project Overview

### 1.1 Background

AppleLab Original has operated from Dhanmondi, Dhaka since 2010 as one of Bangladesh's most trusted Apple device repair centers. Their previous WordPress site is ~15 years old, visually outdated, plagued with spam links, and lacks modern conversion features. A full redesign and rebuild is required.

### 1.2 Business Context

- **Primary location:** ADC Empire Plaza, 183 Satmasjid Road, Dhaka 1205
- **Phone:** 01603-710044 / 01737-292828
- **Email:** jusef@applelab.com.bd
- **Hours:** Open daily (closed on public holidays)
- **Core offering:** Repair, servicing, and trade-in of all Apple devices
- **Target customers:** Individual consumers, students, freelancers, and corporate clients in Dhaka (and nationwide via courier-based repair)

### 1.3 Scope of Work

A full-stack rebuild of the public-facing website with:
- Modern, conversion-optimized design
- Bilingual content (English / বাংলা)
- Online repair booking & intake system
- Repair status tracker
- Instant quote estimator
- AI-powered customer support chat
- CMS-like Django admin for client self-management
- SEO infrastructure (structured data, sitemaps, meta)
- Meta Conversions API + Google Analytics 4 data layer
- Corporate B2B service page
- Device trade-in / sell-your-Mac flow
- Blog / knowledge base

---

## 2. Goals & Success Metrics

### 2.1 Business Goals

| Goal | Metric | Target (6 months post-launch) |
|------|--------|-------------------------------|
| Increase online bookings | Bookings/month via web form | +300% vs current |
| Reduce phone-based inquiries | % of support handled by AI/web | 40% deflection |
| Improve search visibility | Organic search sessions | +150% |
| Capture corporate clients | Corporate inquiry form submissions | 10+/month |
| Build credibility | Google review score (via prompt) | Maintain 4.5+ |

### 2.2 Technical Goals

- Lighthouse Performance score ≥ 90 (mobile)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- SEO: All pages indexed within 2 weeks of launch
- Uptime: 99.9%

---

## 3. Tech Stack & Architecture

### 3.1 Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15 (App Router) | SSR + SSG, SEO-first |
| Styling | Tailwind CSS v4 + shadcn/ui | Component library |
| Backend | Django 5.x + Django REST Framework | Headless API |
| Database | PostgreSQL 16 | Primary store |
| Cache | Redis | Session cache, rate limiting, AI response cache |
| Task Queue | Celery + Redis | Async emails, status notifications, Meta CAPI events |
| Auth | JWT (SimpleJWT) + HttpOnly cookie refresh | Inherited from boilerplate |
| Payments | bKash (primary) + SSLCommerz (fallback) | Booking deposits |
| AI Agent | Anthropic Claude API (claude-sonnet-4-20250514) | Chat support |
| CMS | Django Admin (enhanced with django-unfold) | Client content management |
| Search | PostgreSQL full-text search (pg_trgm) | Blog + service search |
| Email | SMTP (Brevo/SendGrid) + Celery | Booking confirmations, status updates |
| SMS | Twilio or Infobip (Bangladesh) | Repair status SMS alerts |
| Analytics | Google Analytics 4 + GTM | Data layer driven |
| Ads | Meta Conversions API (server-side) | Deduplication with Pixel |
| Hosting | VPS (Ubuntu 24) / Coolify | Reverse proxy: Nginx/Caddy |
| CDN | Cloudflare | Static assets + edge caching |

### 3.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                       │
│              https://applelab.com.bd                     │
└───────────────────┬──────────────────────────────────────┘
                    │
                    │ HTTPS
                    │
┌───────────────────▼──────────────────────────────────────┐
│               NEXT.JS FRONTEND (App Router)               │
│                                                           │
│  Server Components → SSR/SSG pages (SEO)                 │
│  Client Components → Booking wizard, Chat, Quote tool     │
│                                                           │
│  i18n: next-intl (en | bn)                               │
│  Lang files: /messages/en.json  /messages/bn.json        │
└───────────────────┬──────────────────────────────────────┘
                    │
                    │ REST API  (https://api.applelab.com.bd)
                    │
┌───────────────────▼──────────────────────────────────────┐
│                 DJANGO + DRF BACKEND                      │
│                                                           │
│  Apps: core · repairs · blog · quotes · chat · analytics  │
│  + boilerplate: accounts · subscriptions                  │
└──────┬─────────────┬──────────────────┬──────────────────┘
       │             │                  │
┌──────▼──┐   ┌──────▼──┐   ┌──────────▼──────────────┐
│PostgreSQL│   │  Redis  │   │   Celery Workers         │
│         │   │ Cache + │   │ - Email/SMS dispatch     │
│         │   │ Broker  │   │ - Meta CAPI events       │
└─────────┘   └─────────┘   │ - Booking reminders      │
                             │ - Status notifications   │
                             └─────────────────────────┘
```

### 3.3 URL Structure

| Domain | Service |
|--------|---------|
| `applelab.com.bd` | Next.js public site |
| `api.applelab.com.bd` | Django DRF API |
| `admin.applelab.com.bd` | Django Admin (enhanced) |

---

## 4. Information Architecture & Pages

### 4.1 Public Site Map

```
/ (Home)
├── /services
│   ├── /macbook-pro-repair
│   ├── /macbook-air-repair
│   ├── /iphone-repair
│   ├── /ipad-repair
│   ├── /imac-repair
│   ├── /mac-mini-repair          [NEW]
│   ├── /mac-studio-repair        [NEW]
│   ├── /apple-watch-repair       [NEW]
│   ├── /airpods-repair           [NEW]
│   └── /apple-vision-pro-repair  [NEW - future]
├── /booking                      [NEW]
│   ├── /booking/[step]           (multi-step wizard)
│   └── /booking/confirmation/[token]
├── /repair-status                [NEW]
├── /quote                        [NEW - instant estimator]
├── /corporate-services
├── /sell-your-mac
├── /blog
│   ├── /blog/[slug]
│   └── /blog/category/[category]
├── /about
├── /contact
├── /warranty                     [NEW]
├── /faq                          [NEW]
└── /sitemap.xml
    /robots.txt
```

### 4.2 Page-by-Page Content Specification

#### 4.2.1 Home Page (`/`)

**SEO Title:** `Apple Device Repair Dhaka | MacBook, iPhone, iPad — AppleLab`  
**Meta Description:** `Bangladesh's most trusted Apple repair lab since 2010. MacBook, iPhone, iPad, iMac repair in Dhanmondi, Dhaka. Genuine parts. 90-day warranty. Book online.`

**Sections (in order):**

1. **Hero**
   - Headline (EN): `Dhaka's Expert Apple Repair Lab — Since 2010`
   - Subheadline: `MacBook • iPhone • iPad • iMac • Apple Watch — All under one roof, with genuine parts and a 90-day warranty.`
   - CTAs: `[Book a Repair]` (primary) `[Get an Instant Quote]` (secondary)
   - Trust bar: `15+ Years Experience · 10,000+ Devices Repaired · 90-Day Warranty · No Fix No Fee`
   - Background: High-quality workshop/device imagery

2. **Device Grid** — "What Device Needs Fixing?"
   - 9 device cards with icons: MacBook Pro · MacBook Air · iPhone · iPad · iMac · Mac Mini · Mac Studio · Apple Watch · AirPods
   - Each card → links to its service page

3. **Why Choose AppleLab**
   - 6 feature cards:
     - Certified Technicians (since 2010)
     - Genuine Parts Only
     - 90-Day Repair Warranty
     - No Fix, No Fee Diagnostics
     - Fast Turnaround (most repairs same-day)
     - Nationwide Courier Repair Service

4. **How It Works** — 4-step process
   - Step 1: Book Online or Walk In
   - Step 2: Free Diagnosis & Quote
   - Step 3: Repair with Genuine Parts
   - Step 4: Device Returned with Warranty

5. **Most Requested Repairs** — Horizontal scrollable service cards with pricing ranges (e.g. Screen replacement ৳3,500–৳35,000)

6. **Instant Quote CTA Band** — "Know your repair cost before you visit" → `[Get a Quote]`

7. **Repair Status Tracker** (embedded minimal widget) — enter ticket ID → see status

8. **Testimonials** — Carousel of Google reviews (fetched from Google Places API or seeded in CMS)

9. **Corporate Services CTA** — "Manage your business's Apple devices with AppleLab Corporate" → `[Learn More]`

10. **Blog / Tips** — 3 latest blog posts

11. **Map + Contact** — Embedded Google Map, address, phone, hours

12. **Footer** — Logo · Quick Links · Services · Social links · Language toggle · Copyright

---

#### 4.2.2 Service Pages (template, rendered per device)

Each service page shares a layout; content is managed via CMS.

**URL pattern:** `/services/[device-slug]`

**Sections:**
1. Hero — Device name, hero image, headline, "Book Repair" CTA
2. Common Issues — Icon grid of fixable problems (e.g. cracked screen, battery, keyboard, water damage)
3. Repair Pricing Table — Model selector → price list (e.g. MacBook Pro 13" M2 Screen → ৳18,000)
4. Repair Process — Timeline steps
5. Warranty Badge — 90-day parts & labor
6. Before/After gallery (optional, CMS-managed)
7. FAQ accordion — Device-specific FAQs
8. Related Repairs CTA
9. Booking CTA band

**Service Pages & Their Core Repairs:**

| Page | Key Repair Types |
|------|-----------------|
| MacBook Pro Repair | Screen, Battery, Keyboard, Logic Board, Water Damage, Charging Port, SSD Upgrade, Fan |
| MacBook Air Repair | Screen, Battery, Keyboard, Trackpad, Water Damage, Charging Port, RAM (pre-M1) |
| iPhone Repair | Screen (OLED/LCD), Battery, Back Glass, Charging Port, Camera, Speaker, Face ID |
| iPad Repair | Screen/Digitizer, Battery, Charging Port, Speaker, Water Damage, Home Button |
| iMac Repair | Screen, Logic Board, RAM Upgrade, SSD Upgrade, Fan, Power Supply |
| Mac Mini Repair | SSD Upgrade, RAM Upgrade, Thermal Paste, Power Issues |
| Mac Studio Repair | Fan, SSD, Connectivity Issues, Power |
| Apple Watch Repair | Screen, Battery, Crown, Band Connector, Water Damage |
| AirPods Repair | Charging Case, Earbud Replacement, Connectivity Issues |

---

#### 4.2.3 Booking Page (`/booking`)

Multi-step wizard (client-side state, submitted at final step):

**Step 1 — Select Device**
- Device type picker (same icons as home grid)

**Step 2 — Describe Issue**
- Issue category checkboxes (context-aware to selected device)
- Free-text description field
- Optional photo upload (max 3 images, 5MB each)

**Step 3 — Choose Service Type**
- Walk-in (with preferred date/time slot picker)
- Courier (shipping instructions shown)

**Step 4 — Contact Details**
- Name, Phone (required), Email (optional)
- Language preference (EN/BN)
- Promo code field (for 40% online booking discount — existing offer)

**Step 5 — Review & Confirm**
- Summary of booking
- Optional: Pay ৳500 deposit via bKash (holds slot)
- Submit → POST to `/api/repairs/bookings/`

**Confirmation page** — Booking reference number (ticket ID), next steps, WhatsApp link

---

#### 4.2.4 Repair Status Page (`/repair-status`)

- Input: Ticket ID + phone number (last 4 digits)
- Returns: Status timeline (Received → Diagnosed → Repair In Progress → Ready for Pickup / Shipped)
- No login required — anonymous lookup

---

#### 4.2.5 Instant Quote Page (`/quote`)

- Step 1: Select device type
- Step 2: Select model (e.g. MacBook Pro 14" M3 Pro)
- Step 3: Select issue(s)
- Shows: Price range, turnaround estimate, warranty note
- CTA: "Book this repair" → pre-fills booking form

---

#### 4.2.6 Corporate Services (`/corporate-services`)

- Hero: "Apple Fleet Management for Dhaka Businesses"
- Services: Annual maintenance contracts · Bulk repair SLAs · On-site pickup & delivery · Priority turnaround · Monthly invoicing
- Benefits grid
- Client logos (if available)
- Inquiry form: Company name, contact, device count, requirements
- No price table (contact-based pricing)

---

#### 4.2.7 Sell Your Mac (`/sell-your-mac`)

- Headline: "Get the Best Price for Your Mac in Bangladesh"
- How it works: Describe device → Get valuation → Accept offer → Get paid via bKash
- Trade-in form: Device model, year, condition (checkboxes), serial number (optional), contact
- Valuation is manual (triggers admin notification; team responds within 2 hours)
- Trust signals: instant payment, no haggling, data wiped guarantee

---

#### 4.2.8 Blog (`/blog`)

- Category filter: Repair Tips · MacOS Guides · Apple News · How-To
- Card grid: Thumbnail, category tag, title, excerpt, read time, date
- Individual post: Full rich text, author, date, related posts, social share
- Search bar (pg_trgm full-text)

---

#### 4.2.9 About (`/about`)

- Story: Founded 2010 in Dhanmondi
- Mission statement
- Team section (name, role, photo — CMS managed)
- Milestones timeline
- Certifications / badges
- Location & map

---

#### 4.2.10 FAQ (`/faq`)

- Accordion grouped by category: General · Booking · Pricing · Warranty · Shipping
- Content fully CMS-managed
- Schema.org FAQPage structured data

---

#### 4.2.11 Warranty (`/warranty`)

- 90-day parts & labor warranty policy
- What's covered / not covered
- How to claim
- Schema.org structured data

---

## 5. Feature Specifications

### 5.1 Booking System

**Booking lifecycle:**
```
PENDING → CONFIRMED → DIAGNOSED → IN_PROGRESS → READY → COMPLETED
                                                       → CANCELLED
                                                       → NO_FIX
```

**Key behaviors:**
- On submission → send confirmation SMS + email (Celery task)
- Admin can update status → triggers SMS/email to customer
- Ticket ID format: `APL-YYYYMM-XXXXX` (e.g. `APL-202601-00042`)
- Booking slots: Admin configures capacity per time slot via admin panel
- 40% discount promo auto-applied on online booking (soft discount — communicated in confirmation)

### 5.2 Repair Status Tracker

- Public endpoint — no auth required
- Rate-limited: 10 req/min per IP (Redis-based)
- Returns status + timestamp of each stage + technician note (optional)

### 5.3 Instant Quote Engine

- Admin maintains a `RepairPrice` table: `device_type × model × issue → price_min, price_max, turnaround_hours`
- Frontend fetches cascading dropdowns via API
- No prices shown without selecting both model and issue
- "Price may vary after diagnosis" disclaimer always shown

### 5.4 Trade-In Flow

- Form submission → creates `TradeInRequest` record
- Admin notified via email + Django admin dashboard
- Staff manually enters valuation → customer notified via SMS/email
- Customer accepts/declines via link in message

---

## 6. Bilingual Content System

### 6.1 Strategy

Use **`next-intl`** for the Next.js frontend. All static copy lives in JSON lang files. Dynamic CMS content (service descriptions, blog posts, FAQs, team bios) has `en` and `bn` fields in the database.

### 6.2 Locale Routing

```
/en/services/macbook-pro-repair   (English — default)
/bn/services/macbook-pro-repair   (Bengali)
```

Or subdirectory-less with `Accept-Language` detection and cookie persistence.

### 6.3 Lang File Structure

```
/messages/
├── en.json
└── bn.json
```

**Sample `en.json` (abbreviated):**
```json
{
  "nav": {
    "home": "Home",
    "services": "Services",
    "booking": "Book a Repair",
    "repairStatus": "Track Repair",
    "corporate": "Corporate",
    "sellMac": "Sell Your Mac",
    "blog": "Blog",
    "about": "About",
    "contact": "Contact"
  },
  "hero": {
    "headline": "Dhaka's Expert Apple Repair Lab — Since 2010",
    "subheadline": "MacBook • iPhone • iPad • iMac • Apple Watch — All under one roof, with genuine parts and a 90-day warranty.",
    "cta_primary": "Book a Repair",
    "cta_secondary": "Get an Instant Quote"
  },
  "trustBar": {
    "experience": "15+ Years Experience",
    "devicesRepaired": "10,000+ Devices Repaired",
    "warranty": "90-Day Warranty",
    "noFix": "No Fix, No Fee"
  },
  "devices": {
    "macbookPro": "MacBook Pro",
    "macbookAir": "MacBook Air",
    "iphone": "iPhone",
    "ipad": "iPad",
    "imac": "iMac",
    "macMini": "Mac Mini",
    "macStudio": "Mac Studio",
    "appleWatch": "Apple Watch",
    "airpods": "AirPods"
  },
  "whyUs": {
    "title": "Why Choose AppleLab?",
    "certifiedTech": {
      "title": "Certified Technicians",
      "body": "Our engineers have specialized in Apple hardware since 2010 and handle every model with precision."
    },
    "genuineParts": {
      "title": "Genuine Parts Only",
      "body": "We source only original or OEM-certified components to preserve your device's performance and resale value."
    },
    "warranty": {
      "title": "90-Day Repair Warranty",
      "body": "Every repair is backed by a 90-day warranty on parts and labor. If it breaks again, we fix it free."
    },
    "noFix": {
      "title": "No Fix, No Fee",
      "body": "We diagnose your device for free. If we can't fix it, you pay nothing."
    },
    "fastTurnaround": {
      "title": "Fast Turnaround",
      "body": "Most repairs completed same-day or within 48 hours. Nationwide courier repair also available."
    },
    "customerFirst": {
      "title": "Customer First, Always",
      "body": "Serving Dhaka since 2010 with thousands of satisfied customers and 5-star Google reviews."
    }
  },
  "howItWorks": {
    "title": "How It Works",
    "step1": { "title": "Book Online or Walk In", "body": "Choose your device and issue, book a slot online, or visit us at Dhanmondi." },
    "step2": { "title": "Free Diagnosis", "body": "Our technicians run a full diagnostic — always free of charge." },
    "step3": { "title": "Repair with Genuine Parts", "body": "We'll share a quote before touching anything. You approve, we repair." },
    "step4": { "title": "Pick Up with Warranty", "body": "Collect your device in-store or receive it via courier, covered by our 90-day warranty." }
  },
  "booking": {
    "title": "Book a Repair",
    "step1_title": "Select Your Device",
    "step2_title": "Describe the Issue",
    "step3_title": "Choose Service Type",
    "step4_title": "Your Contact Details",
    "step5_title": "Review & Confirm",
    "walkin": "Walk-In",
    "courier": "Courier Service",
    "submitBooking": "Confirm Booking",
    "promoPlaceholder": "Promo code (optional)",
    "confirmation": {
      "title": "Booking Confirmed!",
      "body": "Your repair ticket is {ticketId}. You'll receive an SMS confirmation shortly.",
      "whatsapp": "Message us on WhatsApp"
    }
  },
  "repairStatus": {
    "title": "Track Your Repair",
    "placeholder": "Enter your ticket ID (e.g. APL-202601-00042)",
    "phonePlaceholder": "Last 4 digits of your phone",
    "search": "Track Repair",
    "statuses": {
      "PENDING": "Received",
      "CONFIRMED": "Confirmed",
      "DIAGNOSED": "Diagnosed",
      "IN_PROGRESS": "Repair in Progress",
      "READY": "Ready for Pickup",
      "COMPLETED": "Completed",
      "CANCELLED": "Cancelled",
      "NO_FIX": "Could Not Repair"
    }
  },
  "footer": {
    "tagline": "Trusted Apple repair since 2010.",
    "address": "ADC Empire Plaza, 183 Satmasjid Road, Dhanmondi, Dhaka 1205",
    "rights": "© {year} AppleLab Original. All rights reserved.",
    "langToggle": "বাংলায় দেখুন"
  },
  "chat": {
    "greeting": "Hi! I'm AppleBot 🍎 How can I help with your Apple device today?",
    "placeholder": "Type your question..."
  }
}
```

**`bn.json` mirrors identical keys with Bengali translations.** The language toggle in the navbar/footer switches locale and persists preference in a cookie (`NEXT_LOCALE`).

### 6.4 CMS Content Bilingual Fields

For admin-managed content, each relevant model stores both language versions:

```python
# Example — ServicePage model
title_en = models.CharField(max_length=200)
title_bn = models.CharField(max_length=200)
body_en = models.TextField()   # Rich text (Markdown or Quill)
body_bn = models.TextField()
meta_title_en = models.CharField(max_length=160, blank=True)
meta_title_bn = models.CharField(max_length=160, blank=True)
meta_description_en = models.CharField(max_length=320, blank=True)
meta_description_bn = models.CharField(max_length=320, blank=True)
```

API serializers accept a `?lang=en` or `?lang=bn` query param and return the appropriate fields.

---

## 7. Django Apps & Models

### 7.1 App Map

```
django_project/
├── applelab/          # project settings + root urls
├── accounts/          # ← boilerplate: auth, users, site settings
├── subscriptions/     # ← boilerplate: plans, payments (repurposed for deposits)
├── core/              # site-wide CMS: pages, SEO, settings
├── repairs/           # booking, tickets, status, pricing
├── blog/              # posts, categories, tags
├── chat/              # AI chat sessions and message history
└── analytics/         # Meta CAPI event queue, conversion tracking
```

---

### 7.2 `core` App

Manages CMS content for service pages, team members, testimonials, FAQs, and global site settings.

```python
# core/models.py

class SiteConfig(models.Model):
    """Global singleton site configuration."""
    phone_primary = models.CharField(max_length=20)
    phone_secondary = models.CharField(max_length=20, blank=True)
    email = models.EmailField()
    address_en = models.TextField()
    address_bn = models.TextField()
    whatsapp_number = models.CharField(max_length=20, blank=True)
    google_maps_embed_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    meta_pixel_id = models.CharField(max_length=50, blank=True)
    ga4_measurement_id = models.CharField(max_length=50, blank=True)
    gtm_container_id = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name = "Site Configuration"

class DeviceType(models.Model):
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50)        # Lucide icon name
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

class ServicePage(models.Model):
    device = models.ForeignKey(DeviceType, on_delete=models.CASCADE)
    title_en = models.CharField(max_length=200)
    title_bn = models.CharField(max_length=200)
    hero_headline_en = models.CharField(max_length=300)
    hero_headline_bn = models.CharField(max_length=300)
    body_en = models.TextField()
    body_bn = models.TextField()
    meta_title_en = models.CharField(max_length=160, blank=True)
    meta_title_bn = models.CharField(max_length=160, blank=True)
    meta_description_en = models.CharField(max_length=320, blank=True)
    meta_description_bn = models.CharField(max_length=320, blank=True)
    hero_image = models.ImageField(upload_to='services/hero/')
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

class CommonIssue(models.Model):
    """Issues shown on service page + used in booking form."""
    device = models.ForeignKey(DeviceType, on_delete=models.CASCADE, related_name='issues')
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    display_order = models.PositiveIntegerField(default=0)

class RepairPrice(models.Model):
    device = models.ForeignKey(DeviceType, on_delete=models.CASCADE)
    model_name = models.CharField(max_length=200)   # e.g. "MacBook Pro 14\" M3 Pro"
    issue = models.ForeignKey(CommonIssue, on_delete=models.SET_NULL, null=True)
    price_min = models.DecimalField(max_digits=10, decimal_places=2)
    price_max = models.DecimalField(max_digits=10, decimal_places=2)
    turnaround_hours = models.PositiveIntegerField(default=48)
    notes_en = models.CharField(max_length=300, blank=True)
    notes_bn = models.CharField(max_length=300, blank=True)
    is_active = models.BooleanField(default=True)

class Testimonial(models.Model):
    customer_name = models.CharField(max_length=100)
    rating = models.PositiveSmallIntegerField(default=5)   # 1–5
    body_en = models.TextField()
    body_bn = models.TextField(blank=True)
    device_type = models.ForeignKey(DeviceType, on_delete=models.SET_NULL, null=True, blank=True)
    source = models.CharField(max_length=50, default='google')  # google | facebook | direct
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class FAQItem(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'), ('booking', 'Booking'),
        ('pricing', 'Pricing'), ('warranty', 'Warranty'), ('shipping', 'Shipping'),
    ]
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    question_en = models.CharField(max_length=300)
    question_bn = models.CharField(max_length=300)
    answer_en = models.TextField()
    answer_bn = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    role_en = models.CharField(max_length=100)
    role_bn = models.CharField(max_length=100)
    bio_en = models.TextField(blank=True)
    bio_bn = models.TextField(blank=True)
    photo = models.ImageField(upload_to='team/', blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

---

### 7.3 `repairs` App

```python
# repairs/models.py

import uuid

BOOKING_STATUS = [
    ('PENDING', 'Pending'),
    ('CONFIRMED', 'Confirmed'),
    ('DIAGNOSED', 'Diagnosed'),
    ('IN_PROGRESS', 'Repair In Progress'),
    ('READY', 'Ready for Pickup'),
    ('COMPLETED', 'Completed'),
    ('CANCELLED', 'Cancelled'),
    ('NO_FIX', 'Could Not Repair'),
]

SERVICE_TYPE = [('walkin', 'Walk-In'), ('courier', 'Courier')]

class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    device = models.ForeignKey('core.DeviceType', on_delete=models.SET_NULL, null=True)
    device_model = models.CharField(max_length=200, blank=True)
    issues = models.ManyToManyField('core.CommonIssue', blank=True)
    issue_description = models.TextField(blank=True)
    photos = models.JSONField(default=list)  # list of S3/media URLs
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE, default='walkin')
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time_slot = models.CharField(max_length=20, blank=True)  # e.g. "10:00-11:00"
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)
    promo_code = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=BOOKING_STATUS, default='PENDING')
    assigned_tech = models.CharField(max_length=100, blank=True)
    technician_note = models.TextField(blank=True)  # visible to customer on status page
    internal_note = models.TextField(blank=True)    # admin-only
    deposit_paid = models.BooleanField(default=False)
    deposit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    lang_preference = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            from django.utils import timezone
            prefix = f"APL-{timezone.now().strftime('%Y%m')}"
            count = Booking.objects.filter(ticket_id__startswith=prefix).count()
            self.ticket_id = f"{prefix}-{str(count + 1).zfill(5)}"
        super().save(*args, **kwargs)

class BookingStatusHistory(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20, choices=BOOKING_STATUS)
    note = models.TextField(blank=True)
    changed_by = models.CharField(max_length=100, blank=True)  # staff name or 'system'
    created_at = models.DateTimeField(auto_now_add=True)

class TradeInRequest(models.Model):
    CONDITION_CHOICES = [
        ('excellent', 'Excellent — No visible damage'),
        ('good', 'Good — Minor scratches'),
        ('fair', 'Fair — Visible wear'),
        ('poor', 'Poor — Cracked/damaged'),
    ]
    device = models.ForeignKey('core.DeviceType', on_delete=models.SET_NULL, null=True)
    model_name = models.CharField(max_length=200)
    manufacture_year = models.PositiveSmallIntegerField(null=True, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    serial_number = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)
    offered_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, default='pending')  # pending | quoted | accepted | declined
    created_at = models.DateTimeField(auto_now_add=True)

class CorporateInquiry(models.Model):
    company_name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField()
    device_count = models.PositiveIntegerField(null=True, blank=True)
    requirements = models.TextField()
    status = models.CharField(max_length=20, default='new')   # new | contacted | proposal | closed
    created_at = models.DateTimeField(auto_now_add=True)

class BookingSlot(models.Model):
    """Admin configures available walk-in slots per day."""
    date = models.DateField()
    time_slot = models.CharField(max_length=20)  # "10:00-11:00"
    capacity = models.PositiveSmallIntegerField(default=3)

    class Meta:
        unique_together = ('date', 'time_slot')
```

---

### 7.4 `blog` App

```python
class Category(models.Model):
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

class Post(models.Model):
    title_en = models.CharField(max_length=300)
    title_bn = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    excerpt_en = models.TextField(max_length=500)
    excerpt_bn = models.TextField(max_length=500)
    body_en = models.TextField()   # Markdown
    body_bn = models.TextField()
    thumbnail = models.ImageField(upload_to='blog/thumbnails/')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    tags = models.CharField(max_length=300, blank=True)
    meta_title_en = models.CharField(max_length=160, blank=True)
    meta_description_en = models.CharField(max_length=320, blank=True)
    meta_title_bn = models.CharField(max_length=160, blank=True)
    meta_description_bn = models.CharField(max_length=320, blank=True)
    author_name = models.CharField(max_length=100, default='AppleLab Team')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    read_time_minutes = models.PositiveSmallIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

### 7.5 `chat` App

```python
class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_key = models.CharField(max_length=64, unique=True)  # anonymous session
    booking = models.ForeignKey('repairs.Booking', null=True, blank=True, on_delete=models.SET_NULL)
    lang = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

---

### 7.6 `analytics` App

```python
class MetaCAPIEvent(models.Model):
    """Queue for server-side Meta Conversions API events."""
    STATUS_CHOICES = [('pending', 'Pending'), ('sent', 'Sent'), ('failed', 'Failed')]
    event_name = models.CharField(max_length=100)   # Lead, Contact, InitiateCheckout, etc.
    event_time = models.BigIntegerField()            # Unix timestamp
    event_source_url = models.URLField(blank=True)
    user_data = models.JSONField(default=dict)       # hashed: em, ph, client_ip, etc.
    custom_data = models.JSONField(default=dict)
    event_id = models.UUIDField(default=uuid.uuid4) # deduplication with Pixel
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 8. API Endpoints

### 8.1 Core / CMS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/` | Site config (phone, address, social links) |
| GET | `/api/devices/` | All active device types |
| GET | `/api/services/{device_slug}/` | Service page content (`?lang=en\|bn`) |
| GET | `/api/services/{device_slug}/issues/` | Common issues for device |
| GET | `/api/prices/?device={slug}&model={name}&issue={id}` | Repair price lookup |
| GET | `/api/testimonials/` | Featured testimonials |
| GET | `/api/faq/?category={cat}&lang={lang}` | FAQ items |
| GET | `/api/team/` | Active team members |

### 8.2 Repairs / Booking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repairs/slots/?date={date}` | Available walk-in slots |
| POST | `/api/repairs/bookings/` | Create booking |
| GET | `/api/repairs/status/?ticket={id}&phone_last4={xxxx}` | Public status lookup |
| PATCH | `/api/repairs/bookings/{id}/status/` | Update status (staff only) |
| GET | `/api/repairs/bookings/` | List all bookings (staff) |
| POST | `/api/repairs/trade-in/` | Submit trade-in request |
| POST | `/api/repairs/corporate-inquiry/` | Submit corporate inquiry |

### 8.3 Blog

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog/posts/?lang={lang}&category={slug}&q={query}` | Post list |
| GET | `/api/blog/posts/{slug}/` | Single post |
| GET | `/api/blog/categories/` | All categories |

### 8.4 Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/session/` | Create or retrieve chat session |
| POST | `/api/chat/message/` | Send message → streamed AI response |

### 8.5 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/event/` | Log a Meta CAPI event from server |

---

## 9. Frontend Structure (Next.js)

```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx               # Root layout with i18n, GTM, Meta Pixel
│   │   │   ├── page.tsx                 # Home
│   │   │   ├── services/
│   │   │   │   └── [device]/page.tsx    # Dynamic service pages (SSG)
│   │   │   ├── booking/
│   │   │   │   ├── page.tsx             # Booking wizard (Client Component)
│   │   │   │   └── confirmation/[token]/page.tsx
│   │   │   ├── repair-status/page.tsx
│   │   │   ├── quote/page.tsx
│   │   │   ├── corporate-services/page.tsx
│   │   │   ├── sell-your-mac/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [slug]/page.tsx
│   │   │   │   └── category/[category]/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   └── warranty/page.tsx
│   │   ├── sitemap.ts                   # Dynamic Next.js sitemap
│   │   └── robots.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── LanguageToggle.tsx
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── DeviceGrid.tsx
│   │   │   ├── WhyUsSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── PricingHighlights.tsx
│   │   │   ├── StatusTrackerWidget.tsx
│   │   │   ├── TestimonialsCarousel.tsx
│   │   │   ├── CorporateCTA.tsx
│   │   │   ├── BlogPreview.tsx
│   │   │   └── MapContact.tsx
│   │   ├── booking/
│   │   │   ├── BookingWizard.tsx
│   │   │   ├── StepDevice.tsx
│   │   │   ├── StepIssues.tsx
│   │   │   ├── StepServiceType.tsx
│   │   │   ├── StepContact.tsx
│   │   │   ├── StepReview.tsx
│   │   │   └── BookingConfirmation.tsx
│   │   ├── chat/
│   │   │   ├── ChatWidget.tsx           # Floating chat bubble
│   │   │   ├── ChatWindow.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── quote/
│   │   │   └── QuoteEstimator.tsx
│   │   ├── services/
│   │   │   ├── ServiceHero.tsx
│   │   │   ├── IssuesGrid.tsx
│   │   │   ├── PricingTable.tsx
│   │   │   └── ServiceFAQ.tsx
│   │   ├── blog/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostGrid.tsx
│   │   │   └── BlogSearch.tsx
│   │   └── ui/                          # shadcn/ui + custom components
│   │
│   ├── lib/
│   │   ├── api.ts                       # Axios/fetch API client
│   │   ├── datalayer.ts                 # GTM data layer helpers
│   │   ├── metaPixel.ts                 # Client-side Meta Pixel events
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useBooking.ts
│   │   ├── useRepairStatus.ts
│   │   └── useQuote.ts
│   │
│   └── messages/
│       ├── en.json
│       └── bn.json
```

### 9.1 Rendering Strategy

| Page | Strategy | Reason |
|------|----------|--------|
| Home | ISR (60s revalidate) | Dynamic content (testimonials, blog preview) |
| Service pages | SSG + ISR | SEO-critical, CMS updates needed |
| Blog posts | SSG + ISR | SEO-critical |
| Booking | Client-side | Interactive multi-step form |
| Repair Status | SSR | Real-time, no caching |
| Quote Estimator | Client-side | Dynamic dropdowns |
| FAQ / Warranty / About | SSG | Rarely changes |

---

## 10. SEO Strategy

### 10.1 Technical SEO

- **Next.js `<Metadata>` API** — per-page `title`, `description`, `canonical`, `openGraph`, `twitter`
- **Dynamic sitemap** at `/sitemap.xml` — includes all service pages, blog posts, static pages
- **Robots.txt** — allow all, disallow `/api/`, `/admin/`
- **Structured data** (JSON-LD injected in page `<head>`):
  - `LocalBusiness` on Home, Contact, About
  - `Service` on each service page
  - `FAQPage` on FAQ and service pages
  - `Article` on blog posts
  - `BreadcrumbList` on all inner pages
- **Hreflang tags** for `en` and `bn` on all pages
- **Image optimization** — Next.js `<Image>` with WebP, explicit `width`/`height`, `alt` text from CMS
- **Core Web Vitals** — lazy-load below-fold sections, font preloading, critical CSS inline

### 10.2 Local SEO

- Google Business Profile optimized listing (client manages separately)
- `LocalBusiness` schema with: name, address, phone, geo coordinates, opening hours, priceRange
- NAP consistency across all pages (from `SiteConfig` in CMS)
- Location-specific page titles ("MacBook Repair Dhanmondi Dhaka")

### 10.3 Content SEO

- Blog targeting long-tail keywords: "MacBook battery replacement cost Bangladesh", "iPhone screen repair Dhaka"
- Each service page targets: `[Device] repair Dhaka`, `[Device] repair Dhanmondi`, `[Device] repair Bangladesh`
- Bengali-language content for bn locale — ranks in Bengali search queries

---

## 11. Meta CAPI & Analytics Data Layer

### 11.1 Architecture Overview

```
Browser
  ├── Meta Pixel (client-side, GTM)    → Meta
  └── GTM Data Layer push              → GTM → GA4 + other tags

Server (Celery)
  └── MetaCAPIEvent → Celery task     → Meta CAPI (server-side)
                     (hashed PII)      (deduplication via event_id)
```

### 11.2 Events to Track

| Event | Trigger | Where |
|-------|---------|-------|
| `PageView` | Every page load | Pixel (GTM) |
| `ViewContent` | Service page viewed | Pixel + CAPI |
| `Lead` | Booking form submitted | Pixel + CAPI |
| `Contact` | Contact form submitted | Pixel + CAPI |
| `InitiateCheckout` | Deposit payment started | Pixel + CAPI |
| `Purchase` | Deposit payment confirmed | Pixel + CAPI |
| `Search` | Quote estimator used | Pixel |
| `CustomEvent: ChatOpened` | Chat widget opened | Pixel |
| `CustomEvent: QuoteViewed` | Quote result shown | Pixel |

### 11.3 GTM Data Layer (`lib/datalayer.ts`)

```typescript
export const pushEvent = (eventName: string, data: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...data });
  }
};

// Usage in BookingWizard:
pushEvent('booking_submitted', {
  device_type: booking.device,
  service_type: booking.serviceType,
  has_deposit: booking.depositPaid,
});
```

### 11.4 Meta CAPI — Server-Side (Celery Task)

```python
# analytics/tasks.py
@shared_task
def send_meta_capi_event(event_id: str):
    event = MetaCAPIEvent.objects.get(event_id=event_id)
    payload = {
        "data": [{
            "event_name": event.event_name,
            "event_time": event.event_time,
            "event_id": str(event.event_id),
            "event_source_url": event.event_source_url,
            "action_source": "website",
            "user_data": event.user_data,   # pre-hashed (SHA256) PII
            "custom_data": event.custom_data,
        }]
    }
    # POST to graph.facebook.com/v19.0/{pixel_id}/events
    # Store response back to event record
```

**PII Hashing:** Phone and email are SHA256-hashed before storing in `user_data`. Never store raw PII in `MetaCAPIEvent`.

---

## 12. AI Chat Support Agent

### 12.1 Overview

A floating chat widget powered by the Anthropic Claude API. It serves as a first-line support agent that can:
- Answer questions about repair services and pricing
- Help customers identify which repair they need
- Assist with booking guidance and repair status queries
- Hand off to human support (WhatsApp link) when needed

### 12.2 System Prompt

```
You are AppleBot, the friendly customer support assistant for AppleLab Original — 
Bangladesh's most trusted Apple device repair center since 2010, located in 
Dhanmondi, Dhaka.

You help customers with:
- Identifying what repair they need based on their symptoms
- Explaining repair pricing and turnaround times
- Guiding them through the online booking process
- Checking repair status (ask for their ticket ID)
- Answering warranty and policy questions
- Providing contact information

Key facts:
- Address: ADC Empire Plaza, 183 Satmasjid Road, Dhanmondi, Dhaka 1205
- Phone: 01603-710044 / 01737-292828
- All repairs carry a 90-day parts & labor warranty
- Free diagnostic — No Fix, No Fee policy
- Most repairs completed same day or within 48 hours
- Courier repair service available nationwide

When you cannot answer something confidently, always offer to connect the customer 
with a human technician via WhatsApp (+880 1603-710044) or suggest they call directly.

Respond in the same language the customer writes in. If they write in Bengali (বাংলা), 
respond in Bengali. Keep responses concise and helpful. Never make up prices — 
direct them to the quote tool at applelab.com.bd/quote for exact pricing.
```

### 12.3 Implementation

- **Endpoint:** `POST /api/chat/message/` → streams response via Server-Sent Events
- **Frontend:** React streaming hook reads SSE chunks and appends to message
- **Context:** Last 20 messages from session passed to API (sliding window)
- **Rate limiting:** 20 messages/session/hour (Redis)
- **Session:** Anonymous UUID stored in `localStorage`, linked to `ChatSession` model
- **Human handoff:** If confidence is low or user asks for human, bot surfaces WhatsApp CTA

---

## 13. CMS / Admin Panel

### 13.1 Django Admin Enhancement

Use **`django-unfold`** for a modern, sidebar-driven admin UI that the client can navigate confidently.

```python
# applelab/settings.py
INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "django.contrib.admin",
    ...
]
```

### 13.2 Client-Editable Content

The client can manage the following without touching code:

| Section | What they can edit |
|---------|-------------------|
| Service Pages | Hero headline, body copy (EN + BN), hero image |
| Repair Pricing | Device model → issue → price range, turnaround |
| Common Issues | Add/remove repair types per device |
| FAQs | Add/edit/reorder questions and answers (EN + BN) |
| Testimonials | Add/remove/feature customer reviews |
| Team | Add/edit team member name, role, photo |
| Blog | Create/publish posts with rich text (EN + BN) |
| Bookings | View/update status, add technician notes, assign staff |
| Trade-In Requests | View, enter valuation, update status |
| Corporate Inquiries | View, mark as contacted, add internal notes |
| Site Config | Phone number, address, WhatsApp, social links |
| Booking Slots | Configure daily walk-in capacity |

### 13.3 Admin Dashboard (Custom)

A read-only stats panel at `/admin/` shows:
- Bookings today / this week / this month
- Bookings by status (chart)
- Most booked device type
- Trade-in requests awaiting valuation
- New corporate inquiries

---

## 14. Security & Compliance

### 14.1 Security Layers (inherited from boilerplate)

- JWT Authentication (1h access, 7d refresh via HttpOnly cookie)
- Token blacklist on logout
- CORS restricted to `applelab.com.bd`
- Rate limiting on all public-facing endpoints
- Content Security Policy middleware
- HTTPS enforced in production + HSTS
- SQL injection protection via ORM
- XSS prevention via React's default escaping

### 14.2 Additional Measures

- All file uploads (booking photos) scanned via ClamAV or validated by MIME type
- User-uploaded filenames sanitized before S3 storage
- Admin panel only accessible from specific IPs (configurable)
- Booking deposit payments via bKash — no card data touches our servers
- PII in CAPI events hashed (SHA-256) before transmission

### 14.3 PDPO / Privacy Compliance (Bangladesh)

- Privacy Policy page linked in footer
- Cookie consent banner (opt-in for analytics cookies)
- Data collected only for stated purposes (repair management, communication)
- No sensitive data in URL parameters

---

## 15. Third-Party Integrations

| Service | Purpose | Notes |
|---------|---------|-------|
| Anthropic Claude API | AI chat agent | claude-sonnet-4-20250514 |
| bKash Tokenized Checkout | Booking deposits | Existing bKash integration in boilerplate |
| SSLCommerz | Payment fallback | Alternative for card payments |
| Google Maps Embed | Location display | Embed URL stored in SiteConfig |
| Google Places API | Pull live reviews (optional) | Or seed manually via admin |
| Meta Graph API (CAPI) | Server-side conversions | Pixel ID from SiteConfig |
| Google Tag Manager | Client-side analytics orchestration | Container ID from SiteConfig |
| Brevo / SendGrid | Transactional email | Booking confirmations, status updates |
| Infobip / Twilio | SMS notifications | Repair status updates |
| Cloudflare | CDN + DDoS protection | DNS-level |
| AWS S3 / Cloudflare R2 | Media storage | Booking photos, blog images |
| django-unfold | Admin UI enhancement | pip installable |
| next-intl | i18n for Next.js | EN/BN locale routing |

---

## 16. Environment Variables

### 16.1 Backend (`backend/.env`)

```env
# Django
DJANGO_SECRET_KEY=
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=api.applelab.com.bd
APP_ORIGIN=https://applelab.com.bd

# Database
DB_NAME=applelab_db
DB_USER=applelab
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
CELERY_BROKER_URL=redis://localhost:6379/0

# Email (Brevo/SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@applelab.com.bd

# SMS
SMS_PROVIDER=infobip       # infobip | twilio
SMS_API_KEY=
SMS_SENDER_ID=AppleLab

# bKash
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta

# SSLCommerz
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASS=
SSLCOMMERZ_IS_SANDBOX=False

# Anthropic (AI Chat)
ANTHROPIC_API_KEY=

# Meta CAPI
META_PIXEL_ID=
META_ACCESS_TOKEN=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=applelab-media
AWS_S3_REGION_NAME=ap-southeast-1

# Admin IP whitelist (comma-separated)
ADMIN_ALLOWED_IPS=
```

### 16.2 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://api.applelab.com.bd
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_SITE_URL=https://applelab.com.bd
NEXT_PUBLIC_WHATSAPP_NUMBER=8801603710044
```

---

## 17. Deployment & Infrastructure

### 17.1 Server Layout

```
VPS (Ubuntu 24.04)
├── Nginx / Caddy (reverse proxy + SSL)
├── Gunicorn (Django WSGI, 4 workers)
├── Next.js (Node.js, PM2 or Docker)
├── Celery worker (2 processes)
├── Celery beat (scheduled tasks)
├── PostgreSQL 16
└── Redis 7
```

### 17.2 Celery Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| `flush_meta_capi_events` | Every 5 min | Send pending CAPI events |
| `send_booking_reminders` | Daily 9am | Remind customers of upcoming walk-in |
| `mark_stale_bookings` | Daily midnight | Auto-cancel unconfirmed bookings after 48h |
| `generate_booking_report` | Weekly | Email admin summary |

### 17.3 CI/CD

- GitHub Actions → on `main` push: run tests → build Next.js → deploy to VPS via SSH
- Django: `collectstatic` + `migrate` on deploy
- Rollback: previous Docker image tag / git revert

---

## 18. Phased Rollout Plan

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Project setup: Django, Next.js, PostgreSQL, Redis, Celery scaffolded from boilerplate
- [ ] `core` app: SiteConfig, DeviceType, ServicePage, CommonIssue, RepairPrice models + admin
- [ ] `repairs` app: Booking, StatusHistory, BookingSlot models + admin
- [ ] API: Config, devices, service pages, issues, prices, booking create, status lookup
- [ ] Next.js: Home page (all sections), Service pages (SSG), Booking wizard, Repair Status page
- [ ] Bilingual setup: `next-intl`, `en.json`, `bn.json`, language toggle
- [ ] SEO: Metadata API, JSON-LD schemas, sitemap, robots.txt

### Phase 2 — Engagement Features (Weeks 5–7)
- [ ] Quote estimator page + API
- [ ] AI chat widget (Anthropic streaming)
- [ ] Blog app: models, admin, list + detail pages, search
- [ ] Trade-in flow
- [ ] Corporate inquiry page
- [ ] Email + SMS notifications (Celery)
- [ ] Google Analytics 4 via GTM data layer

### Phase 3 — Conversion & Analytics (Weeks 8–9)
- [ ] Meta CAPI integration (server-side, Celery queue)
- [ ] Booking deposit via bKash
- [ ] Admin dashboard stats panel
- [ ] Cookie consent banner
- [ ] Performance audit + Core Web Vitals fixes
- [ ] QA on both locales (EN + BN)

### Phase 4 — Launch & Handoff (Week 10)
- [ ] DNS cutover (Cloudflare)
- [ ] Google Search Console submission
- [ ] Client admin training session
- [ ] Monitoring setup (Sentry for errors, UptimeRobot)
- [ ] Post-launch SEO monitoring

---

## 19. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Does the client have professional photography of the lab/workshop? | Client | Week 1 |
| 2 | Confirm bKash merchant account details | Client | Week 1 |
| 3 | Should Bengali translations be provided by the client or handled by dev? | Client | Week 1 |
| 4 | Is a customer login/account feature needed (to view booking history)? | Client | Week 2 |
| 5 | Confirm Meta Pixel ID and CAPI access token | Client | Week 2 |
| 6 | Does the client want a WhatsApp Business integration (auto-replies)? | Client | Week 2 |
| 7 | Should repair pricing be publicly visible or quote-only? | Client | Week 1 |
| 8 | Is there an existing Google Business Profile to pull reviews from? | Client | Week 2 |
| 9 | Confirm SMS provider preference for Bangladesh (Infobip recommended) | Dev | Week 1 |
| 10 | Is SSLCommerz needed or is bKash sufficient for deposits? | Client | Week 1 |

---

*Document maintained in version control. All changes tracked via git commits.*  
*Next review: Before Phase 2 kickoff.*
