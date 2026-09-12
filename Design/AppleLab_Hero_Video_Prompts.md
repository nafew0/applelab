# Apple Lab — Hero Film, Budget Edition (v2.2 — 12 unique frames, light mode)
**Budget:** ChatGPT image generation + Kling AI free credits. No paid video tools.
**Deliverable:** the scroll film at the top of the homepage — a MacBook comes apart, gets diagnosed, gets a genuine new part, goes back together, and wakes up.
**Look:** light mode only. Bright, airy, white and silver, with the brand blue-cyan as the only strong colour.
**Replaces:** v1 (paid Seedance segments) and v2.1 (6 images reused as a palindrome). Both are in git history.

---

## 1. How this works, and why 12

**The site does not play a video. It flips through still images as you scroll.**
The homepage film (`ScrollFilm`) stacks **12** images and cross-fades between them as the visitor scrolls. So 12 consistent ChatGPT images go straight onto the site with **zero video credits**, and the page code doesn't need to change beyond pointing at the new files.

**12 unique images = 12 frames.** One image per frame, no reuse. This fits the site exactly:
- the film already has 12 frame slots,
- the frame descriptions (alt text) in English and Bangla already have 12 entries,
- the four captions that appear during scrolling already line up with the 12-frame story below.

**What 12 unique frames buy you over reusing frames:** the second half is no longer just the first half played backwards. It tells the actual repair: a fault found, the old part out, a genuine new part in, then reassembly. That's a better story for a repair lab.

**What it costs:**
- **12 images plus retries.** Budget about **15–16 generations**. Spread them over several days if your ChatGPT plan limits images per day.
- **More edits, so more chances to drift.** Every edit can shift the camera or brightness a little. The chain order in §5 keeps each image anchored to a well-aligned parent.
- **No seamless autoplay loop.** The first and last frames differ (screen asleep vs awake). The site doesn't need a loop, since scroll drives it, so this only matters if you later want an autoplay video elsewhere.

---

## 2. The first frame *is* the hero

**Don't make a separate thumbnail. Make frame 1 beautiful.**

- In a scroll film, nothing plays by itself. Frame 1 is shown when the page loads, before any scripts run, and it stays until the visitor scrolls. It *is* the static hero.
- A separate poster image that disappears when the film starts would swap to a different picture on the first scroll. That visible jump is exactly the awkward moment you want to avoid.
- On Path B (Kling), frame 1 is the clip's start frame, so the video's first frame matches it too.

**Frame 12 is the second hero.** It's where the film ends, and it's the *only* frame shown to visitors who have turned off animations in their device settings. **Spend your first retries on frames 1 and 12.**

### How the page presents frame 1
The site lays a soft pale-grey wash over frame 1 (strongest across the top third, fading lower down) and centres the title on it: *"Watch a MacBook come back to life."* So frame 1 must:
- **Keep the laptop in the lower-centre of the image**, with calm, empty, bright space above it. The title then reads cleanly, and the laptop still shows through clearly below.
- **Look great on its own too**, because the wash and title fade away after the first bit of scrolling.

That empty space above the laptop does double duty: it's where the layers float up in the exploded frames.

### "Asleep" in light mode
No black screen anywhere. The screen starts *asleep* (a soft, dim, pearly-white glow), stirs in frame 11 (a faint blue tint), and wakes in frame 12 (the bright blue-to-cyan brand gradient). Cross-fading through those three otherwise identical shots reads as a screen powering on.

> **Page note (not part of the images):** on the live page, the area *around* the film frame is still black, with white "Scroll to play" text. That came from the design export. The black is a section colour, not dark mode, but if you want the film to feel fully light, switching that surround to white or #F5F5F7 is a small CSS change.

---

## 3. The storyboard: 12 unique frames

The fault in this story is the **battery**: the most common MacBook repair, and visually simple (slim cells that can glow, slide out and slide in).

