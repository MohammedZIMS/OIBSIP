# DESIGN.md: Pizza Delivery Platform

Color and UI design system for the customer app and the admin panel. The palette is taken from the supplied reference image (a baked pizza on a dark slate surface) and extended with a small set of derived neutrals so it works for real interfaces.

---

## 1. Design Intent

**Feel:** warm, appetising, direct. Colors come from what is actually on the pizza: baked crust, tomato, cheese, onion, basil and the dark pan it sits on.

**Principles**

1. **Tomato is the action color.** The one red in the UI means "do this" (order, pay, confirm). Nothing else is allowed to compete with it.
2. **Food gets the color, chrome stays quiet.** Pizza photos and the builder's ingredient cards carry the warmth; navigation, tables and forms stay on neutral surfaces.
3. **Color never works alone.** Every status uses an icon and a text label in addition to its color.
4. **Two moods, one palette.** The customer app is light and parchment-toned. The admin panel defaults to the dark "pan" theme for kitchen and low-light use. Both come from the same tokens.

---

## 2. Brand Palette (from the reference image)

| Token | Name | Hex | Food reference | Primary role |
|---|---|---|---|---|
| `--crust` | Crust | `#E9C590` | Pale baked edge | Warm surface tint, selected-card fill, text on dark plum/charcoal |
| `--orange` | Oven Orange | `#D76E25` | Browned cheese | Accent, highlights, focus ring, large display text |
| `--brown` | Crust Brown | `#9D5826` | Toasted crust | Borders on warm surfaces, secondary text accents |
| `--brick` | Brick | `#9C2913` | Deep sauce | Pressed/hover state for tomato, destructive confirmation |
| `--amber` | Cheese | `#E0983E` | Melted cheese | Badges, ratings, highlights on dark, "low stock" |
| `--tomato` | Tomato | `#B80311` | Fresh tomato | **Primary action**, errors, "out of stock" |
| `--plum` | Red Onion | `#5A1A35` | Red onion | Footer, hero band, deep accent surfaces |
| `--pan` | Pan | `#1D2833` | Dark slate surface | Primary text (light mode), base surface (dark mode) |
| `--basil` | Basil | `#485D17` | Green pepper, rosemary | Success, "in stock", vegetarian marker |
| `--rust` | Rust | `#C34413` | Paprika | Secondary action, "in kitchen" status, warm emphasis |

### Derived neutrals (added, not in the reference image)

| Token | Hex | Use |
|---|---|---|
| `--parchment` | `#FBF3E4` | Page background (light mode) |
| `--card` | `#FFFFFF` | Raised surfaces on parchment |
| `--line` | `#E4D0AA` | Hairline borders and dividers (decorative only, see §5) |
| `--ink-muted` | `#6B5A48` | Secondary text on light surfaces |
| `--pan-raised` | `#26333F` | Cards and tables on the dark theme |
| `--ink-muted-dark` | `#B9A98C` | Secondary text on dark surfaces |
| `--tomato-soft` | `#F08A7A` | Error text on dark surfaces |
| `--basil-soft` | `#A9C46A` | Success text on dark surfaces |

---

## 3. Semantic Tokens

### 3.1 Light theme (customer default)

| Semantic token | Value | Notes |
|---|---|---|
| `--bg` | `--parchment` | Page |
| `--surface` | `--card` | Cards, modals, inputs |
| `--surface-warm` | `--crust` at 35% | Selected builder options, summary highlights |
| `--text` | `--pan` | Body and headings |
| `--text-muted` | `--ink-muted` | Helper text, timestamps |
| `--border` | `--line` | Dividers; inputs use `--brown` (see §5) |
| `--primary` | `--tomato` | Primary buttons, links on action |
| `--primary-hover` | `--brick` | Hover and pressed |
| `--on-primary` | `#FFFFFF` | Text on primary |
| `--secondary` | `--rust` | Secondary buttons (filled) |
| `--accent` | `--orange` | Decorative accent, focus ring, big numerals |
| `--link` | `--brick` | Inline links |
| `--success` | `--basil` | In stock, verified, delivered |
| `--warning` | `--amber` | Low stock (use `--pan` text on it) |
| `--danger` | `--tomato` | Errors, out of stock |
| `--hero-bg` | `--plum` | Hero and footer bands, text `--crust` |

