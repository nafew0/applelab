"""Import the device catalog STRUCTURE from the ifixit.com.bd research crawl.

Reads ``research/ifixit-crawl/csv/{device_categories,models,issues_catalog,services}.csv``
and builds families / models / issues / offerings for AppleLab:

* competitor hierarchy (group → device → model) collapses into family → model with
  structured attributes (line, size, chip, year, A-numbers)
* the competitor's 51 repair titles merge into ~38 canonical issues (see MERGE)
* competitor prices are stored ONLY as ``reference_price`` (internal). Public
  ``price_from`` stays empty until the owner sets it in the admin matrix.
* competitor copy is NEVER imported. Default page content comes from the
  original templates in this file (EN + BN, variable-driven).

Idempotent: update_or_create on slugs; owner edits to prices/content are kept.
"""
import csv
import re
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from repairs.models import DeviceFamily, DeviceModel, Issue, ModelIssue
from repairs.seeding import upsert

DEFAULT_CSV_DIR = Path(__file__).resolve().parents[4] / "research" / "ifixit-crawl" / "csv"

# ---------------------------------------------------------------- families
FAMILIES = {
    "iphone": ("iPhone", "আইফোন", "phone", 0, "iphone"),
    "ipad": ("iPad", "আইপ্যাড", "tablet", 1, "ipad"),
    "macbook-air": ("MacBook Air", "ম্যাকবুক এয়ার", "laptop", 2, "macbook-air"),
    "macbook-pro": ("MacBook Pro", "ম্যাকবুক প্রো", "laptop", 3, "macbook-pro"),
    "imac": ("iMac", "আইম্যাক", "desktop", 4, "imac"),
    "mac-mini": ("Mac mini", "ম্যাক মিনি", "desktop", 5, "mac-mini"),
    "mac-studio": ("Mac Studio", "ম্যাক স্টুডিও", "desktop", 6, "mac-studio"),
    "apple-watch": ("Apple Watch", "অ্যাপল ওয়াচ", "watch", 7, "apple-watch"),
    "airpods": ("AirPods", "এয়ারপডস", "audio", 8, "airpods"),
    "vision-pro": ("Vision Pro", "ভিশন প্রো", "headset", 9, "vision-pro"),
}

# competitor device endpoint → (family, line, size_label, slug prefix)
DEVICE_MAP = {
    "iphone": ("iphone", "", "", ""),
    "ipad-mini": ("ipad", "mini", "", "mini-"),
    "ipad-air": ("ipad", "Air", "", "air-"),
    "ipad-pro": ("ipad", "Pro", "", "pro-"),
    "ipad-gen": ("ipad", "standard", "", "gen-"),
    "macbook-air-11-inch": ("macbook-air", "", "11″", "11-inch-"),
    "macbook-air-13-inch": ("macbook-air", "", "13″", "13-inch-"),
    "macbook-air-15-inch": ("macbook-air", "", "15″", "15-inch-"),
    "macbook-pro-13-inch": ("macbook-pro", "", "13″", "13-inch-"),
    "macbook-pro-14-inch": ("macbook-pro", "", "14″", "14-inch-"),
    "macbook-pro-15-inch": ("macbook-pro", "", "15″", "15-inch-"),
    "macbook-pro-16-inch": ("macbook-pro", "", "16″", "16-inch-"),
    "imac-21-inch": ("imac", "Intel", "21.5″", "21-inch-"),
    "imac-27-inch": ("imac", "Intel", "27″", "27-inch-"),
    "imac-silicon": ("imac", "Apple Silicon", "24″", "24-inch-"),
    "mac-mini": ("mac-mini", "", "", ""),
    "mac-studio": ("mac-studio", "", "", ""),
    "apple-watch-generation": ("apple-watch", "Series", "", ""),
    "apple-watch-se": ("apple-watch", "SE", "", "se-"),
    "apple-watch-ultra": ("apple-watch", "Ultra", "", "ultra-"),
    "airpods-generation": ("airpods", "standard", "", ""),
    "airpods-pro": ("airpods", "Pro", "", "pro-"),
    "airpods-max": ("airpods", "Max", "", "max-"),
    "vision-pro-series": ("vision-pro", "", "", ""),
}

IPHONE_CHIPS = {
    "6": "A8", "6 plus": "A8", "6s": "A9", "6s plus": "A9", "se": "A9", "7": "A10 Fusion",
    "7 plus": "A10 Fusion", "8": "A11 Bionic", "8 plus": "A11 Bionic", "x": "A11 Bionic",
    "xr": "A12 Bionic", "xs": "A12 Bionic", "xs max": "A12 Bionic", "11": "A13 Bionic",
    "11 pro": "A13 Bionic", "11 pro max": "A13 Bionic", "se 2020": "A13 Bionic",
    "12": "A14 Bionic", "12 mini": "A14 Bionic", "12 pro": "A14 Bionic", "12 pro max": "A14 Bionic",
    "13": "A15 Bionic", "13 mini": "A15 Bionic", "13 pro": "A15 Bionic", "13 pro max": "A15 Bionic",
    "se 2022": "A15 Bionic", "14": "A15 Bionic", "14 plus": "A15 Bionic", "14 pro": "A16 Bionic",
    "14 pro max": "A16 Bionic", "15": "A16 Bionic", "15 plus": "A16 Bionic", "15 pro": "A17 Pro",
    "15 pro max": "A17 Pro", "16": "A18", "16 plus": "A18", "16 pro": "A18 Pro", "16 pro max": "A18 Pro",
    "16e": "A18", "17": "A19", "17 pro": "A19 Pro", "17 pro max": "A19 Pro", "air": "A19 Pro", "17e": "A19",
}

