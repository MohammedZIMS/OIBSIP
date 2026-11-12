---
name: Artisan Pizza & Kitchen
colors:
  surface: '#f7f9ff'
  surface-dim: '#d0dbea'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e3effe'
  surface-container-high: '#dee9f8'
  surface-container-highest: '#d8e4f3'
  on-surface: '#111d27'
  on-surface-variant: '#5c403c'
  inverse-surface: '#26313d'
  inverse-on-surface: '#e8f2ff'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#be0c15'
  primary: '#8c0009'
  on-primary: '#ffffff'
  primary-container: '#b80311'
  on-primary-container: '#ffc4bd'
  inverse-primary: '#ffb4ab'
  secondary: '#ac3400'
  on-secondary: '#ffffff'
  secondary-container: '#ff6f3c'
  on-secondary-container: '#611a00'
  tertiary: '#703100'
  on-tertiary: '#ffffff'
  tertiary-container: '#944300'
  on-tertiary-container: '#ffc6a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000a'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390b00'
  on-secondary-fixed-variant: '#842600'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#763400'
  background: '#f7f9ff'
  on-background: '#111d27'
  surface-variant: '#d8e4f3'
  crust: '#E9C590'
  oven-orange: '#D76E25'
  crust-brown: '#9D5826'
  brick: '#9C2913'
  amber: '#E0983E'
  tomato: '#B80311'
  plum: '#5A1A35'
  pan: '#1D2833'
  basil: '#485D17'
  rust: '#C34413'
  parchment: '#FBF3E4'
  card: '#FFFFFF'
  line: '#E4D0AA'
  ink-muted: '#6B5A48'
  pan-raised: '#26333F'
  ink-muted-dark: '#B9A98C'
  tomato-soft: '#F08A7A'
  basil-soft: '#A9C46A'
typography:
  headline-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 54px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

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

---

## 8. Typography (companion to color)

| Role | Typeface | Weight | Notes |
|---|---|---|---|
| Display / headings | Bricolage Grotesque | 700 to 800 | Slightly irregular, friendly, food-menu energy |
| Body / UI | Hanken Grotesk | 400 / 500 / 600 | Neutral and highly legible |
| Prices / numbers | Hanken Grotesk, tabular figures | 600 | `font-variant-numeric: tabular-nums` so totals align |
