# Capyra Design System

**Capyra** is a short-video analysis platform that helps agencies, creators, and internal teams turn public URLs or uploaded files into structured insights, evidence, recommendations, and shareable reports — across Instagram, TikTok, and YouTube Shorts.

## Source

- **Repository:** `ebsj/capyra` (GitHub) — full monorepo
- **Marketing site:** `apps/site` — Next.js, localized PT-BR/EN/ES, public at `capyra.co`
- **Authenticated web app:** `apps/web` — Next.js App Router, private workspace
- **Design and brand source of truth:** `docs/design/` — canonical design system, tokens, approved assets, UI kits, and runtime-facing summaries
- No Figma link was provided. All design context was derived from source code.

## Products

| Product | Stack | Surface |
|---|---|---|
| `apps/site` | Next.js + Tailwind | Marketing site, PT-BR/EN/ES |
| `apps/web` | Next.js App Router + shadcn/ui | Authenticated analysis workspace |
| `apps/api` | Cloudflare Worker / Hono | Backend API |
| `apps/ai` | Python | Internal AI analysis service |
| `apps/mcp` | Cloudflare Worker/TS | MCP server for ChatGPT, Claude, etc. |
| `apps/cli` | Node/TS | Public CLI `@capyra/cli` |

---

## CONTENT FUNDAMENTALS

### Language
- **Primary:** PT-BR. **Secondary:** EN. Both share the same visual system; only the language changes.
- Copy is written in first person plural from the brand's perspective ("Capyra analisa…") and second person singular to users ("Veja o que exige ação agora").

### Tone
- **Clear, useful, action-oriented.** No abstract AI hype.
- Positions Capyra as a structured-reading and evidence tool.
- CTAs are short and direct: "Enviar arquivo", "Abrir detalhe", "Ver histórico".
- Kickers use ALL CAPS with wide letter-spacing (tracking-[0.24em]): "ANÁLISE DE VÍDEO", "PUBLIC REPORT".
- Headlines use `text-balance` for clean wrapping. They are declarative and specific, not vague.

### Casing
- UI labels: Title Case in English, Sentence case in PT-BR.
- Kickers: ALL CAPS always, both languages.
- Nav: Sentence case ("Análises", "Dashboard").

### Emoji
- **Not used.** No emoji in UI or copy.

### Examples
- "Priorize o que precisa de ação sem perder a procedência do histórico."
- "Leitura rápida de status, origem e recência com filtros leves."
- "Crie a primeira análise para ver status, procedência e recência organizados nesta superfície."
- Kicker: "INVESTIGAÇÃO" / "WORKSPACE" / "PUBLIC REPORT"

---

## VISUAL FOUNDATIONS

### Colors

**Site palette (light only):**
- `--background`: `rgb(250 246 239)` — warm cream canvas
- `--foreground`: `rgb(28 40 59)` — deep slate-navy
- `--muted`: `rgb(237 232 223)`
- `--muted-foreground`: `rgb(94 78 64)` — warm cocoa-brown
- `--card`: `rgb(255 252 247)` — slightly off-white warm
- `--border`: `rgb(227 217 205)` — warm beige border
- `--brand`: `rgb(1 118 211)` — strong clear blue (primary CTA)
- `--brand-foreground`: `rgb(255 255 255)`
- `--brand-soft`: `rgb(234 244 255)` — light blue tint for icon backgrounds
- `--navy`: `rgb(17 57 102)` — deep navy for headings
- `--cocoa`: `rgb(93 63 41)` — warm brown accent
- `--sand`: `rgb(245 224 157)` — warm yellow highlight
- `--sage`: `rgb(152 184 88)` — calm green accent
- `--sage-soft`: `rgb(235 243 219)` — soft sage tint

**Web app (light mode, HSL):**
- Background: `hsl(38 52% 96%)`, Card: `hsl(38 100% 98%)`, Foreground: `hsl(217 36% 17%)`
- Primary: `hsl(207 99% 42%)` (brand blue), Primary foreground: white
- Sidebar background: `hsl(212 71% 23%)` — dark navy sidebar
- Sidebar foreground: `hsl(38 100% 98%)` — warm cream on dark
- Muted: `hsl(39 28% 90%)`, Border: `hsl(33 28% 85%)`
- Dark mode: deep navy bg `hsl(219 48% 11%)`, warm cream fg

### Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| `display` / `--font-display` | **Kanit** | 400–800 | Headlines, kickers, display text, brand statements |
| `interface` / `--font-sans` | **IBM Plex Sans** | 400–700 | Body, UI labels, nav, forms, tables, metadata |

Both fonts loaded from Google Fonts. No monospace font is defined in the system; IBM Plex Sans carries all interface weight.

Typical sizes: display headings 3xl–5xl (site), 2xl–4xl (web app). Body: sm–base. Kickers: xs with tracking-[0.22em–0.28em].

### Spacing & Layout

- Max content width: `max-w-[1200px]` (site), `max-w-7xl` (web app)
- Page padding: `px-4 sm:px-6 lg:px-8`
- Section vertical: `py-14 md:py-18`
- Grid gaps: 4–8 (16–32px)

### Corner Radii

- Cards: `rounded-3xl` (1.5rem) / `rounded-[2rem]` / `rounded-[2.25rem]`
- Buttons / pills: `rounded-full` (site CTAs), `rounded-2xl` (web app)
- Icon boxes: `rounded-2xl`
- Inner chips: `rounded-2xl`
- Radius token in web: `--radius: 0.9rem`