CHIP_RE = re.compile(r"\b(M[1-6](?:\s?(?:Pro Max|Pro|Max|Ultra))?(?:\s?and\s?M\d\s?Pro(?: Max)?)?)\b")
MODEL_NUMBER_RE = re.compile(r"\bA\d{4}\b")
RELEASE_LABEL_RE = re.compile(r"\b(Early|Mid|Late)\s?(\d{4})\b")
GENERATION_RE = re.compile(r"\b(\d+)(?:st|nd|rd|th)[\s-]?[Gg]en\b")
WATCH_SIZE_RE = re.compile(r"\b(\d{2})\s?mm\b")

# ---------------------------------------------------------------- issues
# competitor issue_key → canonical slug
MERGE = {
    "display replacement": "screen-replacement", "display repair": "screen-replacement",
    "battery replacement": "battery-replacement",
    "speaker replacement": "speaker-replacement", "loud speaker replacement": "loudspeaker-replacement",
    "ear speaker replacement": "ear-speaker-replacement", "audio issue": "audio-repair",
    "mic issue": "microphone-replacement",
    "motherboard repair": "logic-board-repair", "motherboard issue": "logic-board-repair",
    "software issue": "software-repair", "error solution": "software-repair", "os installation": "os-installation",
    "boot loop": "boot-loop-repair", "stuck on logo": "stuck-on-logo-repair",
    "liquid damage": "liquid-damage-repair", "liquid clean": "liquid-damage-repair",
    "button issue": "button-repair", "home button fixing": "button-repair",
    "upper glass replacement": "front-glass-replacement", "back glass replacement": "back-glass-replacement",
    "housing replacement": "housing-replacement", "cleaning service": "cleaning-service",
    "ssd upgrade": "ssd-upgrade", "storage upgrade": "ssd-upgrade", "ram upgrade": "ram-upgrade",
    "charging port replacement": "charging-port-replacement", "charging dock replacement": "charging-port-replacement",
    "charging issue": "charging-port-replacement", "charge draining issue": "battery-drain-fix",
    "camera replacement": "camera-replacement", "camera issue": "camera-replacement",
    "front camera replacement": "front-camera-replacement", "rear camera replacement": "rear-camera-replacement",
    "trackpad issue": "trackpad-repair", "keyboard replacement": "keyboard-replacement",
    "touch bar replacement": "touch-bar-replacement",
    "wifi issue": "wifi-bluetooth-repair", "network problem": "network-repair", "no modem firmware": "network-repair",
    "touch replacement": "touch-replacement", "touch issue": "touch-replacement",
    "face id issue": "face-id-repair", "fingerprint issue": "touch-id-repair",
    "proximity sensor replacement": "proximity-sensor-replacement",
    "taptic engine replace": "taptic-engine-replacement", "taptic engine issue": "taptic-engine-replacement",
    "no light on display issue": "backlight-repair", "power issue": "power-repair",
    "temperature high issue": "overheating-repair", "power supply replacement": "power-supply-replacement",
}

# canonical slug → (name_en, name_bn, category, display_order)
ISSUES = {
    "screen-replacement": ("Screen Replacement", "স্ক্রিন পরিবর্তন", "screen", 0),
    "front-glass-replacement": ("Front Glass Replacement", "সামনের গ্লাস পরিবর্তন", "screen", 1),
    "backlight-repair": ("No Display / Backlight Repair", "ডিসপ্লে আলো না জ্বলা মেরামত", "screen", 2),
    "touch-replacement": ("Touch / Digitizer Replacement", "টাচ / ডিজিটাইজার পরিবর্তন", "screen", 3),
    "battery-replacement": ("Battery Replacement", "ব্যাটারি পরিবর্তন", "battery", 10),
    "battery-drain-fix": ("Battery Drain Fix", "ব্যাটারি দ্রুত শেষ হওয়া সমাধান", "battery", 11),
    "charging-port-replacement": ("Charging Port Replacement", "চার্জিং পোর্ট পরিবর্তন", "power", 20),
    "power-repair": ("Won't Turn On / Power Repair", "চালু না হওয়া / পাওয়ার মেরামত", "power", 21),
    "power-supply-replacement": ("Power Supply Replacement", "পাওয়ার সাপ্লাই পরিবর্তন", "power", 22),
    "overheating-repair": ("Overheating Repair", "অতিরিক্ত গরম হওয়া মেরামত", "power", 23),
    "logic-board-repair": ("Logic Board Repair", "লজিক বোর্ড মেরামত", "board", 30),
    "liquid-damage-repair": ("Liquid Damage Repair", "পানিতে ক্ষতি মেরামত", "liquid", 40),
    "speaker-replacement": ("Speaker Replacement", "স্পিকার পরিবর্তন", "audio", 50),
    "loudspeaker-replacement": ("Loudspeaker Replacement", "লাউডস্পিকার পরিবর্তন", "audio", 51),
    "ear-speaker-replacement": ("Ear Speaker Replacement", "ইয়ার স্পিকার পরিবর্তন", "audio", 52),
    "microphone-replacement": ("Microphone Replacement", "মাইক্রোফোন পরিবর্তন", "audio", 53),
    "audio-repair": ("Audio Repair", "অডিও মেরামত", "audio", 54),
    "camera-replacement": ("Camera Replacement", "ক্যামেরা পরিবর্তন", "camera", 60),
    "rear-camera-replacement": ("Rear Camera Replacement", "পেছনের ক্যামেরা পরিবর্তন", "camera", 61),
    "front-camera-replacement": ("Front Camera Replacement", "সামনের ক্যামেরা পরিবর্তন", "camera", 62),
    "face-id-repair": ("Face ID Repair", "ফেস আইডি মেরামত", "camera", 63),
    "touch-id-repair": ("Touch ID Repair", "টাচ আইডি মেরামত", "camera", 64),
    "proximity-sensor-replacement": ("Proximity Sensor Replacement", "প্রক্সিমিটি সেন্সর পরিবর্তন", "camera", 65),
    "keyboard-replacement": ("Keyboard Replacement", "কিবোর্ড পরিবর্তন", "input", 70),
    "trackpad-repair": ("Trackpad Repair", "ট্র্যাকপ্যাড মেরামত", "input", 71),
    "touch-bar-replacement": ("Touch Bar Replacement", "টাচ বার পরিবর্তন", "input", 72),
    "button-repair": ("Button Repair", "বাটন মেরামত", "input", 73),
    "taptic-engine-replacement": ("Taptic Engine Replacement", "ট্যাপটিক ইঞ্জিন পরিবর্তন", "input", 74),
    "back-glass-replacement": ("Back Glass Replacement", "পেছনের গ্লাস পরিবর্তন", "body", 80),
    "housing-replacement": ("Housing Replacement", "হাউজিং পরিবর্তন", "body", 81),
    "cleaning-service": ("Cleaning Service", "ক্লিনিং সার্ভিস", "body", 82),
    "software-repair": ("Software Repair", "সফটওয়্যার মেরামত", "software", 90),
    "os-installation": ("OS Installation", "ওএস ইনস্টলেশন", "software", 91),
    "boot-loop-repair": ("Boot Loop Repair", "বুট লুপ মেরামত", "software", 92),
    "stuck-on-logo-repair": ("Stuck on Apple Logo Repair", "অ্যাপল লোগোতে আটকে যাওয়া মেরামত", "software", 93),
    "wifi-bluetooth-repair": ("Wi-Fi / Bluetooth Repair", "ওয়াই-ফাই / ব্লুটুথ মেরামত", "connectivity", 100),
    "network-repair": ("Network / No Service Repair", "নেটওয়ার্ক / নো সার্ভিস মেরামত", "connectivity", 101),
    "ssd-upgrade": ("SSD Upgrade", "এসএসডি আপগ্রেড", "upgrade", 110),
    "ram-upgrade": ("RAM Upgrade", "র‍্যাম আপগ্রেড", "upgrade", 111),
}

