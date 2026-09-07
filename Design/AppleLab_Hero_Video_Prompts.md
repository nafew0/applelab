# Apple Lab — Hero Video Prompt Kit
**Deliverable:** 15-second scroll-scrubbed hero video (MacBook dissolves into parts → technician's hands repair → parts fly back → device comes alive).
**Pipeline:** Keyframe images (AI image model) → Seedance image-to-video (3 × 5s segments, first-frame + last-frame mode) → stitch → scroll-scrub implementation.

---

## 1. Why the prompts look the way they do (scroll-scrub constraints)

A scroll video is not a normal video. The user's scroll position *is* the playhead, so:

1. **One continuous shot. Zero cuts.** A cut reads as a glitch when scrubbed.
2. **Every frame must be sharp.** Scrubbing pauses on arbitrary frames — motion blur looks broken. All prompts specify crisp, high-shutter, no-blur rendering.
3. **Motion must be evenly paced.** No sudden accelerations; scrubbing amplifies speed changes. Slow, constant, "underwater ballet" motion throughout.
4. **Locked or near-locked camera.** One very slow drift at most. Fast camera moves + scrubbing = nausea.
5. **First and last frames are posters.** Frame 1 is what visitors see before scrolling; frame 450 is the resting hero. Both must be composition-perfect on their own.
6. **Direction-agnostic.** Users scroll up too — the motion must look intentional in reverse. (Bonus: this lets us *generate* hard segments backwards and flip them — see §6.)

**Format:** 16:9, 1080p minimum (upscale to 4K if budget allows), 30fps. Desktop crop ~21:9 from the 16:9 master (keep all action in the center 70% vertically — treat top/bottom 15% as croppable). Mobile 4:5 recrop later.

---

## 2. Storyboard — 15 seconds, 3 Seedance segments

| Time | Segment | Action | Boundary keyframes |
|---|---|---|---|
| 0–5s | **A. Dissolve** | Assembled MacBook (open, dead black screen) rests on seamless studio surface. It rises a few centimeters and silently separates into an exploded-view constellation — display panel lifts away, keycaps float up in a grid, logic board slides out, battery cells fan apart, screws spiral outward. | K1 → K2 |
| 5–10s | **B. The craft** | The constellation hangs, slowly drifting. A technician's hands (black nitrile gloves) enter from the right with fine tweezers, steady the logic board, seat one tiny component. A glint of the brand gradient (#009BFF→#00FFF4) sweeps across the aluminum. | K2 → K3 |
| 10–15s | **C. Reassembly & wake** | Hands withdraw. Parts glide home in reverse-explosion choreography — screws first, board, keys, display last. The chassis seals. Beat of stillness. The screen ignites with a soft blue-to-cyan gradient glow. Final resting frame. | K3 → K4 |

---

## 3. Master style block (append to EVERY image prompt)

> …ultra-premium tech commercial photography, in the visual language of a flagship laptop launch film. Seamless light-gray studio cyclorama background (#F5F5F7) fading to soft white, no horizon line, no props. Soft diffused key light from above-left, gentle cool rim light with a faint blue-to-cyan tint on metal edges. Space-gray anodized aluminum unibody laptop, plain lid with no logo or markings. Centered composition, camera at 15 degrees above horizontal, 85mm lens look, mild depth of field with the device tack-sharp. Photorealistic, 8k detail, crisp edges, no motion blur, no text, no watermark, no people visible except where specified. Aspect ratio 16:9.

**Notes**
- **Logo-less lid, on purpose:** image models mangle logos, and a generic unibody keeps you clear of trademark issues in generated footage. Nobody misses it at hero scale.
- Keep the **same seed / style reference** across all four keyframes if your tool supports it.
- Generate **K1 first**, then create K2–K4 by *editing* K1 with an image-edit model (Nano Banana / Seedream edit: "same scene, same laptop, same lighting, now…"). Edit-derivation preserves identity far better than four fresh generations.

---

## 4. Keyframe image prompts

### K1 — 0s — "Asleep" (also the pre-scroll poster)
> An open space-gray aluminum laptop resting on the studio floor, lid open at 110 degrees, screen completely black and unlit, keyboard facing the camera slightly angled. The machine looks intact but lifeless — a device waiting to be brought back. Absolute stillness, museum-like presentation. + *[style block]*

### K2 — 5s — "Exploded constellation"
> The same laptop mid-air, fully disassembled into a precise exploded-view constellation floating above the studio floor: the display panel hovering highest, separated from the lid; the full keycap grid suspended in perfect formation a few centimeters above the deck; the green-and-gold logic board floating clear of the chassis; flat black battery cells fanned apart; a trackpad, speaker grilles, ribbon cables and a spiral of tiny screws orbiting the assembly. Every part evenly spaced, engineering-diagram order, nothing chaotic. Soft shadows of the parts pool on the floor beneath. + *[style block]*

### K3 — 10s — "The technician's touch"
> The same floating exploded-view constellation, but the parts have drifted slightly closer together, beginning to align. From the right edge of frame, two hands in black nitrile gloves reach in: one steadies the floating logic board, the other holds fine stainless tweezers placing a tiny component onto the board. A subtle glint of blue-to-cyan light reflects along the aluminum edges. The hands are the only human element — forearms exit frame right, no face, no body. + *[style block]*

### K4 — 15s — "Alive" (the resting hero frame)
> The same laptop fully reassembled in the exact position and angle of the first frame, lid open at 110 degrees — but now the screen is on, glowing with a smooth abstract gradient wallpaper flowing from deep blue (#009BFF) to bright cyan (#00FFF4), casting a faint cool glow onto the keyboard. The machine looks flawless, factory-new, quietly powerful. No icons or text on the screen, just the gradient. + *[style block]*

**Optional insurance frames** (generate if segments drift): K2.5 — constellation alone rotated ~5°, for retrying segment B; K3.5 — laptop 80% assembled, only display panel still floating, screen dark, for splitting segment C in two.

---

## 5. Seedance segment prompts (image-to-video, first + last frame)

Settings per segment: **5 seconds · 1080p · 30fps · camera: fixed.** Feed the two keyframes as first-frame and last-frame references. Keep the text prompt focused on *motion*, since the images already carry the look.

### Segment A (K1 → K2) — "Dissolve"
> The laptop rises a few centimeters off the floor and silently separates into a floating exploded view: the display panel lifts away from the lid, keycaps float upward in unison keeping their grid, the logic board slides out and hovers, battery cells fan apart, tiny screws drift outward in a slow spiral. Constant, slow, weightless motion like an engineering diagram coming apart underwater. Camera locked. Every part stays sharp, no motion blur, no cuts, seamless single shot, studio lighting unchanged.

### Segment B (K2 → K3) — "The craft"
> The floating parts drift very slowly, rotating a few degrees, holding their exploded formation. Two hands in black nitrile gloves enter smoothly from the right side of frame; one hand gently steadies the floating logic board while the other uses fine tweezers to place a tiny component onto the board. A soft blue-to-cyan light glint sweeps across the aluminum edges. Calm, precise, surgical movement. Camera locked, no cuts, no motion blur, lighting unchanged, hands never occlude the center of frame at the final moment.

### Segment C (K3 → K4) — "Reassembly & wake"
> The gloved hands release the board and withdraw smoothly out of frame right. All floating parts glide back into place in reverse-explosion choreography: screws first, then the logic board and battery seat into the chassis, keycaps settle into the deck in unison, and finally the display panel lowers and joins the lid as the laptop descends softly onto the floor. A brief moment of stillness, then the screen illuminates with a smooth blue-to-cyan gradient glow that gently lights the keyboard. Slow, constant, weightless motion. Camera locked, single seamless shot, no cuts, no motion blur, crisp frames throughout.

### Negative prompt (all segments)
> cuts, scene change, camera shake, camera zoom, fast motion, motion blur, flickering lighting, background change, extra hands, faces, people, text, logos, watermark, parts changing shape or color, duplicated parts, dropped parts

---

## 6. Practical tricks & rescue paths

1. **Assembly is harder than disassembly for video models.** If Segment C comes out mushy, generate it *backwards* — prompt it as K4 → K3 ("the glowing laptop dims, lifts, and separates into parts as hands enter") and reverse the clip in editing. Scroll videos are direction-agnostic, so reversed footage is undetectable.
2. **Chain integrity:** if Seedance's output last-frame drifts from your keyframe, use the *actual rendered last frame* of segment N as the first-frame reference of segment N+1 (instead of the ideal keyframe) — continuity beats fidelity.
3. **Generate 3–4 takes per segment** and pick for: part consistency (no morphing keycaps), even pacing, and how closely the final frame matches the next segment's start.
4. **The screen-on moment** (last ~1.5s of C) sometimes triggers UI hallucinations. The negative prompt's "no text" guards this; if icons appear anyway, mask the screen and composite the gradient in post — it's a flat rectangle, a 10-minute fix.
5. **Stitching:** trim any duplicated boundary frames, then check the cut points frame-by-frame at 25% speed — scrubbing will expose any pop you'd never see at full speed.
6. **Export for scroll-scrub:** deliver (a) an H.265/AV1 MP4 with keyframe interval = 1 (every frame seekable) for video-scrub implementations, and (b) a JPEG/WebP frame sequence (450 frames, ~80% quality) for canvas-based implementations — we'll pick the method during the build. Poster image = K4.

---

## 7. QA checklist before hand-off to the site build

- [ ] Frame 1 and frame 450 both hold up as static hero posters
- [ ] No visible cuts or lighting jumps at 5s and 10s boundaries
- [ ] Scrub test: drag through timeline by hand — every pause frame sharp, no blur smearing
- [ ] Reverse-play test: motion looks intentional backwards
- [ ] Center 70% vertical safe-zone holds all action (for the 21:9 desktop crop)
- [ ] No logos, no text, no hallucinated UI on the screen
- [ ] Parts count consistent across segments (keycaps don't multiply)
- [ ] File under ~8 MB for the MP4 route (or frame sequence lazy-loaded)