### Shadows

- `shadow-glow`: `0 0 0 1px rgb(var(--brand) / 0.08), 0 25px 60px rgb(15 23 42 / 0.12)` — used on primary CTAs
- `shadow-panel`: `0 20px 50px rgb(15 23 42 / 0.10)` — used on featured cards
- `shadow-sm`: most cards use light shadow
- Web app sidebar uses `shadow-xl shadow-foreground/5`

### Backgrounds & Texture

- **Body gradient (site):** radial brand blue top-right + sage green top-left + warm linear bottom — subtle, not garish
- **Dot grid texture:** fixed `body::before` with 1px radial dots at 24px grid, opacity 0.18, masked with gradient to fade out below fold
- **Cards:** white/near-white with warm tint, light border. Never flat gray.
- **Hero visual inner panels:** white glassmorphism layers: `bg-white/80 backdrop-blur`
- **Sidebar (web):** solid dark navy, no gradient

### Animations

- `float`: `translateY(0 → -10px)`, 8s ease-in-out infinite — used on mascot hero image
- `fadeUp`: `opacity 0→1 + translateY(18px→0)`, 700ms ease-out — page section entrances
- `pulseSoft`: opacity 0.82→1, 6s ease-in-out infinite — subtle breathing effect
- Hover on cards: `-translate-y-1` with `transition duration-300`
- Hover on CTAs: `-translate-y-0.5`
- Hover on nav links: `translate-x-1` on icon

### Hover & Press States

- **Primary buttons:** `hover:bg-brand/90 hover:-translate-y-0.5`
- **Cards:** `hover:-translate-y-1 hover:shadow-panel hover:border-brand/25`
- **Nav links:** `hover:bg-brand-soft hover:text-navy`
- **Mobile menu items:** `hover:bg-brand-soft`
- **Sidebar items (web):** `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
- No press/scale effect; lift (translateY) is the primary feedback

### Borders

- Site: `border-border` (warm beige). Cards always have visible borders — no borderless cards.
- Web app: same warm border in light; `hsl(218 35% 22%)` in dark
- Sidebar: `border-sidebar-border/70`
- Header: `border-b border-border/60` with backdrop blur

### Cards

Site cards: `rounded-3xl border border-border bg-card p-6 shadow-sm`
Web cards: same but from shadcn `<Card>` with `rounded-[1.75rem]` overrides.
Featured/hero cards: `rounded-[2.25rem] shadow-panel p-5 md:p-8`

### Imagery

- Mascot illustrations: `capyra-hero.png` (floating capybara), `capyra-turtle.png` (capybara+turtle)
- Brand images are AI-generated illustrations in a warm, slightly editorial photographic style
- No stock photography or flat icons. No SVG illustrations.
- Images used contextually (hero, product sections), not decoratively.

### Iconography (see ICONOGRAPHY section below)

---

## ICONOGRAPHY

- **Icon system:** [Lucide](https://lucide.dev) — stroke icons, default 16–20px (`h-4 w-4` / `h-5 w-5`)
- **CDN:** `https://unpkg.com/lucide@latest` (or via `lucide-react` npm package)
- **Stroke weight:** default Lucide (1.5px stroke)
- **Color:** `text-brand` (blue) for decorative icons; `text-muted-foreground` for secondary
- **Icon backgrounds:** `rounded-2xl bg-brand-soft p-3` (site), `rounded-2xl bg-primary/10 p-2–3` (web)
- **No icon font, no PNG icons, no emoji**
- Icons used in UI: `ArrowRight`, `Check`, `BadgeCheck`, `Plus`, `LogOut`, `LayoutDashboard`, `ListVideo`, `Menu`, `ArrowRight`, `BarChart3`, `FileText`, `Sparkles`, `Clock3`, `ListChecks`, `TriangleAlert`

Key logo and brand images copied to `assets/`:
- `assets/logo.png` — primary logo (capybara avatar, used in header/footer/favicon)
- `assets/capyra-hero.png` — floating mascot for hero sections
- `assets/capyra-turtle.png` — capybara+turtle for product/report sections

---

## File Index

```
README.md                    — this file
SKILL.md                     — agent skill definition
colors_and_type.css          — CSS variables for colors, typography, and design tokens
site.md                      — marketing site brand/runtime summary
web.md                       — authenticated web brand adaptation
assets/
  logo.png                   — primary brand logo
  capyra-hero.png            — hero mascot image
  capyra-turtle.png          — product/report mascot image
preview/
  colors-site.html           — site color palette swatches
  colors-web.html            — web app color palette (light + dark)
  colors-semantic.html       — semantic color roles
  type-scale.html            — Kanit + IBM Plex Sans type specimens
  type-components.html       — kickers, headings, body type in context
  spacing-radii.html         — border radii tokens
  spacing-shadows.html       — shadow system
  components-buttons.html    — button variants
  components-cards.html      — card variants
  components-badges.html     — badge variants
  components-inputs.html     — form inputs
  components-sidebar.html    — sidebar nav component
  brand-logo.html            — logo usage
  brand-mascots.html         — mascot images in context
ui_kits/
  site/
    README.md
    index.html               — marketing site (home page)
    SiteHeader.jsx
    SiteFooter.jsx
    HeroSection.jsx
    FeatureCards.jsx
    MarketingComponents.jsx
  web/
    README.md
    index.html               — authenticated app (dashboard)
    AppShell.jsx
    DashboardView.jsx
    AnalysesView.jsx
```