# ---------------------------------------------------------------- original default content (EN/BN)
GENERIC_CONTENT_EN = """## {{issue.name}} for the {{model.name}} in {{city}}

Apple Lab in {{area}}, {{city}} repairs {{issue.name}} faults on the {{model.name}} using genuine or OEM-grade parts. Every job starts with a free diagnosis, you approve a fixed quote before we touch the device, and the repair is covered by our 90-day warranty.

### How the repair works
1. **Free diagnosis** — we confirm the fault and check related components so the problem does not come back.
2. **Fixed quote** — you approve the price first; no surprises after the work.
3. **Repair and test** — the {{model.name}} is repaired on the bench, then function-tested before hand-over.

### Why customers choose Apple Lab
- Apple specialists since 2010, in {{area}}, {{city}}
- Genuine and OEM-grade parts only
- Same-day turnaround for most repairs
- 90-day warranty on parts and labour
"""

GENERIC_CONTENT_BN = """## {{city}}-এ {{model.name}}-এর {{issue.name}}

{{area}}, {{city}}-এর অ্যাপল ল্যাব জেনুইন বা ওইএম-গ্রেড পার্টস দিয়ে {{model.name}}-এর {{issue.name}} সমস্যা মেরামত করে। প্রতিটি কাজ শুরু হয় ফ্রি ডায়াগনসিস দিয়ে, ডিভাইসে হাত দেওয়ার আগে আপনি নির্দিষ্ট কোটেশন অনুমোদন করেন, আর মেরামতে থাকে ৯০ দিনের ওয়ারেন্টি।

### মেরামত যেভাবে হয়
1. **ফ্রি ডায়াগনসিস** — সমস্যা নিশ্চিত করি এবং সংশ্লিষ্ট যন্ত্রাংশ পরীক্ষা করি, যেন সমস্যা ফিরে না আসে।
2. **নির্দিষ্ট কোটেশন** — আগে আপনি দাম অনুমোদন করেন; কাজের পরে কোনো চমক নেই।
3. **মেরামত ও পরীক্ষা** — {{model.name}} বেঞ্চে মেরামত করে হস্তান্তরের আগে সম্পূর্ণ পরীক্ষা করা হয়।

### কেন গ্রাহকরা অ্যাপল ল্যাব বেছে নেন
- ২০১০ সাল থেকে অ্যাপল বিশেষজ্ঞ, {{area}}, {{city}}
- শুধুই জেনুইন ও ওইএম-গ্রেড পার্টস
- বেশিরভাগ মেরামত একই দিনে
- পার্টস ও শ্রমে ৯০ দিনের ওয়ারেন্টি
"""

