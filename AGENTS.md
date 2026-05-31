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
