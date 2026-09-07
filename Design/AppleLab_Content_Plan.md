# Apple Lab — Website Content & Feature Plan
**Version:** 1.0 | **Date:** August 2026
**Companion to:** `AppleLab_Design_Plan.md` (design system) — this document covers *what goes on the pages*: sitemap, copy, features, imagery, and SEO.
**Language:** English first. Bangla (বাংলা) translation is Phase 2 — see §12.

---

## Table of Contents

1. [Positioning & Voice](#1-positioning--voice)
2. [Research Summary — What the Best Repair Sites Do](#2-research-summary)
3. [Sitemap & Navigation (Apple-Style Nav + Mega Menu)](#3-sitemap--navigation)
4. [Homepage — Full Content Draft](#4-homepage--full-content-draft)
5. [Device Repair Pages (Template + Worked Example)](#5-device-repair-pages)
6. [Repair-Type Pages (Template + Worked Example)](#6-repair-type-pages)
7. [Core Pages — Pricing, Booking, Tracking, Business, About, Contact](#7-core-pages)
8. [FAQ — The Full 22-Question Canon (with Draft Answers)](#8-faq)
9. [Feature Specifications](#9-feature-specifications)
10. [Image, Video & Asset Inventory](#10-image-video--asset-inventory)
11. [SEO & Content Marketing Plan](#11-seo--content-marketing-plan)
12. [Bangla (বাংলা) Phase 2 Notes](#12-bangla-phase-2-notes)
13. [CMS Mapping (Django Backend)](#13-cms-mapping)
14. [Production Checklist & Priorities](#14-production-checklist--priorities)

---

## 1. Positioning & Voice

### 1.1 The One-Line Positioning

> **Apple Lab is the Apple Store experience Bangladesh never got — for repair.**

Apple has no official store or service center in Bangladesh (only authorized resellers). Most devices here are grey-imports with no claimable local warranty. Every competitor site is cluttered, price-opaque, and low-trust. Apple Lab wins by looking, sounding, and behaving like Apple itself: calm, precise, transparent, premium.

### 1.2 Differentiators (validated by research — see §2)

| # | Differentiator | Why it wins in Dhaka |
|---|---------------|---------------------|
| 1 | **apple.com-grade design** | No local competitor comes close. Design alone signals "these people are serious." |
| 2 | **Published, all-inclusive pricing** | Every Dhaka competitor hides prices. Transparency is a weapon. |
| 3 | **Online booking with real time slots** | Locals only offer "call us" / bare WhatsApp links. |
| 4 | **Live repair tracking (ticket ID)** | Absent in the entire local market. |
| 5 | **Data privacy pledge** | The #1 unspoken fear (data theft, part-swapping) — nobody local addresses it. |
| 6 | **No fix, no fee + free diagnosis** | Removes all downside risk for the customer. |
| 7 | **90-day written warranty** | Locals offer vague verbal promises. A written, precise warranty page stands out. |
| 8 | **Nationwide courier repair** | Sundarban / SA Paribahan / Pathao / RedX — packaged as a real product, not a footnote. |
| 9 | **Honest independent positioning** | "We fix what warranty won't cover" beats faking Apple affiliation. |

> **💡 Recommendation (post-launch consideration):** Global premium shops differentiate with *longer* warranties (iCorrect: 2 years; iSmash: lifetime on screens). Consider tiering later — e.g., *180 days on screens & batteries, 90 days on board-level* — once parts supply is proven. All copy below uses **90-day** as the baseline; it's a single token to swap.

### 1.3 Voice & Tone Rules (Apple-Style Copywriting)

- **Short sentences. Full stops in headlines.** "Every Apple device. Every repair."
- **Concrete numbers over adjectives.** "Most screens replaced in under 2 hours" — never "super fast service!!"
- **No exclamation marks. No emoji in body copy.** (Emoji allowed only in chatbot/WhatsApp messages.)
- **Sentence case everywhere** except eyebrow labels (UPPERCASE, 12px).
- **Risk-reversal in every section**: free diagnosis, no fix no fee, fixed quote, warranty.
- **Honesty as a style.** Say "genuine-grade parts, sourced and tested by us" — never claim Apple authorization. Say "liquid damage recovery is never guaranteed" — credibility compounds.
- **Device names exactly as Apple writes them:** MacBook Pro, iPhone 15 Pro Max, iPad Air, Apple Watch Ultra, AirPods Pro. Never "Iphone", "Macbook", "I-pad".
- **Prices in Bangladeshi Taka with the ৳ symbol**, thousands separated: ৳4,500.
- **Footer legal line (required on every page):** *"Apple Lab is an independent repair service provider and is not affiliated with or authorized by Apple Inc. Apple, MacBook, iPhone, iPad, Apple Watch and AirPods are trademarks of Apple Inc."*

---

## 2. Research Summary

*(Condensed from research across uBreakiFix, iSmash, Rossmann Repair Group, iCorrect, Mobile Klinik, Mac Infinity SG, CelMetro Dubai, IT-Tech Australia + a Dhaka market scan of iCare Apple, AG Care, Apple Center, Star Tech, Qfix.)*

**What every world-class repair site does (table stakes):**
1. Device-first navigation (iPhone / Mac / iPad / Watch), cross-linked with repair-type pages (screen, battery, board).
2. A numbers trust-bar directly under the hero (rating · reviews · devices repaired · years).
3. A 3–4 step illustrated "How it works."
4. Warranty length stated in the hero region, in writing.
5. Free diagnosis, with "no fix, no fee" for specialists.
6. Walk-in / pickup / mail-in presented as three equal service channels.
7. FAQ covering: data safety, turnaround, warranty, parts quality, pricing, appointment necessity.

**What the premium tier does that chains don't:**
- **Publishes prices** (Rossmann: full tiers; CelMetro: all-inclusive tables; Mac Infinity: from-prices). Price transparency = the challenger's weapon.
- **"We fix what Apple won't"** specialist framing — logic boards, liquid damage, soldered-SSD data recovery.
- **A comparison table** (CelMetro's "Apple Store vs us" — price, speed, data retention, warranty) — the single most persuasive layout found.
- **Data privacy as a headline section**, not a footnote (Mac Infinity's "no access without consent").
- **Workbench imagery**: macro logic-board shots, micro-soldering hands, named technicians — never generic stock lifestyle photos.
- **Symptom-based content library** as the SEO engine ("MacBook won't turn on" → quote funnel).

**Dhaka market gaps (all confirmed absent locally):** published pricing, slot-based booking, repair tracking, quote calculators, data-privacy messaging, premium photography, bilingual polish. Local customer fears (from reviews): overcharging, fake parts passed off as original, part-swapping while the device is out of sight, repairs failing within weeks.

**Bangladesh-specific facts to build on:**
- WhatsApp is the #1 communication app in Bangladesh (~44M users); the local habit is "discover on Facebook, transact on WhatsApp."
- bKash and Nagad logos are trust marks; EMI via bank cards is standard for big-ticket electronics (relevant for logic-board/display jobs).
- Nationwide courier is viable: Pathao (same-day Dhaka), RedX (24h Dhaka / 72h nationwide), Sundarban Courier + SA Paribahan (every district).
- Grey-market devices have no claimable Apple warranty locally — so "does repair void my warranty?" has a liberating, honest answer here.

---

## 3. Sitemap & Navigation

### 3.1 Full Sitemap

```
/                           Home
/repairs                    Repairs hub (all devices + all repair types)
  /repairs/macbook-pro      Device pages ×8
  /repairs/macbook-air
  /repairs/iphone
  /repairs/ipad
  /repairs/imac
  /repairs/mac-mini-studio
  /repairs/apple-watch
  /repairs/airpods
  /repairs/screen           Repair-type pages ×8
  /repairs/battery
  /repairs/logic-board
  /repairs/liquid-damage
  /repairs/data-recovery
  /repairs/keyboard-trackpad
  /repairs/charging-port
  /repairs/upgrades         (SSD/RAM upgrades, battery health service)
/pricing                    Published price list (per device, per repair)
/book                       Book a Repair (5-step flow)
/track                      Track Your Repair (ticket ID + phone)
/why-apple-lab              Trust page (warranty, parts, data pledge, team)
/business                   Corporate / For Business
/mail-in                    Repair From Anywhere in Bangladesh (courier)
/about                      About Apple Lab (story, lab, team)
/contact                    Contact & Visit (map, hours, WhatsApp)
/faq                        FAQ (full 22-question canon)
/blog                       Tips & Guides
  /blog/[slug]              Articles
/warranty                   Warranty Policy (the written 90-day terms)
/privacy                    Privacy Policy
/terms                      Terms of Service
```

Phase 2 (SEO layer): per-model pages (`/repairs/iphone/iphone-13-pro`) and area pages (`/dhaka/gulshan`) — see §11.

### 3.2 Top Navigation Bar (Apple-Identical)

Mirrors apple.com's 44px translucent bar. Item set (left → right):

```
[ Logo mark + wordmark ]  Mac   iPhone   iPad   Watch & AirPods   Pricing   Business   Support   [🔍 optional]  [Track ⌖]  [Book a Repair — pill btn]  [বাংলা]
```

- Nav labels: 12–14px, `#1D1D1F` @ 88% opacity, 28px gap — exactly per the design plan §5.2.
- On scroll past hero: bar stays translucent white (`rgba(255,255,255,0.82)` + blur). On dark sections it may flip to dark variant.
- Mobile: logo + hamburger; full-screen slide-down drawer listing the same groups.

### 3.3 Expanded Hover Mega-Menu (Apple-Identical Flyout)

Like apple.com: hovering a nav item expands a full-width white panel (blur backdrop dims the page below). Large primary links left, small utility links right. Contents per item:

**Mac** (hover)
| Repair Mac *(large links)* | Popular Mac repairs *(small)* | Quick actions *(small)* |
|---|---|---|
| MacBook Pro | Screen replacement | Get an instant quote |
| MacBook Air | Battery replacement | Book a repair |
| iMac | Keyboard & trackpad | Mac repair pricing |
| Mac mini | Logic board repair | Track your repair |
| Mac Studio | Liquid damage | |
| | SSD & RAM upgrades | |

**iPhone** (hover)
| Repair iPhone *(large)* | Popular iPhone repairs | Quick actions |
|---|---|---|
| iPhone 15 & 16 series | Screen replacement | Get an instant quote |
| iPhone 13 & 14 series | Battery replacement | Book a repair |
| iPhone 11 & 12 series | Charging port | iPhone repair pricing |
| Older iPhones | Camera & Face ID | Check part grades |
| | Liquid damage | |

**iPad** (hover)
| Repair iPad *(large)* | Popular iPad repairs | Quick actions |
|---|---|---|
| iPad Pro | Screen & glass | Get an instant quote |
| iPad Air | Battery replacement | Book a repair |
| iPad / iPad mini | Charging port | iPad repair pricing |

**Watch & AirPods** (hover)
| Repair *(large)* | Popular repairs | Quick actions |
|---|---|---|
| Apple Watch | Watch screen replacement | Get an instant quote |
| AirPods & AirPods Pro | Watch battery | Book a repair |
| | AirPods battery & sound | |

**Pricing** (hover)
| See pricing *(large)* | | Quick actions |
|---|---|---|
| iPhone pricing | | Get an instant quote |
| MacBook pricing | | How our pricing works |
| iPad pricing | | No fix, no fee policy |
| All repair pricing | | |

**Business** (hover)
| For business *(large)* | | |
|---|---|---|
| Corporate device care | AMC & SLA contracts | Talk to our team |
| Bulk repairs & servicing | Monthly invoicing | Request a callback |

**Support** (hover)
| Get help *(large)* | Policies | Contact |
|---|---|---|
| Track your repair | Warranty policy | Visit the lab (map) |
| FAQ | Privacy policy | WhatsApp us |
| Mail-in from anywhere | Terms of service | 01603-710044 |
| Tips & guides (blog) | | |

### 3.4 Footer (per Design Plan §10.12 — content locked)

Columns: **Services** (8 device repair links) · **Quick Links** (Book, Track, Pricing, Business, Mail-in, FAQ, Warranty) · **Contact** (phones, email, address) · **Follow** (Facebook, Instagram, YouTube, LinkedIn). Bottom row: © line + Privacy + Terms + the independent-provider legal disclaimer (§1.3).

---

## 4. Homepage — Full Content Draft

The design plan (§10) locks the visual structure. Below is the **final copy** per section, plus three recommended section additions from research (marked ➕). Final section order:

> Nav → **1** Hero → **2** Device Grid → **3** Why Apple Lab → **4** How It Works (dark) → **5** Common Repairs / Pricing → ➕**6** We Fix What Others Won't (dark) → **7** Track Widget → ➕**8** Data Privacy Band → **9** Testimonials (dark) → ➕**10** Payments Strip → **11** Business CTA → **12** Blog Preview → **13** Map & Contact → Footer

### Section 1 — Hero

- **Eyebrow:** `BANGLADESH'S MOST TRUSTED APPLE REPAIR LAB · SINCE 2010`
- **H1:** `Your Apple device. Perfectly repaired.`
- **Sub:** `MacBook · iPhone · iPad · iMac · Apple Watch — genuine-grade parts, free diagnosis, and a 90-day written warranty on every repair.`
- **CTAs:** `[Book a Repair]` `[Get an Instant Quote]`
- **Tertiary link:** `Or walk in at Dhanmondi, Dhaka ›`
- **Hero media:** the MacBook "disassembly → reassembly" video (brief in §10.4). Fallback until produced: floating device collage with brand glow (design plan §10.2).
- **Trust bar:** `15+ Years` · `10,000+ Devices Repaired` · `90-Day Warranty` · `No Fix, No Fee`

### Section 2 — Device Grid ("Our Services")

- **Eyebrow:** `OUR SERVICES`
- **H2:** `Every Apple device. Every repair.`
- **Sub:** `From cracked screens to logic-board surgery — if Apple made it, we fix it. Walk in, or courier from anywhere in Bangladesh.`
- **9 cards** (each: icon · name · from-price · turnaround · "View services ›"):

| Card | From-price line | Turnaround line |
|---|---|---|
| MacBook Pro | From ৳3,500 | Most repairs same day |
| MacBook Air | From ৳3,000 | Most repairs same day |
| iPhone | From ৳2,000 | Screens in under 2 hours |
| iPad | From ৳2,500 | 1–2 days |
| iMac | From ৳4,000 | 1–3 days |
| Mac mini / Studio | From ৳3,500 | 1–3 days |
| Apple Watch | From ৳2,500 | 1–2 days |
| AirPods | From ৳1,500 | 1–2 days |
| Accessories & upgrades | From ৳1,000 | Same day |

*(From-prices are placeholders — fill from the real rate card before launch. The per-device price + turnaround card pattern is the strongest converter found in research.)*

### Section 3 — Why Apple Lab (6 cards)

- **Eyebrow:** `WHY APPLE LAB`
- **H2:** `Repairs you can trust. Every time.`
- Cards (title + body):
  1. **Certified technicians** — Engineers trained to Apple service standards, with the board-level tools the rest of Dhaka doesn't have.
  2. **Genuine-grade parts** — Original and OEM-grade components, sourced and bench-tested by us. You choose the grade; we show you the difference.
  3. **90-day written warranty** — Same fault comes back? We fix it free. In writing, not a verbal promise. `Read the policy ›`
  4. **No fix, no fee** — Diagnosis is always free. If we can't fix it, you pay nothing — not even a service charge.
  5. **Same-day service** — Most screen, battery and charging repairs are done in hours, not days.
  6. **Nationwide courier** — Outside Dhaka? Send your device with Pathao, RedX or Sundarban — we repair, test and return it insured. `How mail-in works ›`

### Section 4 — How It Works (dark)

- **Eyebrow (brand blue):** `SIMPLE PROCESS`
- **H2 (white):** `From broken to like-new in 4 steps.`
- **Sub:** `Engineered to be predictable. No surprises, no hidden costs, no wasted time.`
- Steps:
  1. **Book online or walk in** — Reserve a slot in seconds, or walk into our Dhanmondi lab. No appointment needed.
  2. **Free diagnosis** — Our engineers run a full diagnostic on every device. Always free, always thorough.
  3. **Approve your fixed quote** — You see the exact price and part grade before we touch a screwdriver. The quote is what you pay.
  4. **Pick up with a 90-day warranty** — Collect in-store or by courier. Every repair is bench-tested and backed in writing.
- **CTA:** `[Book Your Repair]` (ghost-dark)

### Section 5 — Common Repairs (Pricing Preview)

- **Eyebrow:** `COMMON REPAIRS`
- **H2:** `Know your price before you visit.`
- **Sub:** `Starting prices for our most-booked repairs. Your final quote is fixed after free diagnosis — no surprises.`
- Scrollable pill row (14 items — placeholders to be filled from rate card): iPhone screen `From ৳4,500` · iPhone battery `From ৳3,000` · MacBook screen `From ৳12,000` · MacBook battery `From ৳6,500` · MacBook keyboard `From ৳5,500` · iPad glass `From ৳4,000` · Liquid damage `Free assessment` · Logic board `From ৳6,000` · Data recovery `From ৳4,000` · Charging port `From ৳2,500` · Apple Watch screen `From ৳5,000` · AirPods battery `From ৳2,500` · SSD upgrade `From ৳5,500` · iMac display `From ৳15,000`
- **CTA:** `[Get an Instant Quote]` + footnote: `All prices include parts, labour and testing.`

### ➕ Section 6 — We Fix What Others Won't (dark, NEW)

*The specialist band — the defining premium-tier pattern (iCorrect, Rossmann, IT-Tech). Slots between pricing and tracking.*

- **Eyebrow (brand blue):** `BOARD-LEVEL EXPERTISE`
- **H2 (white):** `We fix what others won't.`
- **Sub:** `When another shop says "dead motherboard — buy a new one," bring it to us. Component-level repair is what the Lab was built for.`
- 3 columns:
  1. **Logic board repair** — Microscope-level diagnosis and micro-soldering. We replace the failed component, not the whole board.
  2. **Liquid damage recovery** — Ultrasonic cleaning and corrosion treatment. The sooner it reaches us, the better the odds — and we'll give you an honest assessment, not false hope.
  3. **Data recovery** — Files trapped on a dead Mac or iPhone? We recover data from devices other shops have given up on. No recovery, no charge.
- **Visual:** macro photo of micro-soldering under microscope (shot list §10.2).
- **CTA link:** `Talk to an engineer on WhatsApp ›`

### Section 7 — Track Your Repair (widget)

- **Eyebrow:** `TRACK YOUR REPAIR`
- **H2:** `Know exactly where your device is.`
- **Sub:** `Enter your ticket ID for real-time status — no phone calls, no waiting on hold.`
- Widget: `[Ticket ID — APL-XXXXXX]` `[Last 4 digits of phone]` `[Track →]`
- Demo state shows the 7-stage timeline (§9.3).

### ➕ Section 8 — Data Privacy Band (NEW)

*Directly answers Dhaka's biggest unspoken fear. Light gray band, two columns (copy left, lock/shield visual right).*

- **Eyebrow:** `YOUR PRIVACY`
- **H2:** `Your data stays yours.`
- **Body:** `Most repairs don't require your passcode — and we'll tell you when one does, and why. Your data is never opened, copied or backed up without written consent. Devices are stored in sealed, tagged trays, and every bench is under CCTV. For business clients, we'll sign an NDA.`
- **Link:** `Read our data promise ›` (→ /why-apple-lab#privacy)

### Section 9 — Testimonials (dark)

- **Eyebrow (brand blue):** `CUSTOMER STORIES`
- **H2 (white):** `Thousands of happy Apple users.`
- **Sub:** `Real reviews from customers across Bangladesh.`
- Carousel of cards: ★★★★★ · quote · name · device badge. **Source real Google reviews** (with permission); write none. Link: `See all Google reviews ›`

### ➕ Section 10 — Payments Strip (NEW, slim band)

- **H3:** `Pay your way.`
- **Body:** `Cash, card, bKash or Nagad — pay when your device is ready, not before. EMI available on repairs over ৳10,000.`
- Logos row: bKash · Nagad · Visa · Mastercard · Amex

### Section 11 — For Business CTA

- **Eyebrow:** `FOR BUSINESS`
- **H2:** `Apple fleet care for Bangladeshi companies.`
- **Body:** `Priority repair, SLA contracts, bulk servicing and monthly invoicing for teams that run on Apple — from three MacBooks to three hundred.`
- **CTAs:** `[Talk to Our Team]` `[Learn More]`

### Section 12 — Blog Preview

- **Eyebrow:** `TIPS & GUIDES`
- **H2:** `From our repair experts.`
- 3 latest post cards. Link: `See all articles ›` *(Section renders only when posts exist.)*

### Section 13 — Map & Contact

- **H2:** `Visit our lab.`
- Address: `ADC Empire Plaza, 183 Satmasjid Road, Dhanmondi, Dhaka 1205`
- Phone: `01603-710044 · 01737-292828` · Email: `jusef@applelab.com.bd`
- Hours: `Open daily, 10:00 AM – 8:00 PM (closed on public holidays)` *(confirm actual hours)*
- **CTA:** `[WhatsApp Us]` (WhatsApp green) + Google Maps embed.

---

## 5. Device Repair Pages

### 5.1 Template (applies to all 8 device pages)

1. **Hero** — Eyebrow: `[DEVICE] REPAIR · DHAKA`; H1 names device + promise; sub states warranty + diagnosis; CTAs `[Book a Repair]` `[Get a Quote]`; device render right.
2. **Trust mini-bar** — turnaround · warranty · no fix no fee.
3. **Repairs & pricing table** — every repair for this device: name, symptom line, from-price, turnaround. *This table is the SEO + conversion core of the page.*
4. **Model coverage strip** — "We service every generation" + model list (chips). Phase 2: chips link to model pages.
5. **Part grades explainer** (3-tier: Genuine pull / OEM-grade / Premium aftermarket — what we recommend and why).
6. **How it works** (condensed 4-step, reused component).
7. **Device-specific FAQ** (4–6 questions, FAQPage schema).
8. **Cross-links** — related repair-type pages + other devices.
9. **Final CTA band** — `Broken [device]? Fixed by tonight.` `[Book a Repair]` `[WhatsApp Us]` (prefilled per §9.4).

### 5.2 Worked Example — /repairs/macbook-pro

- **H1:** `MacBook Pro repair in Dhaka. Done right.`
- **Sub:** `Screens, batteries, keyboards, liquid damage and logic boards — repaired by engineers who work on Apple silicon every day. Free diagnosis, 90-day written warranty.`
- **Repairs table rows:** Screen replacement (`Cracked glass, lines, backlight, no image · From ৳12,000 · Same day`) · Battery replacement (`Draining fast, swollen, "Service Battery" · From ৳6,500 · 2 hours`) · Keyboard & trackpad (`Sticky keys, no click, ghost typing · From ৳5,500 · Same day`) · Charging & USB-C port (`Not charging, loose port · From ৳3,500 · Same day`) · Speakers & mic (`Crackling, no sound · From ৳3,000 · Same day`) · Liquid damage treatment (`Spill, no power · Free assessment · 1–3 days`) · Logic board repair (`No power, no boot, GPU faults · From ৳6,000 · 1–3 days`) · SSD & RAM upgrade (`Slow, out of space · From ৳5,500 · Same day`) · Data recovery (`Dead Mac, files needed · From ৳4,000 · 1–3 days`)
- **Models strip:** `MacBook Pro 13″ · 14″ · 15″ · 16″ — Intel, M1, M2, M3 and M4 generations.`
- **FAQ picks:** Can you fix Retina screen delamination? · My MacBook won't turn on — what will diagnosis cost? (Free.) · Genuine vs OEM display — what's the difference? · Can you recover files from a dead MacBook? · Do you replace individual keys?

*Write the remaining 7 device pages from the same template — reuse structure, change repairs table, models strip, and FAQ.*

---

## 6. Repair-Type Pages

### 6.1 Template

1. **Hero** — symptom-first H1 (matches what people search/feel), reassurance sub, CTAs.
2. **Symptom checklist** — "Sound familiar?" bulleted symptoms (SEO gold + self-qualification).
3. **What we do** — the process, in plain language, with real workbench photos.
4. **Pricing by device** — from-price per device family.
5. **Honesty box** — limits, odds, what we can't promise (esp. liquid/data).
6. **Urgency guidance** where relevant ("do this right now" first-aid steps).
7. **FAQ** (3–5) + cross-links + CTA band.

### 6.2 Worked Example — /repairs/liquid-damage

- **H1:** `Spilled something? Don't panic. Move fast.`
- **Sub:** `Liquid damage is a race against corrosion. Bring your device to the Lab within 24–48 hours and the odds are on your side.`
- **First-aid box (also a standalone blog post):**
  1. Power off immediately — don't check "if it still works."
  2. Don't charge it. Charging a wet board is how devices die.
  3. Don't put it in rice. It doesn't work, and rice dust makes cleaning harder.
  4. Unplug everything, tilt ports downward.
  5. Get it to us — walk in, or send it same-day with Pathao.
- **What we do:** `Full disassembly → ultrasonic bath of affected boards → corrosion treatment under microscope → component-level repair of damaged circuits → 24-hour bench test.`
- **Honesty box:** `We'll never promise a liquid-damage recovery. Fresh water within 48 hours: usually good odds. Salt water, sugary drinks, or a week in a drawer: much lower. What we do promise — a free honest assessment, and no fee if we can't fix it.`
- **Pricing:** `Assessment: free · Treatment from ৳3,500 · Board-level repair quoted after diagnosis.`

*Write the other 7 repair-type pages from the same template: screen, battery, logic-board, data-recovery, keyboard-trackpad, charging-port, upgrades.*

---

## 7. Core Pages

### 7.1 /pricing — Published Price List

- **H1:** `Honest pricing. In writing.`
- **Sub:** `Every price includes parts, labour and testing. Your quote is fixed after free diagnosis — the quote is what you pay.`
- **Layout:** device tabs (iPhone / MacBook / iPad / Watch / AirPods / iMac & Desktop) → table per tab: Repair · Part grade options (Genuine / OEM-grade) with two prices · Turnaround · Warranty.
- **"How our pricing works" section:** 1) Diagnosis is always free. 2) You approve a fixed quote before any repair. 3) Prices shown are per part grade — you choose. 4) No advance payment; special-order parts may need a deposit, agreed up front. 5) If we can't fix it, you pay nothing.
- **"Why we're not the cheapest" box:** `Nimtali market stalls will beat our price with copy parts and no warranty. We publish our prices, name our part grades, test every repair and back it for 90 days. That's what you're paying for.`
- CTA: `[Get an exact quote for your model]`

### 7.2 /book — Book a Repair

Flow spec in §9.1. Page copy:
- **H1:** `Book your repair.` **Sub:** `Two minutes now saves you a queue later. Walk-ins are always welcome too.`
- Step titles: `1. Your device → 2. Your model → 3. What's wrong? → 4. How & when → 5. Your details`
- Success screen: `You're booked. Ticket APL-XXXXXX. We've sent the details to your phone — see you at the Lab.` + add-to-calendar + WhatsApp confirmation opt-in.

### 7.3 /track — Track Your Repair

- **H1:** `Where's my device?` **Sub:** `Live status, straight from the workbench.`
- Inputs: ticket ID + last 4 digits of phone (two-factor lookup). Apple-style step indicator with timestamps (stages in §9.3). Below result: `Questions about this repair? [WhatsApp us about APL-XXXXXX]` (prefilled).

### 7.4 /why-apple-lab — Trust Page

Sections: **The 90-day warranty** (full terms summary + link to /warranty) → **No fix, no fee** → **Parts, explained** (the 3-grade system, how we source and bench-test, why we refuse the cheapest tier) → **Your data, protected** (the pledge from §4.8, expanded; NDA offer) → **Watch your repair** (glass-walled lab / CCTV benches / photo updates of *your* device on WhatsApp mid-repair) → **The team** (named engineers, credentials, years — TeamMember model) → **The comparison table**:

| | Typical Dhaka shop | Apple Lab |
|---|---|---|
| Diagnosis | Often charged | Always free |
| Price | Told at the counter, changes later | Published online, fixed quote |
| Parts | "Original" (unverified) | Grade named in writing, you choose |
| Warranty | Verbal, if any | 90 days, written |
| Your data | No policy | Written pledge, CCTV benches, NDA available |
| Status updates | You call them | Live tracking + WhatsApp updates |
| If unfixable | Service charge anyway | No fee. Ever. |

### 7.5 /business — For Business

- **H1:** `Your team runs on Apple. So should your repair partner.`
- **Sub:** `Priority turnaround, SLA contracts, on-site pickup and monthly invoicing — for startups, agencies, banks and schools across Bangladesh.`
- Sections: offer cards (Priority SLA · Fleet servicing & health checks · Buyback & upgrades · Loaner devices during repair) → "How it works for teams" (3 steps: assessment call → device audit → ongoing SLA) → client logos (when available) → NDA & data compliance note → lead form (name, company, team size, phone, message) + `[Book a callback]`.

### 7.6 /mail-in — Repair From Anywhere in Bangladesh

- **H1:** `Not in Dhaka? Not a problem.`
- **Sub:** `Send your device from any district — we repair, test and return it, insured and tracked.`
- **4 steps:** 1) Get a quote on WhatsApp — send model + issue + photos. 2) Pack it right — power off, remove SIM & case, wrap in 2 inches of padding; we'll send a packing guide. 3) Ship with Pathao, RedX, Sundarban or SA Paribahan to the Lab (address + "APL ticket number" on the box). 4) Approve the quote after free diagnosis — we repair and return-courier the same way, insured. Pay bKash/Nagad/card on delivery confirmation.
- FAQ: insurance, courier cost policy, turnaround (+2–3 days shipping), tracking both legs.

### 7.7 /about — About Apple Lab

- **H1:** `The lab Bangladesh's Apple users needed.`
- Story arc (to be written with the founder's real history): started 2010 → why "Lab" (diagnosis-first, equipment-first culture) → the Dhanmondi facility (photos) → the team (grid) → values (honesty, precision, no shortcuts) → community (right-to-repair spirit, e-waste: every reused board is one less import).
- **Founder block** — research shows a named expert with credentials outperforms anonymous "certified technicians." Photo + name + years + specialty.

### 7.8 /contact — Contact & Visit

- **H1:** `Talk to a human.`
- Channels as equal cards: **Walk in** (address, hours, landmark directions "opposite X, Satmasjid Road", parking note) · **Call** (both numbers, tap-to-call) · **WhatsApp** (primary CTA) · **Email**. Google Maps embed + "Get directions" deep link. Short message form (name, phone, message → Lead model).

### 7.9 /warranty — Warranty Policy

Plain-language written terms: 90 days parts & labour from pickup date · same-fault-returns-free · what's covered (the repaired fault + fitted part) · what's not (new accidental damage, liquid after repair, other faults, software) · how to claim (ticket ID + walk-in or courier) · no-fix-no-fee statement · special cases (liquid-damage repairs carry 30-day warranty due to corrosion risk — *industry-honest and worth stating*).

### 7.10 Misc pages

- **404:** `This page needs a repair.` / `We couldn't find that one. But if it's your device that's broken — that we can fix.` `[Go home]` `[Book a repair]`
- **Booking thank-you / quote thank-you:** confirmation + what happens next + WhatsApp link.

---

## 8. FAQ

*Full page at /faq, grouped; individual questions reused on device/type pages. All get FAQPage schema. Draft answers below are final-ready copy.*

### Data & privacy
1. **Will you access my personal data during repair?** No. Most repairs never require signing in. When a repair does need your passcode (for example, testing Face ID after a screen replacement), we'll tell you exactly why, and you can choose to enter it yourself at pickup instead. Your data is never opened, copied or backed up without written consent.
2. **Should I back up before handing over my device?** Yes, always — before any repair, anywhere. If you can't (device won't turn on), tell us; protecting your data becomes part of the repair plan.
3. **Do I need to disable Find My iPhone?** For most iPhone and iPad repairs, yes — Apple's Activation Lock prevents testing. We'll walk you through turning it off at drop-off; it takes one minute. If the device is dead, we'll handle it with you at pickup.
4. **Can you recover data from a dead or water-damaged device?** Often, yes — including from devices other shops have written off. Recovery is never guaranteed, so we work no-recovery-no-charge.

### Parts & quality
5. **Do you use genuine Apple parts?** We use genuine and OEM-grade parts — and unlike most shops, we tell you which is which. Apple doesn't sell parts to independent shops in Bangladesh, so anyone claiming "100% original, sealed from Apple" deserves your skepticism. Every part we fit is bench-tested before and after installation.
6. **What's the difference between genuine, OEM-grade and aftermarket parts?** *Genuine* parts come from original devices (pulls) or Apple's supply chain. *OEM-grade* parts are made by the same or equivalent manufacturers to original spec. *Aftermarket* is everything else — we fit premium aftermarket only where it's the sensible choice (and say so), and refuse the cheap tier entirely.
7. **Will Face ID and True Tone still work after a screen replacement?** Face ID — yes; we transfer the original sensors correctly. True Tone — yes; we re-program the display data to the new panel. If a repair would limit any feature, we tell you before you approve the quote.
8. **Why does my iPhone show an "Unknown Part" message?** After a third-party part is fitted, iOS may show a notice for a few days, then it moves quietly into Settings. It's a pairing notice, not a malfunction — your phone works normally. We'll show you exactly what to expect before the repair.

### Warranty
9. **Does third-party repair void my Apple warranty?** Here's the honest answer: most Apple devices in Bangladesh are imported unofficially and carry no claimable local Apple warranty anyway. If your device *does* have active AppleCare or official warranty, tell us — we'll advise whether an official route makes more sense before touching it.
10. **What warranty do you give on repairs?** 90 days on parts and labour, in writing, from the day you collect your device. If the same fault returns, we fix it free. Liquid-damage repairs carry a 30-day warranty because corrosion can progress internally.
11. **What does the repair warranty not cover?** New accidental damage, new liquid exposure, unrelated faults, and software issues that arise after the repair. The full policy is one page, in plain language: [Warranty Policy].

### Process & logistics
12. **How long will my repair take?** iPhone screens and batteries: usually under 2 hours. MacBook screens, batteries, keyboards: same day. Logic board and liquid damage: 1–3 days. If a part must be ordered, we tell you the timeline before you approve.
13. **Do I need an appointment?** No — walk-ins are welcome six days a week. Booking online just means we're ready when you arrive and you skip the queue.
14. **Do you offer home pickup or repair from outside Dhaka?** Yes. Inside Dhaka we arrange same-day pickup by rider. From anywhere else in Bangladesh, courier your device via Pathao, RedX, Sundarban or SA Paribahan — see [Repair From Anywhere].
15. **How do I track my repair?** Your ticket ID (APL-XXXXXX) works on our [Track] page, and we push every status change to you on WhatsApp or SMS — including the moment your quote is ready and the moment your device is.
16. **What if you can't fix it?** Then you pay nothing. No diagnosis fee, no service charge, no "opening fee." We'll also tell you honestly whether a replacement makes more sense than a repair.
17. **What should I bring — or remove — before drop-off?** Bring the device and, ideally, a backup already made. Remove your SIM and case. Keep your charger unless we ask for it (sometimes the charger *is* the fault).

### Damage-specific
18. **My device just got wet — what do I do right now?** Power it off. Do not charge it. Do not put it in rice. Get it to us within 24–48 hours — fresh-water spills treated fast have good odds. [Read the 60-minute first-aid guide].
19. **Should I repair or replace?** We'll tell you straight. If a repair costs more than the device is worth, our quote will say so — and we'll help you weigh a refurb instead. An honest "don't repair this" is part of the service.
20. **Can you fix logic board and chip-level problems?** Yes — that's the Lab's specialty. Microscope diagnosis, micro-soldering, component-level replacement. When another shop says "dead motherboard, buy a new one," bring it here for a free second opinion.

### Payment
21. **How can I pay?** Cash, Visa/Mastercard/Amex, bKash or Nagad — when your device is ready, not before. EMI is available on repairs over ৳10,000 with supported bank cards.
22. **Do you take advance payment?** No advance for diagnosis or standard repairs. Special-order parts may need a deposit — always agreed with you first, always adjusted in the final bill.

---

## 9. Feature Specifications

### 9.1 Booking Flow (/book) — 5 Steps

| Step | UI | Fields / choices | Notes |
|---|---|---|---|
| 1. Device | Large tappable cards | iPhone / MacBook / iPad / Watch / AirPods / iMac & Desktop | Minimal cognitive load; mirrors iSmash |
| 2. Model | Searchable picker w/ images | ~70 Apple models, hand-curated | Include models never sold officially in BD (grey-market reality) |
| 3. Issue | Symptom cards | Screen · Battery · Charging · Camera · Liquid · Won't turn on · Sound · **Not sure / something else** | Escape hatch mandatory → free diagnosis path |
| 4. Quote + mode + slot | Inline from-price (or "free diagnosis" for unknowns); then Walk-in / Time slot / Home pickup (Dhaka) / Mail-in | Real-time slots, same-day emphasized ("Today" tab first) | Show quote inline — captures intent even if they abandon |
| 5. Details | Name · Phone (required) · Email (optional) · Notes (optional) · WhatsApp-updates checkbox (default on) | Phone-first; never require email | Creates Lead + ticket ID |

**Confirmations:** instant SMS + WhatsApp (+email if given) with ticket ID, slot, address/map link. Reminder 2 hours before slot. For pickups: "rider on the way" message. **A human confirmation call for same-day bookings** — signals seriousness in the Dhaka market.

### 9.2 Instant Quote

Same steps 1–3 as booking, ending at a price screen instead of a slot: exact price for known model+issue combos (per part grade, from the same price table as /pricing — one source of truth), "free diagnosis" fallback otherwise. Actions: `[Book this repair]` `[Send quote to my WhatsApp]` (lead capture) `[Ask a question]`.

### 9.3 Repair Status Tracking

**Pipeline (7 stages + 2 special):**
1. `Received` — "Your device has checked into the Lab."
2. `Diagnosing` — "Our engineers are running a full diagnostic."
3. `Quote ready — awaiting your approval` — **the money moment**: notification carries the quote + approve link/button.
4. `In repair` — "Approved. Your device is on the bench."
5. `Testing & QC` — "Repair complete. Now passing our bench tests."
6. `Ready for pickup` — "Done. Collect anytime in opening hours." (+ courier handover variant)
7. `Delivered / Closed` — triggers review-request message next day.
- Special: `Waiting for parts` (with ETA — parts are imported, be honest) · `Declined — ready for return`.

Ticket format `APL-XXXXXX`; lookup = ticket + last-4-of-phone. Every stage change fires a WhatsApp/SMS notification. Backend: maps to the existing `PipelineStage`/`StageTransition` models.

### 9.4 WhatsApp Integration

**Phase 1 (launch, free):**
- Floating button, bottom-right, official WhatsApp green, all pages (per design plan the AI chat trigger also lives bottom-right — see §9.5 for coexistence).
- `wa.me/8801XXXXXXXXX?text=<prefill>` with **context-aware prefills**:
  - Model page: `Hi Apple Lab — I'd like a quote for [MacBook Pro 14″ M3] [screen replacement].`
  - Track page: `Hi — question about my repair, ticket APL-______.`
  - Mail-in page: `Hi — I want to send a device from [district]. Model: … Issue: …`
- Inline WhatsApp CTAs beside every price and on the contact page. (Research: click-to-chat converts several times better than mobile forms.)
- Secondary channel: Facebook Messenger link in footer (BD's #2 app) — but WhatsApp is primary.

**Phase 2 (WhatsApp Business API):** template messages for booking confirmation, reminder, **quote-approval with quick-reply buttons (Approve / Ask a question)**, status updates, ready-for-pickup, review request with direct Google-review link. Webhook writes approvals back to the ticket.

**Rule:** the channel must be staffed — target reply time under 10 minutes in business hours, stated on the button tooltip: *"Replies in minutes, 10 AM–8 PM."*

### 9.5 AI Chatbot ("AppleBot")

Widget per design plan §5.9. **Coexistence with WhatsApp button:** one launcher, two options on open — "Chat with AppleBot" / "WhatsApp a human" — never two stacked floating buttons.

**Scope (the 5 jobs, tightly bounded):**
1. **Symptom triage** — "screen black but it vibrates" → likely display → `[Book free diagnosis]`. Never a definitive diagnosis, never a promised outcome.
2. **Price questions** — answers from the same price table as /pricing; gives from-prices, pushes exact quotes to the quote flow.
3. **Hours / location / directions** — from SiteConfig.
4. **Tracking** — asks ticket ID + phone-last-4, returns live status.
5. **Booking handoff** — collects device/model/issue then deep-links into /book with fields pre-filled.

**Guardrails:** conservative thresholds on anything involving money, complaints, or liquid damage → escalate. **Escape hatch always visible: "Continue on WhatsApp"** — passes the transcript so the customer never repeats themselves. Languages: English + Bangla + Banglish (a genuine differentiator; phase the Bangla in with §12).

**Personality:** competent, warm, brief. Sample: *"Ouch — a swollen battery is urgent. Stop charging it now. Battery replacement for iPhone 12 is ৳3,500, done in about 90 minutes. Want me to book you in today?"*

### 9.6 Reviews & Social Proof

Live Google reviews embed (or synced snapshots) on home + /why-apple-lab; review request automated at ticket close via WhatsApp with a direct review link; before/after gallery (board repairs) on specialist pages; running counter ("10,000+ devices") sourced from a single config value so it's updated in one place.

### 9.7 Other Features

- **Language toggle** EN / বাংলা in nav + footer (routes via existing `[locale]` i18n).
- **Payments:** logos + EMI note (§4.10); no online payment at launch (pay on pickup) — keeps trust simple.
- **Sticky mobile CTA bar:** on mobile, a bottom bar with `[Call]` `[WhatsApp]` `[Book]` on all repair pages.
- **Announcement bar slot** above nav (e.g., Eid hours) — CMS-controlled, dismissible.

---

## 10. Image, Video & Asset Inventory

### 10.1 Principles

Premium repair sites show **the workbench, not stock lifestyle**. Local competitors all use generic stock photos — real photography of the real lab is a differentiator worth a one-day professional shoot.

### 10.2 Photography Shot List (one shoot day, ~35 shots)

| # | Shot | Used on |
|---|---|---|
| 1–4 | Macro: micro-soldering under microscope, iron tip on logic board, flux smoke, board under magnification | Home §6, logic-board page, why-page |
| 5–7 | Engineer at bench (face visible), ultrasonic cleaner in action, thermal camera / diagnostic rig on screen | How-it-works, about, liquid page |
| 8–10 | Parts trays: labeled genuine displays/batteries in anti-static bags; parts storage wall | Parts explainer, pricing |
| 11–13 | Before/after: shattered iPhone → pristine; corroded board → cleaned; swollen battery removed | Device pages, blog |
| 14–16 | Front desk / check-in moment, device being tagged into sealed tray, ticket printout | Data-privacy band, booking page |
| 17–19 | Lab wide shots: benches, glass wall, CCTV visible | About, why-page |
| 20–23 | Team portraits (each engineer, consistent light/背景) + founder portrait | About, why-page, business |
| 24–26 | Courier flow: device padded in box, Pathao/RedX handoff, sealed package with APL label | Mail-in page |
| 27–30 | Devices on clean white/gray surfaces: MacBook open, iPhone grid, iPad + Pencil, Watch + AirPods (apple.com-style product staging) | Heroes, cards, OG images |
| 31–35 | Detail: hands in gloves, screw mat with magnetized layout, torque driver, pass/fail QC checklist on clipboard | Process sections, blog |

### 10.3 Non-Photo Assets

- **Device renders:** Apple press-style renders or high-quality mockups for the 9 device cards + mega-menu thumbnails (consistent angle & lighting).
- **Icons:** Lucide, 24px, stroke 1.5 (per design plan §11); brand-gradient fills for accent icons.
- **Logos to obtain:** bKash, Nagad, Visa, Mastercard, Amex; Pathao, RedX, Sundarban, SA Paribahan (courier strip); Facebook/Instagram/YouTube/LinkedIn; corporate client logos (with permission).
- **OG images:** template (logo + headline on brand gradient) per page type.
- **Illustrations:** status-tracker step icons; packing-guide diagram for mail-in.

### 10.4 Hero Video Brief (production planned separately — placeholder spec)

- **Concept:** a MacBook lies dark and disassembled — logic board, keys, screen, screws scattered in an exploded-view constellation. A repairman's hands enter; parts glide back together in reverse-motion choreography; the lid closes; the Apple Lab gradient glints across the aluminum; the screen lights up. **Broken → whole. That's the brand in 12 seconds.**
- **Specs:** 10–15s seamless loop, no audio (autoplay-safe), 2 crops (desktop 21:9-ish, mobile 4:5), under ~4 MB via AV1/H.265 with poster-frame fallback, `prefers-reduced-motion` → static poster.
- **Fallback until produced:** static floating-device collage with brand glow (design plan §10.2).

---

## 11. SEO & Content Marketing Plan

### 11.1 Technical

- **LocalBusiness JSON-LD** site-wide (name, address, geo, hours, phones, priceRange `৳৳`, sameAs socials, aggregateRating when review count is real).
- **FAQPage schema** on /faq and every page with FAQ blocks; **Service schema** on device/type pages; **BreadcrumbList** on all inner pages.
- **NAP consistency**: footer = Google Business Profile = Facebook, character-for-character.
- Google Business Profile actively managed; review velocity via the automated WhatsApp ask (§9.6).

### 11.2 Draft Meta Titles & Descriptions (top pages)

| Page | Title (≤60ch) | Description (≤155ch) |
|---|---|---|
| Home | Apple Lab — Apple Device Repair in Dhaka, Bangladesh | MacBook, iPhone & iPad repair with genuine-grade parts, free diagnosis and a 90-day written warranty. Book online or walk in at Dhanmondi. |
| /repairs/iphone | iPhone Repair in Dhaka — Screens in 2 Hours | Apple Lab | Cracked screen, weak battery, charging issues — fixed same day with a 90-day warranty. See prices online. Free diagnosis. |
| /repairs/macbook-pro | MacBook Pro Repair in Dhaka | Apple Lab | Screens, keyboards, batteries and logic boards for every MacBook Pro generation. Free diagnosis, fixed quotes, 90-day warranty. |
| /pricing | Apple Repair Prices in Bangladesh — Published & Fixed | The only Apple repair lab in Dhaka with published prices. Parts, labour and testing included. No hidden charges. |
| /mail-in | MacBook & iPhone Repair From Anywhere in Bangladesh | Courier your device via Pathao, RedX or Sundarban. We repair, test and return it insured — with live tracking and a 90-day warranty. |
| /track | Track Your Repair | Apple Lab | Enter your ticket ID for live status — from diagnosis to ready-for-pickup. |

### 11.3 Blog Backlog (20 topics, 80% educational)

**Emergency/first-aid (captures urgent searches):** 1) Dropped your phone in water? The first 60 minutes decide everything. 2) MacBook won't turn on: the 5 checks before you panic. 3) The question-mark folder on your Mac, explained. 4) Swollen battery? Stop charging. Right now.
**Battery & health:** 5) When should you actually replace your iPhone battery? (The 80% rule and beyond.) 6) Why your MacBook battery drains overnight. 7) Fast charging myths, tested.
**Buyer protection (strong BD angles):** 8) How to check if an iPhone is genuine before buying in Dhaka. 9) Official vs grey-market iPhones in Bangladesh: the warranty truth. 10) Is a used MacBook from Bashundhara worth it in 2026? 11) Is AppleCare valid in Bangladesh? 12) The IMEI check every used-phone buyer should run.
**Trust & education:** 13) Genuine vs copy screens: how to tell in 30 seconds. 14) What "Unknown Part" really means. 15) Why we refuse the cheapest parts. 16) Inside the Lab: how a logic board repair actually happens. 17) Rice doesn't fix wet phones. Here's what does.
**Decision guides:** 18) Repair or replace? A framework for a cracked iPhone. 19) SSD upgrade vs new MacBook. 20) What your repair quote actually pays for.