SPECIFIC_CONTENT_EN = {
    "screen-replacement": """## {{model.name}} screen replacement in {{city}}

A cracked or lifeless display is the most common {{model.name}} repair we see at Apple Lab, {{area}}. Typical signs: spider-web cracks, green or pink lines, dead zones that ignore touch, flickering, or a screen that stays black while the device still rings or chimes.

### What we replace
The full display assembly (panel, glass and touch layer) is swapped as one sealed unit, so touch accuracy, brightness and colour match the original. On models with True Tone or Face ID we transfer or re-calibrate the required components so those features keep working.

### Price, time and warranty
The final price depends on the part grade you choose (genuine or OEM-grade) and is fixed after a free diagnosis. Most {{model.name}} screen replacements are completed the same day, and every screen carries our 90-day warranty on parts and labour.

### Before you visit
Back up your data if you can, and do not keep using a device whose glass is shattered — loose shards can damage the panel underneath and cut your fingers.
""",
    "battery-replacement": """## {{model.name}} battery replacement in {{city}}

If your {{model.name}} drains far faster than it used to, shuts down at 20–30 %, feels warm while charging, or the case is starting to bulge, the battery has reached the end of its life. A worn battery can also make the device throttle performance to protect itself.

### What we do
We fit a new high-capacity cell, replace the adhesive properly so the device stays sealed, and run a charge–discharge test before hand-over. Where the model reports battery health, the new cell shows 100 % and the service indicator is reset.

### Price, time and warranty
Battery replacement is priced after a free diagnosis and usually takes under an hour for the {{model.name}}. The new battery is covered by our 90-day warranty.

### Swollen battery?
Stop charging and bring the device in as soon as possible — a swollen cell can crack the screen or damage the logic board.
""",
    "charging-port-replacement": """## {{model.name}} charging port repair in {{city}}

A loose cable, intermittent charging, "accessory not supported" messages, or a port full of lint are the usual reasons a {{model.name}} stops charging. Apple Lab cleans, tests and — when the connector is worn or broken — replaces the charging port assembly.

### What we check
We first rule out the charger, cable and debris in the port, then test the charging circuit on the logic board, because a dead port and a dead charging IC show the same symptom but need different repairs.

### Price, time and warranty
Port cleaning is quick and inexpensive; a full port replacement on the {{model.name}} is usually same-day. Every repair includes a free diagnosis and a 90-day warranty.
""",
    "liquid-damage-repair": """## {{model.name}} liquid damage repair in {{city}}

Dropped in water, spilled tea, or caught in the rain — liquid finds its way into the {{model.name}} fast, and corrosion starts within hours. The sooner the device reaches our bench, the better the odds of a full recovery.

### What we do
We open the device, disconnect the battery, and clean the logic board and connectors with an ultrasonic bath. Corroded components are repaired or replaced at board level, then the device is tested part by part — display, battery, cameras, speakers, charging.

### What to do right now
Switch the device off, do not charge it, do not put it in rice, and bring it in as soon as you can.

### Price and warranty
Liquid-damage work is quoted after a free diagnosis because every case is different. Repairs carry our 90-day warranty on the work performed.
""",
    "logic-board-repair": """## {{model.name}} logic board repair in {{city}}

Not turning on, boot loops, no image, no charging, no sound, or a device that dies at random — when the usual parts test fine, the fault is on the logic board. Apple Lab repairs {{model.name}} boards at component level instead of replacing the whole board.

### What board-level repair means
Using microscopes, thermal imaging and schematics, our engineers locate the failed component (a power IC, charging IC, backlight driver, a shorted capacitor) and replace just that. Your data usually stays intact, and the repair costs a fraction of a board swap.

### Price, time and warranty
Board repairs are quoted after a free diagnosis; most are completed within 1–3 days depending on parts. The repair is covered by our 90-day warranty.
""",
    "back-glass-replacement": """## {{model.name}} back glass replacement in {{city}}

A shattered back panel is more than cosmetic: glass shards work loose, wireless charging can stop, and the frame loses water resistance. Apple Lab replaces the rear glass of the {{model.name}} and re-seals the device.

### What we do
The broken glass is removed with a laser or heat process, the frame is cleaned, a new panel matching your colour is fitted, and the device is re-sealed with fresh adhesive.

### Price, time and warranty
Back glass replacement on the {{model.name}} is usually same-day, priced after a free diagnosis, and covered by our 90-day warranty.
""",
    "keyboard-replacement": """## {{model.name}} keyboard replacement in {{city}}

Sticky keys, keys that repeat or do not register, and keys that have popped off are all common on the {{model.name}}. Apple Lab repairs individual keys where possible and replaces the full keyboard or top case when needed.

### What we do
We first try to clean and re-seat the affected keys. If the keyboard membrane or backlight is damaged, we replace the keyboard assembly and test every key, the backlight and the Touch ID button afterwards.

### Price, time and warranty
Single-key repairs are quick; a full keyboard replacement on the {{model.name}} is usually completed in a day. Free diagnosis, 90-day warranty.
""",
    "face-id-repair": """## {{model.name}} Face ID repair in {{city}}

"Face ID is not available" or "Unable to activate Face ID" after a drop or a screen replacement elsewhere usually points to the TrueDepth camera module or the flood illuminator. Apple Lab repairs Face ID on the {{model.name}} while keeping your original security hardware wherever possible.

### What we do
We diagnose the TrueDepth flex, dot projector and flood illuminator, repair the damaged section at component level, and re-test Face ID enrolment before hand-over.

### Price, time and warranty
Face ID repairs are quoted after a free diagnosis and are typically completed within 1–2 days, with our 90-day warranty.
""",
    "camera-replacement": """## {{model.name}} camera repair in {{city}}

Blurry photos, a black camera screen, shaking video, or a lens that will not focus mean the camera module on your {{model.name}} needs attention. Apple Lab replaces front and rear camera modules and cracked lens covers.

### What we do
We confirm whether the fault is the lens glass, the module or its flex cable, replace only what is needed, and test focus, stabilisation and every lens afterwards.

### Price, time and warranty
Camera repairs on the {{model.name}} are usually same-day, quoted after a free diagnosis, and covered by our 90-day warranty.
""",
    "software-repair": """## {{model.name}} software repair in {{city}}

Freezing, crashing apps, failed updates, activation problems or a device stuck in recovery mode do not always need a hardware repair. Apple Lab diagnoses and fixes software faults on the {{model.name}} while protecting your data wherever possible.

### What we do
We check storage, system integrity and update state, repair or reinstall the operating system, and confirm your device activates and syncs normally. If a hardware fault is behind the symptom, we tell you before any work.

### Price, time and warranty
Most software repairs on the {{model.name}} are completed the same day. Free diagnosis; our work is covered by a 90-day warranty.
""",
}