| # | Name | What's in it | Edited from | Caption on the site |
|---|---|---|---|---|
| 1 | **Asleep** | Laptop intact, lid open, screen asleep (pearl glow). **The hero.** | new image | — (intro title over it) |
| 2 | **Lifting** | Layers just starting to separate upward | 1 | 01 Free diagnosis |
| 3 | **Diagnosis** | Half-exploded; one battery cell outlined by a soft cyan light — the fault, found | 2 | 01 Free diagnosis — every fault, found |
| 4 | **Exploded** | Full, neat exploded view, the faulty cell still faintly outlined | 3 | 02 Opened with care |
| 5 | **Old part out** | Exploded view; the faulty battery drifts out of the stack, to the left, fading paler | 4 | 02 → |
| 6 | **Surgical hands** | Exploded view, gap where the battery was; gloved hands with tweezers working on the logic board | 5 | 03 Genuine parts, surgical hands |
| 7 | **New part in** | The hands guide a fresh, gleaming new battery into the gap | 6 | 03 → (brand glint sweeps here) |
| 8 | **Renewed** | Hands gone; complete exploded view with the new battery in place, a soft blue-cyan sheen on it | 7 | 03 → |
| 9 | **Coming together** | Layers halfway back down (the reverse of frame 3, new battery in place) | 8 | 04 Every component, accounted for |
| 10 | **Almost home** | Layers a few centimetres from closed (the reverse of frame 2) | 9 | 04 → |
| 11 | **Stirring** | Laptop whole again, same pose as frame 1; screen's pale glow warming to a faint blue | **1** | ("Reborn." begins) |
| 12 | **Awake** | Same pose; screen fully awake in the blue-to-cyan brand gradient. **The closing hero.** | **1** | Reborn. |

**Priority for retries:** 1 and 12 (the heroes) → 4 and 7 (the hardest: a clean exploded view and believable hands) → the rest.

---

## 4. Palette and framing rules