### 3.2 Dark theme (admin default, optional for customers)

| Semantic token | Value |
|---|---|
| `--bg` | `--pan` |
| `--surface` | `--pan-raised` |
| `--surface-warm` | `--plum` at 55% |
| `--text` | `--parchment` |
| `--text-muted` | `--ink-muted-dark` |
| `--border` | `rgba(233,197,144,0.18)` (crust at 18%) |
| `--primary` | `--tomato` (button fill, white text) |
| `--primary-hover` | `--rust` |
| `--accent` / `--link` | `--amber` |
| `--success` (text) | `--basil-soft` |
| `--danger` (text) | `--tomato-soft` |
| `--warning` | `--amber` |

---

## 4. Contrast Reference (WCAG 2.1, calculated)

Normal text needs 4.5:1, large text (24 px, or 19 px bold) and UI components need 3:1.

### Approved pairings

| Foreground | Background | Ratio | Use |
|---|---|---|---|
| `--pan` | `--parchment` | 13.6 | Body text |
| `--pan` | `--crust` | 9.2 | Text on warm fills |
| `--pan` | `--amber` | 6.2 | Low-stock badge text |
| `--pan` | `--orange` | 4.4 | Large text only (3:1 passes; 4.5 narrowly misses) |
| `#FFFFFF` | `--tomato` | 6.9 | Primary button |
| `#FFFFFF` | `--brick` | 7.7 | Primary hover |
| `#FFFFFF` | `--rust` | 5.1 | Secondary button |
| `#FFFFFF` | `--brown` | 5.4 | Tags, chips |
| `#FFFFFF` | `--basil` | 7.4 | Success badge |
| `#FFFFFF` | `--plum` | 12.9 | Hero band, footer |
| `--crust` | `--plum` | 7.9 | Text on plum |
| `--amber` | `--plum` | 5.3 | Accent text on plum |
| `--brick` | `--parchment` | 7.0 | Links on light |
| `--basil` | `--parchment` | 6.7 | Success text on light |
| `--ink-muted` | `--parchment` | 6.0 | Secondary text |
| `--parchment` | `--pan-raised` | 11.7 | Body text, dark theme |
| `--crust` | `--pan-raised` | 7.9 | Headings, dark theme |
| `--amber` | `--pan` | 6.2 | Links and accents on dark |
| `--tomato-soft` | `--pan` | 6.1 | Error text on dark |
| `--basil-soft` | `--pan` | 7.7 | Success text on dark |

### Do not use

| Pairing | Ratio | Why |
|---|---|---|
| `--orange` text on `--parchment` or `--crust` | 2.1 | Too low for any text |
| `--tomato` text on `--pan` | 2.2 | Use `--tomato-soft` instead |
| `--basil` text on `--pan` | 2.0 | Use `--basil-soft` instead |
| `#FFFFFF` on `--amber` or `--crust` | 2.4 / 1.6 | Use `--pan` text |
| `--rust` or `--brown` text on `--crust` | about 3.1 to 3.3 | Large text only |
| `#FFFFFF` on `--orange` | 3.4 | Large or bold 19 px+ only |

---

## 5. Usage Rules

**Primary action.** One filled `--tomato` button per view (Place order, Pay now, Save). Secondary actions are outlined in `--brown` or filled `--rust`. Destructive confirmations (delete item) use `--brick`.

**Borders and inputs.** `--line` is decorative only (contrast 1.4:1). Form fields, checkboxes and anything a person must locate need a 3:1 edge: use `--brown` (about 4.9:1 on parchment) for input borders in light mode and `rgba(233,197,144,0.55)` in dark mode.