SPECIFIC_CONTENT_BN = {
    "screen-replacement": """## {{city}}-এ {{model.name}} স্ক্রিন পরিবর্তন

ভাঙা বা নিষ্প্রাণ ডিসপ্লে হলো অ্যাপল ল্যাব, {{area}}-এ সবচেয়ে বেশি আসা {{model.name}} মেরামত। সাধারণ লক্ষণ: মাকড়সার জালের মতো ফাটল, সবুজ বা গোলাপি লাইন, টাচ কাজ না করা অংশ, ফ্লিকারিং, অথবা ডিভাইস বাজলেও স্ক্রিন কালো থাকা।

### আমরা কী পরিবর্তন করি
পুরো ডিসপ্লে অ্যাসেম্বলি (প্যানেল, গ্লাস ও টাচ লেয়ার) একটি সিল করা ইউনিট হিসেবে বদলানো হয়, যাতে টাচ, উজ্জ্বলতা ও রঙ অরিজিনালের মতোই থাকে। ট্রু টোন বা ফেস আইডি থাকা মডেলে প্রয়োজনীয় কম্পোনেন্ট স্থানান্তর বা রি-ক্যালিব্রেট করা হয়।

### দাম, সময় ও ওয়ারেন্টি
চূড়ান্ত দাম নির্ভর করে আপনার বেছে নেওয়া পার্টস গ্রেডের (জেনুইন বা ওইএম-গ্রেড) ওপর এবং ফ্রি ডায়াগনসিসের পর নির্ধারিত হয়। বেশিরভাগ {{model.name}} স্ক্রিন পরিবর্তন একই দিনে শেষ হয়, আর প্রতিটি স্ক্রিনে থাকে ৯০ দিনের ওয়ারেন্টি।

### আসার আগে
সম্ভব হলে ডেটা ব্যাকআপ নিন, আর গ্লাস ভাঙা ডিভাইস ব্যবহার চালিয়ে যাবেন না — আলগা কাচ নিচের প্যানেল নষ্ট করতে ও আঙুল কাটতে পারে।
""",
    "battery-replacement": """## {{city}}-এ {{model.name}} ব্যাটারি পরিবর্তন

আপনার {{model.name}} আগের চেয়ে অনেক দ্রুত চার্জ শেষ করলে, ২০–৩০%-এ বন্ধ হয়ে গেলে, চার্জে গরম হলে, বা কেস ফুলে উঠলে ব্যাটারির আয়ু শেষ। পুরনো ব্যাটারি ডিভাইসের পারফরম্যান্সও কমিয়ে দেয়।

### আমরা কী করি
নতুন উচ্চক্ষমতার সেল লাগাই, আঠা ঠিকভাবে বদলে ডিভাইস সিল রাখি, এবং হস্তান্তরের আগে চার্জ–ডিসচার্জ পরীক্ষা করি। ব্যাটারি হেলথ দেখানো মডেলে নতুন সেল ১০০% দেখায়।

### দাম, সময় ও ওয়ারেন্টি
ফ্রি ডায়াগনসিসের পর দাম নির্ধারিত হয়; {{model.name}}-এ সাধারণত এক ঘণ্টারও কম সময় লাগে। নতুন ব্যাটারিতে ৯০ দিনের ওয়ারেন্টি।

### ব্যাটারি ফুলে গেছে?
চার্জ দেওয়া বন্ধ করে যত দ্রুত সম্ভব নিয়ে আসুন — ফোলা সেল স্ক্রিন ফাটাতে বা লজিক বোর্ড নষ্ট করতে পারে।
""",
    "liquid-damage-repair": """## {{city}}-এ {{model.name}} পানিতে ক্ষতি মেরামত

পানিতে পড়া, চা ছলকে পড়া বা বৃষ্টিতে ভেজা — তরল খুব দ্রুত {{model.name}}-এর ভেতরে ঢুকে যায় এবং কয়েক ঘণ্টার মধ্যেই ক্ষয় শুরু হয়। যত তাড়াতাড়ি ডিভাইস আমাদের বেঞ্চে আসবে, পুরোপুরি সেরে ওঠার সম্ভাবনা তত বেশি।

### আমরা কী করি
ডিভাইস খুলে ব্যাটারি বিচ্ছিন্ন করি, লজিক বোর্ড ও কানেক্টর আলট্রাসনিক বাথে পরিষ্কার করি। ক্ষয়প্রাপ্ত কম্পোনেন্ট বোর্ড-লেভেলে মেরামত বা পরিবর্তন করে প্রতিটি অংশ — ডিসপ্লে, ব্যাটারি, ক্যামেরা, স্পিকার, চার্জিং — পরীক্ষা করি।

### এখনই যা করবেন
ডিভাইস বন্ধ করুন, চার্জ দেবেন না, চালের মধ্যে রাখবেন না, আর যত দ্রুত সম্ভব নিয়ে আসুন।

### দাম ও ওয়ারেন্টি
প্রতিটি কেস আলাদা বলে ফ্রি ডায়াগনসিসের পর কোটেশন দেওয়া হয়। করা কাজে ৯০ দিনের ওয়ারেন্টি।
""",
}