**Palette (light mode):**
- White and very light grey studio (#F5F5F7), bright, high-key, soft daylight.
- **Silver** aluminium laptop (not space grey).
- Shadows soft and pale, never deep.
- The only strong colour is the brand blue-cyan: faint rim light on metal edges, the diagnosis outline (3–4), the sheen on the new part (7–8), the screen (11–12).
- No dark backgrounds, no black screen, no moody or dramatic lighting. Small dark details real laptops have (keycaps, the logic board) are fine. It's large dark *areas* we avoid.
- Gloves: **light-blue nitrile**. They stay light and echo the brand colour.

**Framing:** ChatGPT's landscape size is **1536 × 1024 (3:2)**. The site crops it:
- **Desktop** shows a wider slice, cutting ~7% off the top and bottom.
- **Mobile** shows a tall slice, keeping only about the **middle half of the width**.

So keep the laptop, every floating part and the hands inside the **centre half of the width** and away from the very top and bottom edges. Explode the laptop **upward in stacked layers**, not sideways. The old battery in frame 5 drifts *slightly* left, and the hands come from the right; both must stay close enough to the centre to survive the phone crop.

---

## 5. Getting 12 consistent images out of ChatGPT

Cross-fading only looks good when the frames line up. If the laptop moves 20 pixels between frames, visitors see a ghosted double image.

1. **Generate frame 1 once, then make every other frame by editing.** Attach the parent image (the "Edited from" column in §3) and say what changes. Never generate from text alone after frame 1.
2. **Frames 11 and 12 are both edited from frame 1**, not from frame 10. That keeps the three "whole laptop" frames (1, 11, 12) pixel-aligned, so the wake-up cross-fade is clean. It also makes the laptop land back exactly where it started.
3. **One change per edit.** Tell it explicitly to keep camera, lens, lighting, brightness, background and laptop design identical.
4. **Stay in one chat thread** so it keeps context. If a long thread starts drifting, start a new one by attaching frame 1 as the style reference plus the parent image.
5. **Check alignment after each image:** stack the new image over frame 1 at 50% opacity in [Photopea](https://www.photopea.com) (free, in the browser). If the laptop's base has shifted, nudge or scale the layer until it sits on frame 1, then export.
6. **Watch the brightness.** Edits sometimes drift darker or warmer. If one comes back dimmer, say "match the brightness and white background of the original exactly".
7. Don't burn a retry on small differences in floating parts; the cross-fade hides those. Regenerate only when the **camera angle, background, brightness or laptop shape** changes.

---

## 6. Prompts for ChatGPT

### Style block (paste at the end of prompt 1; the edits inherit it)
> Bright, airy, high-key premium product photography in the style of a flagship laptop launch. Seamless white studio background fading to a very soft light grey (#F5F5F7), no horizon line, no props. Soft, even, diffused daylight from above with gentle, pale shadows. A silver aluminium laptop with a completely plain lid, no logo, no text anywhere. Overall palette of white, silver and soft grey, with only small touches of blue and cyan light on the metal edges. No dark background, no black areas, no moody or dramatic lighting. Camera at a three-quarter front view, slightly above the laptop, 85mm lens look, laptop perfectly sharp. The laptop sits horizontally centred in the lower part of the frame, filling about the centre half of the width, with calm, empty, bright space above it and on both sides. Photorealistic, crisp detail, no motion blur, no text, no watermark. Landscape, 1536×1024.

Every edit prompt below starts with the same guard line. Keep it; it's what stops the drift:
> **Guard:** *Edit this image. Keep the camera, framing, lens, lighting, brightness, white background and laptop design exactly the same.*

### 1 — Asleep (the hero; new image)
> A silver aluminium laptop resting on a bright white studio floor, lid open at about 110 degrees, keyboard visible. The screen is asleep: a soft, dim, pearly-white glow, like a display at its very lowest brightness. The screen is light, not black, with no icons or text. The laptop looks flawless and calm, as if waiting to be woken up. Clean, serene, gallery-like presentation that works on its own as the hero image of a premium website. *[style block]*

### 2 — Lifting (edit of 1)
> *[Guard]* Keep the screen's soft pearly glow. Only change: the laptop's layers have just begun to separate upward, a few centimetres each. The display panel lifts slightly off the lid, the keyboard deck rises slightly from the base, and a few tiny silver screws float just above the case. Everything stays stacked directly above the laptop's base, in the same place in the frame.

### 3 — Diagnosis (edit of 2)
> *[Guard]* Keep the position of the laptop's base. Only change: the layers have floated further apart, about halfway to a full exploded view. The display panel, the keyboard deck with its keys, a logic board with gold contacts, slim silver-grey battery cells and the silver bottom case hover as separate stacked layers with clear gaps between them. One battery cell is outlined by a soft, glowing cyan light, as if a scanner has just found the fault. Tiny silver screws float in a loose ring. Keep everything within the centre half of the image, bright and airy.

### 4 — Exploded (edit of 3)
> *[Guard]* Only change: the laptop is now a complete, neat exploded view floating in stacked layers above where its base sits. From top to bottom: display panel, keys in their grid, keyboard deck, logic board, battery cells, trackpad, bottom case. Evenly spaced and perfectly ordered, like an engineering diagram, nothing chaotic. The faulty battery cell keeps its soft cyan outline. Soft, pale shadows of the parts fall on the white floor below. Everything stays inside the centre half of the image.

### 5 — Old part out (edit of 4)
> *[Guard]* Keep every other floating part exactly where it is. Only change: the faulty battery, with its cyan outline, slides out of the stack and drifts a short way to the left, turning slightly paler and more transparent as it leaves. It stays close to the stack, inside the centre half of the image. A clean empty gap is left in the stack where the battery was.

### 6 — Surgical hands (edit of 5)
> *[Guard]* Keep every floating part and the empty battery gap exactly as they are. Only change: remove the old battery from the scene entirely, and add two hands in light-blue nitrile gloves reaching in from the right edge of the frame. One gently steadies the floating logic board; the other holds fine steel tweezers, placing one tiny component onto the board. Only hands and forearms, no face, no body. The hands stay on the right side and must not cover the centre of the laptop.

### 7 — New part in (edit of 6)
> *[Guard]* Keep every floating part and the hands' position exactly the same. Only change: the tweezers are gone, and the gloved hands now guide a fresh, gleaming new battery into the empty gap in the stack. The new battery is clean silver-grey with a soft blue-cyan sheen along its edges, clearly brand new. The hands must not cover the centre of the laptop.

### 8 — Renewed (edit of 7)
> *[Guard]* Keep every floating part exactly where it is. Only change: remove the hands completely. The new battery now sits in its place in the neat exploded view, with a soft blue-cyan sheen along its edges. Everything is perfectly ordered, calm and bright.

### 9 — Coming together (edit of 8)
> *[Guard]* Keep the position of the laptop's base. Only change: the layers have floated halfway back down towards the base, with gaps half the size they were. The new battery with its soft blue-cyan sheen is in its place in the stack. Tiny silver screws drift back towards the case. Everything stays stacked directly above the base, within the centre half of the image.

### 10 — Almost home (edit of 9)
> *[Guard]* Keep the position of the laptop's base. Only change: the layers are only a few centimetres from closing. The display panel is almost back on the lid, the keyboard deck almost seated in the base, and the last few screws hover just above their holes. The screen shows the same soft pearly glow as the original laptop.

### 11 — Stirring (edit of **1**, not 10)
> Attach frame 1. *[Guard]* Keep absolutely everything identical: the laptop's position, angle, lid, keyboard and framing. Only change: the screen's soft pearly glow is warming into a faint, pale blue, as if the laptop is starting to wake up. Still no icons, no text, no windows. The rest of the image stays bright, white and airy.

### 12 — Awake (the closing hero; edit of **1**, not 11)
> Attach frame 1. *[Guard]* Keep absolutely everything identical: the laptop's position, angle, lid, keyboard and framing. Only change: the screen is fully awake. It shows a bright, smooth gradient from deep blue (#009BFF) to vivid cyan (#00FFF4), with no icons, no text and no windows, and it casts a soft cool glow onto the keyboard. The rest of the image stays bright, white and airy.

**If an edit drifts** (style, framing or brightness), re-attach frame 1 and say "match the style, framing and brightness of this reference image exactly".

---

## 7. Path A — ChatGPT only (free, recommended first)

1. Make frames 1–12 with the prompts above, aligning each in Photopea.
2. Save them as `film-01.png` … `film-12.png` in `Design/hero-frames/`.
3. Hand them to Claude. The site needs:
   - conversion to WebP at ~1600px wide (from ~2–3 MB each down to ~150 KB each, so ~1.8 MB for the whole film),
   - the 12 new file names in `ScrollFilm.tsx` (it already has 12 slots),
   - the 12 frame descriptions (alt text) in `messages/en.json` and `bn.json` rewritten to match the new story. The count stays the same.

**What it looks like:** a smooth dissolve through twelve poses, a clean, stylised, keynote-slide feel. With 12 poses instead of 6 the steps are smaller, so there's less ghosting between them. It isn't true motion.

---

## 8. Path B — Video prompts for your 12 keyframes (Kling or Higgsfield)

Your 12 keyframes are done (`research/keyframes for hero video/keyframe1–12.png`).

### How many clips? Two ways to do it
Image-to-video tools take **two images per clip**: a start frame and an end frame. The clip lands exactly on those two, and the model invents everything in between. So the question isn't "how long is the video". It's **"which keyframes do you want the video to actually pass through?"**

- **Video length doesn't matter on this site.** The film plays as fast or slow as the visitor scrolls, so a 5-second clip and a 12-second clip feel the same. Only the frames matter.
- **One clip, keyframe 1 → 12, won't work.** Frames 1 and 12 are almost the same picture: a whole laptop, with only the screen changed. Given just those two, the model's easiest path is to leave the laptop sitting there and light up the screen. It has no reason to take it apart.
- **Fewer clips = fewer credits, less control.** Each clip must start and end on keyframes, and any keyframes in between go unused in the video.

| Option | Clips | What the model invents | Best for |
|---|---|---|---|
| **Two clips** (recommended start) | **1 → 4** and **8 → 11** | The in-between layer positions (keyframes 2, 3, 9, 10). These are simple, continuous moves, which models handle well. | Tight budget |
| Full control | 11 clips, one per pair | Almost nothing; every keyframe is hit | Spare credits, or when a two-clip take keeps warping |

In the two-clip version, the battery swap with the hands (keyframes 4 → 8) and the screen waking (11 → 12) stay as cross-faded stills on the site. That's deliberate: hands are where AI video fails most, and a cross-fade already looks like a screen powering on.

**If a two-clip take keeps warping, split it** using keyframes you already have: 1 → 4 becomes 1 → 2 plus 2 → 4, and so on. That fallback is why making all 12 keyframes was worth it.

### The two-clip version (copy-paste ready)

**Settings for both clips:** image-to-video · **5 seconds each (10 seconds total)** · camera **none / static** · "enhance prompt" **off** · aspect ratio 3:2 or "match input" (16:9 is fine if forced).

The timings are guidance. The tool may not hit them exactly, and that's fine: the start and end images are what's fixed.

#### Clip A — coming apart
**Start frame:** `keyframe1.png` **End frame:** `keyframe4.png`

**Prompt:**
> 0–0.5s: The silver laptop rests completely still on the white desk, exactly as in the start image, its screen softly glowing.
> 0.5–2s: The display gently detaches from the hinge and floats slowly upward, straightening to face the camera. The keyboard deck lifts a few centimetres off the base. A few tiny silver screws rise and hover beside the layers.
> 2–3.5s: The layers keep separating upward. The logic board with its fans lifts away from the battery row, and the battery row separates below it. One battery cell begins to glow with a soft cyan outline.
> 3.5–4.5s: The trackpad floats free as its own layer between the battery row and the bottom case. All the layers settle into an evenly spaced exploded view, like an engineering diagram.
> 4.5–5s: Everything hovers calmly, matching the end image. The cyan battery cell keeps glowing.
> Throughout: bright white studio desk scene. The camera is completely locked, with no pan, zoom, tilt or shake. The background, the soft window-light shadows on the wall, the plant in its white pot, the pencil cup, the stacked books, the MacBook box and the small white object on the desk never move. Soft, even daylight that never changes. Slow, smooth, weightless motion. Every part stays sharp and keeps its exact shape, colour and count. One continuous shot, no cuts.

#### Clip B — coming together
**Start frame:** `keyframe8.png` **End frame:** `keyframe11.png`

**Prompt:**
> 0–0.5s: The exploded view of the silver laptop hovers completely still, exactly as in the start image. The new battery glows with a soft cyan outline.
> 0.5–2s: All the layers drift slowly down towards the base, closing the gaps between them to about half. Tiny silver screws drift inward towards their holes.
> 2–3.5s: The layers keep settling until they are only a few centimetres apart. The new battery seats into its place in the stack.
> 3.5–4.5s: The layers press together into one solid laptop. The display swings back onto the hinge and tilts to its open angle. The cyan glow fades away.
> 4.5–5s: The screen's pale glow warms into a soft light blue. The finished laptop rests completely still, matching the end image.
> Throughout: bright white studio desk scene. The camera is completely locked, with no pan, zoom, tilt or shake. The background, the soft window-light shadows on the wall, the plant in its white pot, the pencil cup, the stacked books, the MacBook box and the small white object on the desk never move. Soft, even daylight that never changes. Slow, smooth, weightless motion. Every part stays sharp and keeps its exact shape, colour and count. One continuous shot, no cuts.

#### Negative prompt (same for both clips)
> camera movement, zoom, pan, tilt, shake, cuts, scene change, fast motion, motion blur, flicker, lighting change, darker scene, dark background, moody lighting, props moving, background change, parts changing shape or colour, parts melting or merging, extra parts, duplicated parts, distorted logo, new text, icons on screen, hands, arms, people, faces

#### If your tool offers 6-second clips (6 + 6 = 12 seconds total)
Keep the prompts, and change the times to: **0–0.5s · 0.5–2.5s · 2.5–4s · 4–5.5s · 5.5–6s**.

Save the results as `clip-A.mp4` and `clip-B.mp4` in `research/keyframes for hero video/clips/`.

### Which tool
Either works, and the prompts are the same. Use whichever gives you more free generations of an image-to-video model that accepts **both a start frame and an end frame**. If the end-frame option isn't available on the free tier, use the start frame only and pick the take whose last frame looks most like the next keyframe.

### Settings for every clip
- **Image-to-video, 5 seconds** (the cheapest length; the site samples frames from it anyway).
- **Camera: none / static.** If the tool offers camera-movement presets (zoom, dolly, orbit and so on), choose none. A moving camera breaks the scroll film.
- **Turn off any "enhance prompt" / auto-rewrite option.** It rewrites your prompt and tends to add camera moves.
- If there's a slider between "creative" and "follow the prompt/image", lean towards **following**.
- **Aspect ratio:** your frames are 3:2. If the tool offers 3:2 or "match input image", use that. If it forces 16:9, it trims the top and bottom slightly, which is the same trim the site already makes, so that's acceptable.

### How to write each prompt
Every prompt = **the clip's motion prompt** + **the scene lock** (below, identical every time). Paste them together into the prompt box, and the matching negative prompt into the negative box.

**Scene lock (paste after every motion prompt):**
> Bright white studio desk scene. The camera is completely locked: no pan, no zoom, no tilt, no shake. The background, the soft window-light shadows on the wall, the plant in its white pot, the pencil cup, the stacked books, the MacBook box and the small white object on the desk stay perfectly still. Soft, even daylight that never changes. Slow, constant, weightless motion. Every part stays sharp and keeps its exact shape, colour and count. One continuous shot, no cuts.

**Negative prompt A — clips without hands:**
> camera movement, zoom, pan, tilt, shake, cuts, scene change, fast motion, motion blur, flicker, lighting change, darker scene, dark background, moody lighting, props moving, background change, parts changing shape or colour, parts melting or merging, extra parts, duplicated parts, distorted logo, new text, icons on screen, hands, arms, people, faces

**Negative prompt B — clips with hands (5→6, 6→7, 7→8):**
> camera movement, zoom, pan, tilt, shake, cuts, scene change, fast motion, motion blur, flicker, lighting change, darker scene, dark background, moody lighting, props moving, background change, parts changing shape or colour, parts melting or merging, extra parts, duplicated parts, distorted logo, new text, icons on screen, extra hands, extra fingers, deformed hands, faces, people

> The negatives say "distorted logo" and "new text" rather than "no logos, no text" on purpose. Your frames *contain* a logo (on the screen) and text (the MacBook box). A blanket "no logos" can make the model erase them halfway through a clip, and they'd pop back in the next one.

### The full version: one clip per pair of keyframes
Each clip animates **one pair of consecutive keyframes**: upload the first as the **start frame** and the next as the **end frame**. Small steps between tightly matched frames give the most control over every beat.

### The 11 clips

| Clip | Frames | Motion prompt | Negative | Priority |
|---|---|---|---|---|
| 1 | 1 → 2 | The laptop gently comes apart. The display detaches from the hinge and floats slowly upward, straightening to face the camera. The keyboard deck lifts a few centimetres off the base, revealing the internals below. A few tiny silver screws rise and hover beside the layers. The base stays where it is. | A | **1st** |
| 2 | 2 → 3 | The layers keep floating apart upward: the display rises higher, the keyboard deck lifts, the logic board with its fans separates, and the battery layer separates below it. As it does, one battery cell begins to glow with a soft cyan outline, as if a scanner has found the fault. Screws drift outward in a loose ring. | A | **1st** |
| 3 | 3 → 4 | The layers settle into a perfect, evenly spaced exploded view. The trackpad floats free as its own layer between the battery and the bottom case. The faulty battery cell keeps its soft cyan glow. Everything hovers calmly in order, like an engineering diagram. | A | **1st** |
| 4 | 4 → 5 | Only the faulty battery cell moves: glowing cyan, it slides slowly out of the battery row to the left, turning paler and more transparent, and leaves a clean empty gap. Every other part stays exactly where it is, hovering gently. | A | 2nd |
| 5 | 5 → 6 | The old battery fades away completely. Two hands in light-blue nitrile gloves and white lab-coat sleeves reach in smoothly from the right edge of the frame. One steadies the logic board; the other brings fine steel tweezers to the board and places a tiny component. Calm, precise, surgical movement. The floating parts stay still. | B | 3rd (risky) |
| 6 | 6 → 7 | The gloved hands move down from the logic board to the battery row. The tweezers are set aside, and the hands slide a fresh silver-grey battery smoothly into the empty gap. Slow, careful movement. No other part moves. | B | 3rd (risky) |
| 7 | 7 → 8 | The hands let go and withdraw smoothly out of the right side of the frame. The new battery stays in place, and a soft cyan glow traces its edges. The exploded view hovers calmly, perfectly ordered. | B | 3rd (risky) |
| 8 | 8 → 9 | All the layers drift slowly downward towards the base, closing the gaps between them to about half. The new battery, with its soft cyan glow, stays in its place in the stack. Screws drift inward towards their holes. | A | **1st** |
| 9 | 9 → 10 | The layers keep settling down until they are only a few centimetres apart. The display lowers towards the hinge, the keyboard deck nears the base, and the last screws hover just above their holes. | A | **1st** |
| 10 | 10 → 11 | The last gaps close and the layers press together into one solid laptop. The display swings back onto the hinge and tilts to its open angle. The cyan glow fades away. The screen's pale glow warms into a soft light blue. The finished laptop rests calmly on the desk. | A | **1st** |
| 11 | 11 → 12 | Only the screen and keyboard change: the pale blue screen brightens into a vivid blue-to-cyan flowing wave wallpaper, the keyboard backlight turns on with a soft blue glow, and a gentle blue reflection appears on the desk in front of the laptop. The screen shows only the abstract waves. Everything else stays perfectly still. | A | Optional |

**Where to spend limited credits:**
1. **Clips 1, 2, 3, 8, 9, 10:** the coming-apart and coming-together motion. This is the "wow", and what video models do best.
2. **Clip 4:** the old battery sliding out. No hands, so it's easy.
3. **Clips 5, 6, 7 (hands):** only if you have credits to spare. Hands are where AI video fails most. If they come out wrong, those three moments stay as cross-faded stills, and that looks intentional.
4. **Clip 11 (screen wakes):** a cross-fade between keyframes 11 and 12 already looks like a screen powering on, so this is the least necessary clip.

Clips 1 and 10 are the trickiest non-hand clips: in both, the display has to swing between "attached to the hinge at an angle" and "floating flat". If one warps, try it again with the prompt shortened to its first two sentences.

### Takes and quality checks
- Plan on **2–3 takes per clip**. Pick by: nothing warps or melts, props never move, the brightness stays the same, and the last frame looks like the next keyframe.
- Scrub each finished clip slowly by hand. The site pauses on random frames, so every frame must be sharp.
- **Check whether free-tier downloads carry a visible watermark before generating everything.** If they do, those clips can't go on the live site. The 12 stills can go live as they are in the meantime (§7).
- Free credits refresh daily, and free queues can be slow. Spread the clips over several days, the priority clips first.

### Hand-off
For the full version, save the clips as `clip-01.mp4` … `clip-11.mp4` in `research/keyframes for hero video/clips/` (the numbers match the table). Mixing is fine: any clip you skip, the film cross-fades between the two keyframes instead. Claude will then:
- pull frames from each clip (about 10–15 per clip, WebP) and join them in order, using the keyframe stills for any skipped clips,
- switch `ScrollFilm` from stacked `<img>` tags to drawing on a `<canvas>`, which it needs to handle that many frames smoothly,
- adjust the film's crop so the top of the floating display isn't trimmed on desktop (frames 3–8 place it very close to the top edge).

## 9. Checklist before anything goes on the site

- [ ] **Frame 1 works as a hero on its own**, and also with a pale wash over its top third and a centred title (laptop in the lower-centre, empty bright space above)
- [ ] **Frame 12 works as a hero on its own** (it's the only frame reduced-motion visitors see)
- [ ] No large dark areas anywhere: white or light-grey background, silver laptop, screen never black
- [ ] Frames 1, 11 and 12 line up exactly (toggle between them: only the screen changes)
- [ ] Every frame's laptop base sits in the same spot as frame 1, at the same brightness (Photopea 50% overlay)
- [ ] Laptop, parts, the old battery (5) and the hands (6–7) stay inside the centre half of the width (the mobile crop)
- [ ] The new battery (7–9) looks the same in every frame it appears in
- [ ] No logo, no text, no invented icons on the screen in any frame
- [ ] Hands never cover the centre of the laptop
- [ ] Path B only: no visible watermark; no part warps or multiplies; no darkening across the clip; scrub slowly by hand and every paused frame is sharp