**Focus ring.** 3 px outline, 2 px offset. Light theme: `--plum`. Dark theme: `--amber`. Never remove outlines without replacement.

**Hover and press.** Tomato to Brick on hover; Brick darkens a further 8% on press. Disabled: 40% opacity with `not-allowed` cursor and a visible "unavailable" label, never color alone.

**Large decorative color.** `--orange`, `--amber` and `--crust` may fill large shapes, illustration backgrounds and the progress track, as long as any text on them uses `--pan`.

**Restraint.** In any single screen, at most one saturated color dominates (tomato or plum), with orange or amber as a supporting accent. Do not combine tomato, orange and amber as adjacent equal-weight fills.

---

## 6. Status Color Mapping

### 6.1 Order tracking (customer dashboard and admin)

The warm-to-green sequence mirrors the pizza's journey from raw to ready.

| Status | Color | Icon | Label | Badge style |
|---|---|---|---|---|
| Order Received | `--amber` | receipt | Order received | `--pan` text on `--amber` |
| In Kitchen | `--rust` | flame | In kitchen | White text on `--rust` |
| Sent to Delivery | `--basil` | scooter | Sent to delivery | White text on `--basil` |
| Payment pending | `--brown` | clock | Payment pending | White text on `--brown` |
| Needs review (admin) | `--tomato` | alert | Needs review | White text on `--tomato` |

**Progress stepper:** completed steps are filled with their status color; the current step has a 3 px `--plum` ring and a gentle pulse (respect `prefers-reduced-motion`); future steps use an outlined `--brown` circle. The connecting track is `--line` and fills with `--orange` as the order advances.

### 6.2 Inventory (admin)

| State | Color | Icon | Label |
|---|---|---|---|
| In stock (at or above threshold) | `--basil` | check | In stock |
| Low (below threshold) | `--amber` | warning | Low |
| Out (0) | `--tomato` | x-circle | Out of stock |

Stock bars use the same three colors. Rows in "Low" or "Out" state get a 4 px left edge in the state color so they can be scanned without reading.

### 6.3 Ingredient markers (builder)

| Marker | Color |
|---|---|
| Vegetarian | `--basil` dot with leaf icon |
| Spicy | `--tomato` dot with flame icon |
| Unavailable | Greyed card, `--ink-muted` text, "Out of stock" label |

---

## 7. Component Guidance

| Component | Light theme | Dark theme |
|---|---|---|
| **Top bar** | `--parchment` background, `--pan` text, 1 px `--line` bottom border; cart count badge in `--tomato` | `--pan` background, `--crust` text |
| **Hero band** | `--plum` background, `--crust` headline, `--amber` secondary text, tomato CTA with white text | Same |
| **Pizza card** | `--card`, 1 px `--line`, price in `--pan` bold, tomato "Add" button; "Unavailable" overlay uses 60% `--parchment` | `--pan-raised`, no border, amber price |
| **Builder option card** | Default: `--card` + `--brown` 1 px border. Selected: `--crust` 35% fill, 2 px `--plum` border, check icon top-right | Selected: `--plum` 55% fill, 2 px `--amber` border |
| **Builder progress** | 4 segments; done = `--plum`, current = `--orange`, upcoming = `--line` | done = `--amber`, upcoming = rgba crust 18% |
| **Order summary** | `--surface-warm` panel, total row in bold `--pan`, "Pay now" in tomato | Same with dark tokens |
| **Inputs** | `--card` fill, `--brown` border, 2 px `--plum` focus border plus ring | `--pan-raised` fill, crust 55% border, `--amber` focus |
| **Toasts** | Success: `--basil` bg, white text. Error: `--tomato` bg, white text. Info: `--plum` bg, `--crust` text | Same |
| **Tables (admin)** | Header `--crust` 35%, row hover `--parchment`, zebra off | Header `--pan-raised`, row hover rgba crust 6% |
| **Low-stock email** | Parchment body, plum header band with crust text, amber table header with `--pan` text, brick link color | n/a (email clients default to light) |

