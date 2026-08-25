# Vendari — Frontend Design System (Copilot Persistent Instructions)

This file is Copilot's permanent style guide for this repository. Place it at
`.github/copilot-instructions.md` in the project root — GitHub Copilot (Chat and Agent mode)
reads it automatically on every request in this repo, so you never have to re-paste design
rules again. Treat every rule below as binding unless a specific prompt explicitly overrides it.

Owner: Emmanuel Abiodun Oladipo — Senior Developer & CTO, Vendari.

---

## 1. Brand foundation

Vendari's mark is a "V" built from two overlapping forms: a solid navy chevron (the business,
grounded and stable) and a lighter blue-to-violet flag/sail shape cutting across it (motion,
growth, intelligence). Every design decision below extends that idea — grounded dark surfaces
with a single confident gradient accent — rather than decorating on top of it.

**Do not use:** cream/beige backgrounds, terracotta/orange accents, generic acid-green-on-black,
zero-border-radius "newspaper" layouts, or any look that could belong to any other SaaS product.
Those are the current default AI-generated design clichés — Vendari must not read as one of them.

## 2. Color tokens (sampled directly from the logo — do not substitute)

```css
:root {
  /* Core brand */
  --ink:            #06122B;  /* logo navy — primary text, dark surfaces, sidebar */
  --ink-soft:       #0F1D3D;  /* elevated dark surfaces, cards on dark */
  --blue:           #4683EC;  /* logo mid-blue — primary interactive color */
  --violet:         #4954F1;  /* logo top accent — gradient partner, highlights */
  --brand-gradient: linear-gradient(135deg, var(--blue) 0%, var(--violet) 100%);

  /* Neutrals */
  --bg:             #F7F9FC;  /* page background, light mode */
  --surface:        #FFFFFF;  /* cards, panels */
  --border:         #E3E8F1;
  --text-primary:   #0B1220;
  --text-secondary: #4B5768;
  --text-muted:     #8792A2;

  /* Functional (data only — never decorative) */
  --positive:       #16A34A;  /* up-trend figures */
  --negative:       #DC2626;  /* low-stock, down-trend, destructive actions */
  --warning:        #D97706;  /* pending/attention states */
}
```

Never introduce a new hue outside this list without updating this file first. The gradient
(`--brand-gradient`) is the one bold, memorable device — use it deliberately (hero background
shapes, primary CTA, active nav state, chart line) and nowhere else. If everything is gradient,
nothing is.

## 3. Typography

- **Display (headlines, hero, section titles):** `Space Grotesk` — geometric, confident,
  slightly technical, distinct from the Inter/system-ui that most SaaS sites default to. Weight
  600–700 for headlines. Import via `next/font/google`.
- **Body (paragraphs, UI labels, nav):** `Inter` — but set at a slightly tighter line-height
  (1.5) and never lighter than weight 400, so it doesn't read as a generic default.
- **Data / numbers (dashboard figures, currency, tables):** `IBM Plex Mono` for anything
  tabular — sales totals, percentages, stock counts. Tabular figures in a mono face is what
  makes a dashboard feel precise rather than templated; this is a deliberate, non-default choice.

Type scale (use CSS clamp for fluid sizing, don't hardcode single px values):
- Hero H1: `clamp(2.75rem, 5vw, 4.5rem)`, Space Grotesk 700
- Section H2: `clamp(2rem, 3vw, 2.75rem)`, Space Grotesk 600
- Card/component H3: `1.25rem`, Space Grotesk 600
- Body: `1rem`, Inter 400, line-height 1.6
- Small/caption: `0.875rem`, Inter 500

## 4. Layout & structure

- Corner radius: `12px` for cards, `8px` for buttons/inputs, `24px` for large hero panels —
  consistent, never mixed with sharp corners in the same view.
- Section rhythm: generous vertical spacing (`96–140px` between major landing-page sections on
  desktop) — the current flyer's cramped stacked-section feel is exactly what we're fixing.
  Give the design room to breathe.
- Dashboard shell: dark `--ink` sidebar (matches the flyer's dark dashboard panel), light
  `--bg` content area — this contrast is already working in the reference flyer, keep it.
- Grid: 12-column, `max-width: 1280px` container on marketing pages; dashboard content area is
  fluid within the sidebar layout.

## 5. Motion — deliberate, not decorative

One orchestrated moment beats scattered effects. Specifically:

- **Page load (landing page only):** hero headline and dashboard mockup fade+rise in a staged
  sequence (headline first, then subhead, then the product screenshot, ~80ms stagger). Use
  `framer-motion`.
- **Scroll reveals:** each landing-page section fades+rises into view once, triggered at 20%
  viewport intersection. Do not repeat the animation on scroll-back-up.
- **Hover micro-interactions:** buttons and cards get a subtle `translateY(-2px)` + shadow
  increase on hover, 150ms ease-out. Nothing bouncier than that — this is a business tool, not
  a consumer app.
- **Dashboard data:** numbers count up from 0 on first render (use a lightweight count-up hook),
  chart lines draw in over ~600ms. This is the one place a slightly more elaborate animation is
  justified, because it reinforces "your real numbers, computed live."
- **Respect `prefers-reduced-motion`** everywhere — disable count-ups, staggers, and scroll
  reveals (show final state immediately) when it's set.

Never animate for its own sake. If a motion doesn't clarify hierarchy, state change, or draw
attention to something that matters, cut it.

## 6. Voice & copy rules

Write from the business owner's side of the screen, not the system's:

- Say "Track what's low before it runs out," not "Real-time inventory synchronization."
- Every feature description answers "what does this let me stop worrying about," not "what
  technology powers this."
- Buttons say the action, not a generic verb: "See your dashboard," not "Submit" or "Get
  Started" alone without context where a more specific label fits.
- No filler adjectives ("revolutionary," "seamless," "cutting-edge"). Specific beats clever.
- Empty states and errors are direction, not apology: "No sales yet this week — record your
  first sale to see it here," not "Oops, nothing to show."

## 7. Component patterns to reuse across the whole app

- **Stat card:** label (Inter, muted) → big number (IBM Plex Mono) → trend delta (colored,
  positive/negative tokens only, never brand blue for trend).
- **Primary button:** `--brand-gradient` background, white text, `8px` radius, hover lift.
- **Secondary button:** `--ink` border, transparent background, `--ink` text.
- **Nav active state:** left border or background using `--brand-gradient`, not a flat color —
  this is the one recurring "signature" touch tying every screen back to the logo mark.

---

Copilot: when a prompt in the accompanying `VENDARI_FRONTEND_REDESIGN_PROMPTS.md` file asks you
to build or restyle a page, apply every rule above without being re-told. If a specific prompt
conflicts with this file, the specific prompt wins for that task only — this is the default, not
an override.