### 11.4 Phase 2 SEO Layers

- **Model pages** (`/repairs/iphone/iphone-13-pro`): price table + turnaround + model-specific FAQ — the workhorse pattern ("iPhone 13 Pro screen replacement Dhaka").
- **Area pages** (Gulshan, Banani, Uttara, Mirpur, Bashundhara): genuine local content only — directions, pickup times from that area, landmarks. No thin doorway pages.
- **Bangla versions** of the top 6 posts and top 5 landing pages (most competitors are English-only or nothing).

---

## 12. Bangla (বাংলা) Phase 2 Notes

- **Translation priority order:** Home → Booking flow + confirmations → FAQ → Pricing → Track + status messages → device pages → blog top-6.
- **Style:** translate meaning, not words — keep the Apple-calm tone in Bangla; avoid stiff literary register. Device names, model names and "Apple Lab" stay in English/Latin script. Numbers: Western numerals with ৳.
- **Glossary to fix early (consistency):** repair = রিপেয়ার (common usage) vs মেরামত (formal) — pick one (recommend রিপেয়ার for UI, মেরামত acceptable in prose); warranty = ওয়ারেন্টি; free diagnosis = ফ্রি ডায়াগনোসিস; screen = স্ক্রিন; battery = ব্যাটারি; booking = বুকিং.
- **Banglish reality:** chatbot and WhatsApp must handle Banglish ("amar iphone er screen vanga") — plan intents accordingly.
- The backend already models this: every content field has `_en`/`_bn` twins; frontend `[locale]` routing exists. No architectural work needed — only content.