---

## 8. Typography (companion to color)

| Role | Typeface | Weight | Notes |
|---|---|---|---|
| Display / headings | Bricolage Grotesque | 700 to 800 | Slightly irregular, friendly, food-menu energy |
| Body / UI | Hanken Grotesk | 400 / 500 / 600 | Neutral and highly legible |
| Prices / numbers | Hanken Grotesk, tabular figures | 600 | `font-variant-numeric: tabular-nums` so totals align |

Fallback stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

Scale (rem): 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.25 · 3. Body 1 rem / 1.55 line height. Keep lines under 70 characters. Use sentence case for all labels and buttons; avoid all-caps tracked labels.

---

## 9. Shape, Elevation and Motion

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6 px | Inputs, badges |
| `--radius-md` | 12 px | Buttons, cards |
| `--radius-lg` | 20 px | Hero panels, modals |
| `--radius-pill` | 999 px | Status chips, quantity stepper |
| `--shadow-card` | `0 1px 2px rgba(29,40,51,.08), 0 6px 16px rgba(29,40,51,.06)` | Light-theme cards (pan-tinted, not neutral grey) |
| `--shadow-pop` | `0 12px 32px rgba(90,26,53,.22)` | Modals, dropdowns (plum-tinted) |
| Dark theme | No shadows; separate layers by surface lightness | |

Motion: 150 to 200 ms ease-out for state changes. Motion should respond to what the person did (selecting an ingredient, a status advancing) rather than animate on page load. Respect `prefers-reduced-motion` by removing pulses and slides.

---

## 10. Implementation

### 10.1 CSS variables

```css
:root {
  /* brand */
  --crust: #E9C590;
  --orange: #D76E25;
  --brown: #9D5826;
  --brick: #9C2913;
  --amber: #E0983E;
  --tomato: #B80311;
  --plum: #5A1A35;
  --pan: #1D2833;
  --basil: #485D17;
  --rust: #C34413;

  /* derived */
  --parchment: #FBF3E4;
  --card: #FFFFFF;
  --line: #E4D0AA;
  --ink-muted: #6B5A48;
  --pan-raised: #26333F;
  --tomato-soft: #F08A7A;
  --basil-soft: #A9C46A;

  /* semantic: light */
  --bg: var(--parchment);
  --surface: var(--card);
  --surface-warm: rgba(233, 197, 144, 0.35);
  --text: var(--pan);
  --text-muted: var(--ink-muted);
  --border: var(--line);
  --input-border: var(--brown);
  --primary: var(--tomato);
  --primary-hover: var(--brick);
  --on-primary: #FFFFFF;
  --secondary: var(--rust);
  --accent: var(--orange);
  --link: var(--brick);
  --success: var(--basil);
  --warning: var(--amber);
  --danger: var(--tomato);
  --focus: var(--plum);
  --hero-bg: var(--plum);
  --on-hero: var(--crust);

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --shadow-card: 0 1px 2px rgba(29, 40, 51, .08), 0 6px 16px rgba(29, 40, 51, .06);
  --shadow-pop: 0 12px 32px rgba(90, 26, 53, .22);
  color-scheme: light;
}

/* Dark: follows the OS unless the app forces a theme */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: var(--pan);
    --surface: var(--pan-raised);
    --surface-warm: rgba(90, 26, 53, 0.55);
    --text: var(--parchment);
    --text-muted: var(--ink-muted-dark, #B9A98C);
    --border: rgba(233, 197, 144, 0.18);
    --input-border: rgba(233, 197, 144, 0.55);
    --primary-hover: var(--rust);
    --link: var(--amber);
    --accent: var(--amber);
    --success: var(--basil-soft);
    --danger: var(--tomato-soft);
    --focus: var(--amber);
    --shadow-card: none;
    --shadow-pop: 0 12px 32px rgba(0, 0, 0, .45);
    color-scheme: dark;
  }
}

/* Admin panel and explicit toggle */
:root[data-theme="dark"] {
  --bg: var(--pan);
  --surface: var(--pan-raised);
  --surface-warm: rgba(90, 26, 53, 0.55);
  --text: var(--parchment);
  --text-muted: #B9A98C;
  --border: rgba(233, 197, 144, 0.18);
  --input-border: rgba(233, 197, 144, 0.55);
  --primary-hover: var(--rust);
  --link: var(--amber);
  --accent: var(--amber);
  --success: var(--basil-soft);
  --danger: var(--tomato-soft);
  --focus: var(--amber);
  --shadow-card: none;
  --shadow-pop: 0 12px 32px rgba(0, 0, 0, .45);
  color-scheme: dark;
}

body { background: var(--bg); color: var(--text); }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
```