GENERIC_FAQ = [
    {
        "q_en": "How long does {{issue.name}} take on the {{model.name}}?",
        "q_bn": "{{model.name}}-এ {{issue.name}} করতে কত সময় লাগে?",
        "a_en": "Most {{issue.name}} jobs on the {{model.name}} are completed the same day. Board-level work can take 1–3 days depending on parts; we tell you the timeline with the quote.",
        "a_bn": "{{model.name}}-এর বেশিরভাগ {{issue.name}} একই দিনে শেষ হয়। বোর্ড-লেভেল কাজে পার্টসের ওপর নির্ভর করে ১–৩ দিন লাগতে পারে; কোটেশনের সাথে সময়সীমা জানিয়ে দিই।",
    },
    {
        "q_en": "Is the diagnosis really free?",
        "q_bn": "ডায়াগনসিস কি সত্যিই ফ্রি?",
        "a_en": "Yes. We diagnose the {{model.name}} for free and you approve a fixed quote before any repair. If we cannot fix it, you pay nothing.",
        "a_bn": "হ্যাঁ। {{model.name}}-এর ডায়াগনসিস ফ্রি এবং মেরামতের আগে আপনি নির্দিষ্ট কোটেশন অনুমোদন করেন। ঠিক করতে না পারলে কোনো টাকা দিতে হবে না।",
    },
    {
        "q_en": "What warranty do I get?",
        "q_bn": "কী ওয়ারেন্টি পাব?",
        "a_en": "Every repair at Apple Lab is covered by a 90-day warranty on parts and labour.",
        "a_bn": "অ্যাপল ল্যাবের প্রতিটি মেরামতে পার্টস ও শ্রমে ৯০ দিনের ওয়ারেন্টি থাকে।",
    },
]

FAMILY_INTRO_EN = {
    "iphone": "Every iPhone from the 6 to the latest 17 line-up — screens, batteries, back glass, cameras, Face ID and board-level repair at Apple Lab, Dhanmondi.",
    "ipad": "iPad, iPad mini, iPad Air and iPad Pro repair: screens and digitizers, batteries, charging ports and logic boards, with genuine parts and a 90-day warranty.",
    "macbook-air": "MacBook Air 11″, 13″ and 15″ — Intel and every M-series chip. Screens, batteries, keyboards, trackpads, charging and liquid-damage recovery.",
    "macbook-pro": "MacBook Pro 13″ to 16″, Intel through M5: Retina display replacement, batteries, keyboards, Touch Bar, SSD upgrades and board-level repair.",
    "imac": "Intel 21.5″/27″ and Apple Silicon 24″ iMac repair: displays, power supplies, SSD and RAM upgrades, logic boards and Wi-Fi.",
    "mac-mini": "Mac mini repair and upgrades — power, SSD, cooling and logic board — for Intel and M-series models.",
    "mac-studio": "Mac Studio repair: cooling, SSD, connectivity and power issues handled by our board-level engineers.",
    "apple-watch": "Apple Watch Series, SE and Ultra repair: screens and front glass, batteries, crowns and water damage.",
    "airpods": "AirPods, AirPods Pro and AirPods Max: battery, speaker, microphone and charging-case repair.",
    "vision-pro": "Apple Vision Pro diagnostics and repair by appointment.",
}

FAMILY_INTRO_BN = {
    "iphone": "আইফোন ৬ থেকে সর্বশেষ ১৭ সিরিজ পর্যন্ত — স্ক্রিন, ব্যাটারি, পেছনের গ্লাস, ক্যামেরা, ফেস আইডি ও বোর্ড-লেভেল মেরামত, অ্যাপল ল্যাব ধানমন্ডিতে।",
    "ipad": "আইপ্যাড, আইপ্যাড মিনি, এয়ার ও প্রো মেরামত: স্ক্রিন ও ডিজিটাইজার, ব্যাটারি, চার্জিং পোর্ট ও লজিক বোর্ড — জেনুইন পার্টস ও ৯০ দিনের ওয়ারেন্টিসহ।",
    "macbook-air": "ম্যাকবুক এয়ার 11″, 13″ ও 15″ — ইন্টেল থেকে প্রতিটি M-সিরিজ চিপ। স্ক্রিন, ব্যাটারি, কিবোর্ড, ট্র্যাকপ্যাড, চার্জিং ও পানিতে ক্ষতি রিকভারি।",
    "macbook-pro": "ম্যাকবুক প্রো 13″ থেকে 16″, ইন্টেল থেকে M5: রেটিনা ডিসপ্লে পরিবর্তন, ব্যাটারি, কিবোর্ড, টাচ বার, এসএসডি আপগ্রেড ও বোর্ড-লেভেল মেরামত।",
    "imac": "ইন্টেল 21.5″/27″ ও অ্যাপল সিলিকন 24″ আইম্যাক মেরামত: ডিসপ্লে, পাওয়ার সাপ্লাই, এসএসডি ও র‍্যাম আপগ্রেড, লজিক বোর্ড ও ওয়াই-ফাই।",
    "mac-mini": "ইন্টেল ও M-সিরিজ ম্যাক মিনির মেরামত ও আপগ্রেড — পাওয়ার, এসএসডি, কুলিং ও লজিক বোর্ড।",
    "mac-studio": "ম্যাক স্টুডিও মেরামত: কুলিং, এসএসডি, কানেক্টিভিটি ও পাওয়ার সমস্যা — আমাদের বোর্ড-লেভেল ইঞ্জিনিয়ারদের হাতে।",
    "apple-watch": "অ্যাপল ওয়াচ সিরিজ, এসই ও আল্ট্রা মেরামত: স্ক্রিন ও সামনের গ্লাস, ব্যাটারি, ক্রাউন ও পানিতে ক্ষতি।",
    "airpods": "এয়ারপডস, এয়ারপডস প্রো ও ম্যাক্স: ব্যাটারি, স্পিকার, মাইক্রোফোন ও চার্জিং কেস মেরামত।",
    "vision-pro": "অ্যাপল ভিশন প্রো ডায়াগনসিস ও মেরামত, অ্যাপয়েন্টমেন্টের মাধ্যমে।",
}