---

## 13. CMS Mapping

How this plan lands in the existing backend:

| Content | Model | Notes |
|---|---|---|
| Phones, WhatsApp, address, hours, socials, maps embed, meta defaults | `content.SiteConfig` | Already has every field incl. `whatsapp_number`, `_en/_bn` pairs |
| 9 device services + 8 repair-type services | `content.Service` | `slug`, `icon`, `summary`, `body`, `image`, `display_order` |
| Homepage & why-page reviews | `content.Testimonial` | Source from real Google reviews (with permission) |
| All 22 FAQ answers (+ per-device extras) | `content.FAQItem` | Group/tag by category if a field exists; else prefix convention |
| Team & founder blocks | `content.TeamMember` | |
| Booking submissions, quote requests, business leads, contact form | `leads.Lead` (+ `service` FK, `source` = "booking" / "quote" / "business" / "contact") | `custom_fields` JSON holds model, issue, service mode, slot |
| Repair status pipeline | `leads.PipelineStage` + `StageTransition` | Seed the 7+2 stages from §9.3 with the status colors from the design plan §2.6 |
| Price list | *(new)* | Needs a `RepairPrice` model (service FK, model, part grade, price, turnaround) — single source of truth for /pricing, quote flow, and chatbot |
| Blog | *(new or existing)* | Needs a `Post` model if not present |