Note: define `--ink-muted-dark: #B9A98C;` in `:root` if you prefer the variable form used in the first dark block.

### 10.2 Tailwind config

```js
// tailwind.config.js
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        crust: '#E9C590',
        oven: '#D76E25',
        toast: '#9D5826',
        brick: '#9C2913',
        cheese: '#E0983E',
        tomato: '#B80311',
        onion: '#5A1A35',
        pan: { DEFAULT: '#1D2833', raised: '#26333F' },
        basil: { DEFAULT: '#485D17', soft: '#A9C46A' },
        rust: '#C34413',
        parchment: '#FBF3E4',
        line: '#E4D0AA',
        ink: { muted: '#6B5A48', dark: '#B9A98C' },
        'tomato-soft': '#F08A7A',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '6px', md: '12px', lg: '20px' },
      boxShadow: {
        card: '0 1px 2px rgba(29,40,51,.08), 0 6px 16px rgba(29,40,51,.06)',
        pop: '0 12px 32px rgba(90,26,53,.22)',
      },
    },
  },
};
```

### 10.3 Status badge helper (React)

```jsx
const STATUS = {
  order_received:   { label: 'Order received',   bg: 'bg-cheese text-pan',   icon: 'Receipt' },
  in_kitchen:       { label: 'In kitchen',       bg: 'bg-rust text-white',   icon: 'Flame' },
  sent_to_delivery: { label: 'Sent to delivery', bg: 'bg-basil text-white',  icon: 'Bike' },
  pending_payment:  { label: 'Payment pending',  bg: 'bg-toast text-white',  icon: 'Clock' },
};
```

---

## 11. Accessibility Checklist

- [ ] All text meets the pairings in §4; nothing uses a "Do not use" combination.
- [ ] Every status, stock state and error has an icon and a text label, not color alone.
- [ ] Form field borders and focus indicators are at least 3:1 against their background.
- [ ] Focus is visible on every interactive element in both themes.
- [ ] Hit targets are at least 44 × 44 px on mobile.
- [ ] Pulse and slide animations are disabled under `prefers-reduced-motion`.
- [ ] Test the order stepper and inventory bars with a color-blindness simulator: the amber/rust/basil sequence differs in lightness and each step carries an icon.
- [ ] Verify email and low-stock alert templates in Gmail, Outlook and dark-mode clients; use inline hex values, since CSS variables are not supported there.

---

## 12. Do and Don't

| Do | Don't |
|---|---|
| Keep Tomato for the single main action | Use Tomato for decoration or multiple competing buttons |
| Let food photography sit on parchment or plum | Place photos on saturated orange or amber fills |
| Use Pan (dark slate) text on Amber and Orange | Put white text on Amber, Crust or Orange at body size |
| Pair a status color with an icon and a label | Rely on color to separate "low" from "out" |
| Tint shadows with Pan or Plum | Use flat neutral grey shadows |
| Use Plum for deep, rich surfaces | Use Plum for text on Pan (contrast too low) |
