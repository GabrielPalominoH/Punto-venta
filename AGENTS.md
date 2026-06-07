# Marlin Poseidon — Punto de Venta

## Stack
- React 19 + Vite 8 (plain JSX, **no TypeScript**)
- Tailwind CSS **v4** (`@import "tailwindcss"` + `@theme` directive, **NOT** `tailwind.config.js`)
- React Router v7, localStorage as DB (no backend)
- html2canvas + jsPDF for PDF generation
- ESLint flat config (`eslint.config.js`)

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint (no typecheck step exists) |

## Color System
- All surface/container colors are CSS custom properties defined in `src/index.css` via `@theme`
- **Never use** `bg-slate-*`, `bg-white` (use `bg-surface-container-low`, `bg-surface`, etc.)
- Surface tokens: `surface`, `surface-dim`, `surface-bright`, `surface-container`, `surface-container-low`, `surface-container-high`, `surface-container-highest`, `surface-container-lowest`
- System colors: `primary`, `secondary`, `error`, `outline`, `outline-variant`, `on-*` variants
- Dark mode via `.dark` class (special overrides for `.dark .bg-white:not([data-keep-white])`)
- In dark mode, `secondary` and `primary` become `#ffffff` — toggles must use `peer-checked:after:bg-on-secondary` for thumb contrast

## ConfigModal (`src/components/ConfigModal.jsx`)
- 6 tabs: General, Seguridad, Apariencia, Personalización, Categorías, Notificaciones
- **Personalización**: Logo branding with 3 types (icon/URL/image), color picker + 10 presets, 22 logo icons
- Branding persisted in localStorage via `db.getBranding()` / `db.saveBranding()`
- **Notificaciones**: 4 preference toggles using pure-CSS toggle (`sr-only peer` input + `after:` pseudo-element thumb)
- Toggle dimensions: `w-11 h-6`, thumb `h-5 w-5`, translation `translate-x-5`
- Toggle colors unchecked: `bg-outline` + thumb `bg-white` with `border-outline-variant`
- Toggle colors checked: `bg-secondary` + thumb `peer-checked:after:bg-on-secondary` with `peer-checked:after:border-secondary`
- Toggle thumb uses `after:bg-white` for unchecked, overridden to `after:bg-on-secondary` when checked (critical for dark mode where `secondary` = white)

## POS Layout (`/punto-venta`)
- **Mobile** (`< lg`, breakpoint = 64rem/1024px): sticky cart bar + slide-up cart sheet
- **Desktop** (`lg+`): inline cart aside (`w-[420px]`)
- Single component file: `src/pages/PuntoVenta.jsx` (~893 lines)

## Auth
- Simulated login via `AuthContext`, session stored in localStorage
- Test credentials:
  - `admin@marlinposeidon.com` / `admin123` (Store Manager)
  - `vendedor@marlinposeidon.com` / `vendedor123` (Vendedor)

## Key Conventions
- Icons: Material Symbols Outlined `<span className="material-symbols-outlined">icon_name</span>`
- Font: Inter (400/600/700/800) from Google Fonts
- Grid uses `gap-2`/`gap-3` (mobile) and `lg:gap-4`/`lg:gap-6` (desktop)
- Stitch design system reference files in project root (`stitch-exact.html`, `stitch-ref.html`, `stitch-ref.png`)
- No test framework — no tests to run
- `scrollbar-hide` utility class used for scrollable containers
- CSS helper classes in `src/App.css` for filter panel alignment: `sales-filter-panel`, `inventory-detail-panel`, `audit-filter-panel` (keep filter controls height-consistent)

## Auditoria (`/auditoria`)
- Paginated activity log: 10 items/page with prev/next buttons, page numbers with ellipsis, and "Mostrando X–Y de Z registros"
- Filters: text search, date range (Desde/Hasta), responsible person (Combobox with names auto-extracted from `<strong>` tags in activity text)
- Data from `db.getActivities()` — fields: `id`, `icon`, `iconBg`, `text` (HTML), `meta`, `amount`, `amountClass`, `date` (ISO)
- Filter changes reset to page 1 via `setPage(1)` in each onChange handler
- Responsible names extracted via `extractPerson()` regex — takes the last `<strong>content</strong>` from `text`

## Combobox (`src/components/Combobox.jsx`)
- Replaces native `<select>` with custom dropdown, keyboard/mouse navigation, search-in options
- Props: `value`, `onChange`, `options` (string[]), `placeholder`, `disabled`, `className`
- Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close
- Mouse hover highlight guarded by `keyboardRef` to avoid scroll-jump interference