---

## 14. Production Checklist & Priorities

### Phase 1 — Launch (content-complete minimum)
- [ ] Fill real prices into every placeholder table (rate card → §4.5, §5.2, §7.1)
- [ ] Confirm hours, WhatsApp number, exact founding year, device-count stat
- [ ] Homepage (all 13 sections, §4) with photo-shoot assets
- [ ] 8 device pages + 8 repair-type pages (§5–6)
- [ ] /pricing, /book, /track, /faq, /contact, /about, /warranty, /mail-in
- [ ] Booking flow + tracking + WhatsApp click-to-chat with prefills
- [ ] Photography day (shot list §10.2) — before design finalization
- [ ] 6–10 real Google reviews collected for testimonials
- [ ] LocalBusiness + FAQPage schema, meta set (§11.2), GBP alignment

### Phase 2 — Growth
- [ ] Hero video production (§10.4)
- [ ] /why-apple-lab full trust page + comparison table
- [ ] /business page + corporate outreach
- [ ] AI chatbot (English) → then Bangla/Banglish
- [ ] WhatsApp Business API templates + quote-approval buttons
- [ ] First 6 blog posts (emergency/first-aid cluster first — they capture urgent, high-intent searches)
- [ ] Bangla translations in the §12 priority order

### Phase 3 — Moat
- [ ] Model-level SEO pages, area pages
- [ ] Refurb/trade-in section (proven secondary revenue pattern: iSmash, Mobile Klinik, Mac Infinity)
- [ ] EMI checkout integration; loaner-device program for business
- [ ] "Watch your repair" content series (filmed board repairs — the Rossmann trust engine)

---

*End of content plan. Companion doc: `AppleLab_Design_Plan.md` for the visual system. Next step: feed §4 (homepage copy) + the design plan into Claude Design for the homepage mockup.*