FAMILY_FAQ = [
    {
        "q_en": "Do you repair every {{family.name}} model?",
        "q_bn": "আপনারা কি সব {{family.name}} মডেল মেরামত করেন?",
        "a_en": "Yes — every model listed on this page, and usually newer ones as soon as parts are available. If yours is not listed, message us on WhatsApp.",
        "a_bn": "হ্যাঁ — এই পেজে থাকা প্রতিটি মডেল, এবং পার্টস পাওয়া মাত্র নতুন মডেলও। আপনারটি তালিকায় না থাকলে হোয়াটসঅ্যাপে জানান।",
    },
    {
        "q_en": "Do you use genuine parts?",
        "q_bn": "আপনারা কি জেনুইন পার্টস ব্যবহার করেন?",
        "a_en": "We use genuine and OEM-grade parts and tell you which grade you are getting with the quote. Every part is covered by our 90-day warranty.",
        "a_bn": "আমরা জেনুইন ও ওইএম-গ্রেড পার্টস ব্যবহার করি এবং কোটেশনের সাথে কোন গ্রেড পাচ্ছেন জানিয়ে দিই। প্রতিটি পার্টসে ৯০ দিনের ওয়ারেন্টি।",
    },
    {
        "q_en": "Can I send my {{family.name}} from outside Dhaka?",
        "q_bn": "ঢাকার বাইরে থেকে কি {{family.name}} পাঠাতে পারি?",
        "a_en": "Yes. Courier it to our Dhanmondi lab; we diagnose, quote on WhatsApp, repair and courier it back insured.",
        "a_bn": "হ্যাঁ। আমাদের ধানমন্ডি ল্যাবে কুরিয়ার করুন; আমরা ডায়াগনসিস করে হোয়াটসঅ্যাপে কোটেশন দিই, মেরামত করে বিমাসহ ফেরত পাঠাই।",
    },
]


# ---------------------------------------------------------------- helpers
def clean_name(raw: str) -> str:
    name = raw.replace('"', "″").replace("Macbook", "MacBook").replace("Imac", "iMac")
    name = re.sub(r"\s+", " ", name).strip()
    name = re.sub(r"\s+\(", " (", name)
    return name


def display_name(name: str) -> str:
    """Apple-style public name from the crawl's title-cased one (parsing uses the raw name)."""
    n = re.sub(r"\bSe (\d{4})\b", r"SE (\1)", name)
    n = re.sub(r"\bSeries SE\b", "SE", n)
    n = re.sub(r"\bMini\b", "mini", n)
    n = re.sub(r"(\d+(?:\.\d+)?) Inch\b", r"\1″", n)
    n = re.sub(r"\b(\d+(?:st|nd|rd|th)) Gen\b", r"\1 gen", n)
    n = re.sub(r"(\d+(?:st|nd|rd|th) gen) (\d{4})$", r"\1 (\2)", n)
    n = re.sub(r"\s*-\s*(\d{2}mm)\b", r" \1", n)
    n = re.sub(r"\bM(\d) Pro and M\d Pro Max\b", r"M\1 Pro / M\1 Max", n)
    n = re.sub(r"\bM(\d) Pro/M(\d) Max\b", r"M\1 Pro / M\2 Max", n)
    n = n.replace(" Repair ", " ")
    return re.sub(r"\s+", " ", n).strip()


def bn_name(family_slug: str, name_en: str) -> str:
    fam_en = FAMILIES[family_slug][0]
    fam_bn = FAMILIES[family_slug][1]
    rest = re.sub(re.escape(fam_en), "", name_en, count=1, flags=re.I).strip()
    if family_slug == "imac":
        rest = re.sub(r"^(Intel|Apple Silicon)\s*", "", rest).strip()
    if family_slug == "iphone" and not rest:
        return fam_bn
    return f"{fam_bn} {rest}".strip()


def iphone_line(name_en: str) -> str:
    n = name_en.lower()
    if "pro max" in n:
        return "Pro Max"
    if "pro" in n:
        return "Pro"
    if "plus" in n:
        return "Plus"
    if "mini" in n:
        return "mini"
    if re.search(r"\b\d{2}e\b", n):
        return "e"
    if "air" in n:
        return "Air"
    if " se" in n:
        return "SE"
    return "standard"


def iphone_chip(name_en: str) -> str:
    key = re.sub(r"^iphone\s*", "", name_en.lower()).strip()
    return IPHONE_CHIPS.get(key, "")


def parse_price(raw: str, issue_key: str):
    try:
        value = Decimal(str(raw).strip() or "0")
    except Exception:  # noqa: BLE001
        return None
    if value <= 0:
        return None
    if value == 1000 and issue_key in ("display replacement", "battery replacement"):
        return None  # competitor placeholder card price
    return value


def slugify_endpoint(value: str) -> str:
    value = value.lower().replace(".", "-").replace("_", "-")
    value = re.sub(r"[^a-z0-9-]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-")


class Command(BaseCommand):
    help = "Import catalog structure from the ifixit.com.bd research crawl (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--csv-dir", default=str(DEFAULT_CSV_DIR))
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Also rewrite names/structure of existing rows (discards owner edits to those fields).",
        )

    def handle(self, *args, **options):
        csv_dir = Path(options["csv_dir"])
        self.overwrite = options["overwrite"]
        for name in ("device_categories.csv", "models.csv", "issues_catalog.csv", "services.csv"):
            if not (csv_dir / name).exists():
                raise CommandError(f"Missing {csv_dir / name}")

        with transaction.atomic():
            families = self.import_families()
            issues = self.import_issues(csv_dir, families)
            models = self.import_models(csv_dir, families)
            offerings = self.import_offerings(csv_dir, models, issues, families)

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog import complete: families={len(families)} models={len(models)} "
                f"issues={len(issues)} offerings={offerings}"
            )
        )

    # ------------------------------------------------------------ families
    def import_families(self):
        result = {}
        for slug, (name_en, name_bn, kind, order, _) in FAMILIES.items():
            family = upsert(
                DeviceFamily,
                {"slug": slug},
                {"name_en": name_en, "name_bn": name_bn, "kind": kind, "display_order": order, "icon": slug},
                self.overwrite,
            )
            changed = False
            if not family.intro_en:
                family.intro_en = FAMILY_INTRO_EN.get(slug, "")
                family.intro_bn = FAMILY_INTRO_BN.get(slug, "")
                changed = True
            if not family.faq:
                family.faq = FAMILY_FAQ
                changed = True
            if changed:
                family.save()
            result[slug] = family
        self.stdout.write(f"Families ensured: {len(result)}")
        return result

    # ------------------------------------------------------------ issues
    def import_issues(self, csv_dir, families):
        result = {}
        for slug, (name_en, name_bn, category, order) in ISSUES.items():
            issue = upsert(
                Issue,
                {"slug": slug},
                {"name_en": name_en, "name_bn": name_bn, "category": category, "display_order": order},
                self.overwrite,
            )
            changed = False
            if not issue.default_content_en:
                issue.default_content_en = SPECIFIC_CONTENT_EN.get(slug, GENERIC_CONTENT_EN)
                issue.default_content_bn = SPECIFIC_CONTENT_BN.get(slug, GENERIC_CONTENT_BN)
                changed = True
            if not issue.default_faq:
                issue.default_faq = GENERIC_FAQ
                changed = True
            if changed:
                issue.save()
            result[slug] = issue
        # sanity: every competitor key must be mapped
        with open(csv_dir / "issues_catalog.csv", newline="", encoding="utf-8") as fh:
            unmapped = [row["issue_key"] for row in csv.DictReader(fh) if row["issue_key"] not in MERGE]
        if unmapped:
            raise CommandError(f"Unmapped competitor issue keys: {unmapped}")
        self.stdout.write(f"Issues ensured: {len(result)}")
        return result

    # ------------------------------------------------------------ models
    def import_models(self, csv_dir, families):
        result = {}  # (device_endpoint, endpoint) -> DeviceModel
        used_slugs = {}
        with open(csv_dir / "models.csv", newline="", encoding="utf-8") as fh:
            rows = list(csv.DictReader(fh))
        for row in rows:
            device = row["device_endpoint"]
            if device not in DEVICE_MAP:
                self.stdout.write(self.style.WARNING(f"Skipping unknown device {device}"))
                continue
            family_slug, line, size_label, prefix = DEVICE_MAP[device]
            family = families[family_slug]
            name_en = clean_name(row["name"])
            slug = slugify_endpoint(prefix + row["endpoint"])
            key = (family_slug, slug)
            if key in used_slugs and used_slugs[key] != row["endpoint"]:
                slug = f"{slug}-{row.get('release_year') or 'x'}"
            used_slugs[(family_slug, slug)] = row["endpoint"]

            chip = ""
            if family_slug == "iphone":
                line = iphone_line(name_en)
                chip = iphone_chip(name_en)
            else:
                m = CHIP_RE.search(name_en)
                chip = m.group(1) if m else ("Intel" if "intel" in name_en.lower() else "")
            if family_slug == "apple-watch":
                m = WATCH_SIZE_RE.search(name_en)
                size_label = f"{m.group(1)}mm" if m else size_label
            release_label = ""
            m = RELEASE_LABEL_RE.search(name_en)
            if m:
                release_label = f"{m.group(1)} {m.group(2)}"
            generation = ""
            m = GENERATION_RE.search(name_en)
            if m:
                generation = f"{m.group(1)}{'st' if m.group(1).endswith('1') and m.group(1) != '11' else 'nd' if m.group(1).endswith('2') and m.group(1) != '12' else 'rd' if m.group(1).endswith('3') and m.group(1) != '13' else 'th'} gen"
            year = int(row["release_year"]) if row.get("release_year", "").isdigit() else None

            public_name = display_name(name_en)
            model = upsert(
                DeviceModel,
                {"family": family, "slug": slug},
                {
                    "name_en": public_name,
                    "name_bn": bn_name(family_slug, public_name),
                    "line": line,
                    "size_label": size_label,
                    "chip": chip,
                    "generation": generation,
                    "release_year": year,
                    "release_label": release_label,
                    "model_numbers": sorted(set(MODEL_NUMBER_RE.findall(name_en))),
                    "display_order": int(row.get("order_no") or 0),
                    "reference_source": row.get("url", ""),
                },
                self.overwrite,
            )
            result[(device, row["endpoint"])] = model
        self.stdout.write(f"Models ensured: {len(result)}")
        return result

    # ------------------------------------------------------------ offerings
    def import_offerings(self, csv_dir, models, issues, families):
        count = 0
        applies = {}  # issue slug -> set(family slug)
        seen = set()
        with open(csv_dir / "services.csv", newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                if row.get("status", "True") == "False" or row.get("endpoint_valid", "True") == "False":
                    continue
                model = models.get((row["device_endpoint"], row["model_endpoint"]))
                issue_slug = MERGE.get(row["issue_key"])
                if model is None or issue_slug is None:
                    continue
                issue = issues[issue_slug]
                pair = (model.pk, issue.pk)
                if pair in seen:
                    continue
                seen.add(pair)
                reference = parse_price(row.get("price_bdt", "0"), row["issue_key"])
                offering, created = ModelIssue.objects.get_or_create(model=model, issue=issue)
                if reference is not None and offering.reference_price != reference:
                    offering.reference_price = reference
                    offering.save(update_fields=["reference_price", "updated_at"])
                applies.setdefault(issue_slug, set()).add(model.family.slug)
                count += int(created)
        for issue_slug, family_slugs in applies.items():
            issues[issue_slug].applies_to.add(*[families[s] for s in family_slugs])
        total = ModelIssue.objects.count()
        self.stdout.write(f"Offerings ensured: {total} (new this run: {count})")
        return total
