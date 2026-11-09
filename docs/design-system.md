# Design system

How Altfragen.io looks, and the rules that keep it that way. Written 2026-11-09.
The reasons behind the choices (research, rejected options) live in the owner's
notes; this page is what the code must follow.

## Principles

1. **Habit before novelty.** Where something sits, what it is called and which
   key triggers it stays the same. Change only to remove a detour.
2. **Colour means something.** Blue = action and brand, green = right, red =
   wrong or destructive, orange = warning, gold = premium. AI has no colour of
   its own: it is marked by the label "KI" and the model icons. Meaning is never
   colour alone — always also a mark (✓, ✗), a number or text.
3. **Reading first.** The question text is the most important element: 16 px on
   phones, 18 px from `md`, line height 1.6, at most ~70 characters per line.
4. **Light and dark are equal.** Every token has both values. No class without a
   dark variant; with tokens that is automatic.
5. **Keyboard and screen reader are equal.** Everything operable is a `<button>`,
   `<a>` or form element, has a visible focus and a name.
6. **Components use names, not colour values.** `bg-success-subtle`, never
   `bg-green-100`. `npm run check:colors` (part of `verify` and CI) rejects
   palette classes and hex classes anywhere in `src/`.
7. **Every state is designed.** Loading, empty and error use the building blocks
   below, with German text — never a blank screen or "Loading...".

## Tokens

Defined as HSL in `src/index.css` (`:root` and `.dark`), mapped to Tailwind in
`tailwind.config.ts`. Opacity works: `bg-primary/30`.

| Token                        | Use                                     | Light                 | Dark                  |
| ---------------------------- | --------------------------------------- | --------------------- | --------------------- |
| `background`                 | page                                    | `#F7F6F3` paper       | `#14161B` anthracite  |
| `card`                       | cards, answer list                      | `#FFFFFF`             | `#1B1E24`             |
| `popover`                    | menus, dialogs, toasts                  | `#FFFFFF`             | `#20242B`             |
| `muted`                      | quiet surfaces, hover, AI content, keys | `#EFEDE8`             | `#23272F`             |
| `foreground`                 | text                                    | `#171B24`             | `#E8EAEE`             |
| `muted-foreground`           | secondary text                          | `#5B6170`             | `#A0A6B2`             |
| `border`                     | dividers, card edges                    | `#E4E2DD`             | `#2D323B`             |
| `input`                      | field and control borders (≥ 3:1)       | `#8F8C85`             | `#6B7280`             |
| `ring`                       | focus ring                              | = `primary`           | = `primary`           |
| `primary`                    | main button, links, progress, selection | `#24429F`             | `#8FA5F2`             |
| `primary-hover`              | hover of the main button                | `#1B3483`             | `#A9B8F5`             |
| `primary-subtle` / `-strong` | info surface / text on it               | `#E9EDF8` / `#1F3B8F` | `#1B2238` / `#B4C3F6` |

Meaning colours come in four steps: **solid** (`bg-success`, icons, bars,
buttons), **subtle** (surface), **border**, **strong** (text on the surface).

| Family                     | Meaning                  | Light solid / subtle / border / strong  | Dark                                    |
| -------------------------- | ------------------------ | --------------------------------------- | --------------------------------------- |
| `success`                  | right, active, done      | `#1F7A4A` `#E7F5EC` `#9ED2B3` `#17603A` | `#4CC283` `#12291D` `#25573B` `#7DDCA6` |
| `danger` (= `destructive`) | wrong, delete, error     | `#C4321F` `#FCEBE8` `#F0B4AA` `#A3261A` | `#F2705F` `#33191A` `#6B2C27` `#FF9A8C` |
| `warning`                  | limits, pausing, notices | `#B45F06` `#FDF3E1` `#F0C98A` `#8A4A05` | `#E9A23B` `#2E2413` `#684A18` `#F4C274` |
| `premium`                  | crown, premium badges    | `#C08A06` `#FBF4DC` `#E6D29A` `#7E5A03` | `#E5B93A` `#2B2512` `#5C4A16` `#F0CF6B` |

**Text uses `-strong`, not the solid step,** for `warning` and `premium`: their
solid values fall below 4.5:1 on light surfaces (warning 4.2:1 on paper,
premium 2.8:1). Solid is for icons, bars and filled buttons. `success` and
`danger` solid pass as text (≥ 4.5:1 on every light surface) but `-strong` is
the default on their subtle surface.

`difficulty-1` … `difficulty-5` (each with `-foreground`) keep the familiar
order green, blue, yellow, orange, red. `chart-1` … `chart-5` are for charts;
right/wrong in charts is always `success`/`danger`.

Contrast (computed 2026-11-09): body text 15.9:1 light, 13.9:1 dark; secondary
text ≥ 5.3:1; white on primary 8.9:1; strong text on every subtle surface
≥ 5.7:1; input borders ≥ 3.3:1.

## Type

Atkinson Hyperlegible Next (400, 600, 700) and Atkinson Hyperlegible Mono (400),
self-hosted through `@fontsource` (no request to Google), Latin subset including
umlauts, `font-display: swap` and a size-adjusted Arial fallback. Licence (OFL
1.1) in `public/fonts/`.

Scale: 12, 14, 16, 18, 20, 24, 30 px (`text-xs` … `text-3xl`); the landing page
may go larger for display headings. Page title `text-2xl md:text-3xl
font-semibold`, section `text-xl font-semibold`, card title `text-base
font-semibold` (the `CardTitle` default), figures `text-2xl font-bold
tabular-nums`, keys `font-mono text-xs`.

## Space, shape, depth, layers

- 4 px grid. Page gutter 16 px, 24 px from `md`. Page width `max-w-page`
  (1200 px; `container` uses it too), training view `max-w-reading` (896 px).
- Radius 10 px (`rounded-lg`) for cards, 8 px (`rounded-md`) for buttons and
  fields, full for chips and badges.
- Cards have a border and no shadow. Shadows only on menus, dialogs, toasts and
  the floating comment panel.
- Layers, lowest first: content, `z-bar` (SessionBar, ActionBar), `z-nav`,
  `z-panel` (comment panel), `z-menu`, `z-dialog`, `z-toast`. Do not write
  `z-50`.
- Heights use `dvh`, never `100vh`.
- Touch targets: `touch:` variant (coarse pointer) raises buttons to 44 px;
  answer rows are at least 48 px.
- Motion: 150 ms for hover/focus, 200 ms for expanding. `prefers-reduced-motion`
  turns animation off globally (`index.css`). See "Motion" below.

## Theme

`next-themes` with `attribute="class"`, default **system**, storage key `theme`
(the key the old toggle used, so earlier choices survive). The navigation
toggle switches light/dark; Settings → Darstellung offers Hell, Dunkel, Wie
System. A section can force dark by carrying the `dark` class (the landing
page's keyboard band does).

## Building blocks

shadcn primitives in `src/components/ui/` keep their names and props and take
their look from the tokens. Additions:

- `Badge` variants `info`, `success`, `warning`, `premium`; `destructive` is the
  subtle danger style.
- `Alert` variants `info`, `success`, `warning`, `premium`.
- `Progress` takes `indicatorClassName` (`bg-success` for right answers).

App building blocks in `src/components/ds/`:

| Block                                      | What                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `Page`, `PageHeader`                       | page frame (width, gutter, rhythm); title (the page's only `h1`), description, actions |
| `StatTile`                                 | label, figure, hint                                                                    |
| `Callout`                                  | hint box: info, success, warning, danger, premium, neutral                             |
| `EmptyState`, `ErrorState`, `LoadingState` | the three designed states                                                              |
| `SkipLink`                                 | "Zum Inhalt", first element of every layout                                            |
| `SessionStatusBadge`, `DaysUntilBadge`     | session status and days to an exam, as text                                            |
| `Kbd`                                      | keyboard shortcut chip                                                                 |

Training view (`src/components/training/`): `SessionBar` (progress, comments,
pause), `ActionBar` (Zurück · Lösung anzeigen · Weiter; fixed at the bottom on
phones), `AmbossAnswer` (the answer row: a real `<button>` with one state —
open, selected, right, wrong), `ResumeSessionRow` ("Weitermachen" on the
dashboard).

## Accessibility rules

- One `h1` per page; in the training view it is "Frage x von y", and focus moves
  there after "Weiter".
- Results are announced through `role="status"`; errors and warnings through
  `role="alert"` (`Callout` and `ErrorState` do this).
- The comment panel takes focus when it opens; Esc closes it and focus returns.
- Training shortcuts (`useTrainingKeyboard`) never fire with Ctrl/Cmd/Alt, in
  fields, editable text, menus or dialogs, and leave Space/Enter on a focused
  button to that button (answer rows excepted). `isShortcutBlocked` has a spec.
- Icon-only buttons carry an `aria-label`.

## Motion

Calm in the app, a little more on the landing page. Nothing loops, floats or
hijacks scrolling, and nothing ever stays hidden: every effect is wrapped in
`prefers-reduced-motion: no-preference`, and scroll-driven effects sit behind
`@supports (animation-timeline: view())`, so browsers without them simply show
the content.

| Where                                      | What                                                  | How                                                   |
| ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| App pages                                  | fade in over 200 ms                                   | `Page` (`animate-in fade-in-0`)                       |
| Answer comments, dashboard sections        | expand smoothly                                       | `animate-in`; `animate-collapsible-down/up`           |
| Landing: hero                              | staggered rise on load, the cross in the box is drawn | `.enter` with `--delay`; `.draw` on `CrossBox`        |
| Landing: headings, steps, features, prices | fade up while scrolling into view                     | `.reveal` (CSS view timeline)                         |
| Landing: header                            | shadow once the page has scrolled                     | `.scroll-lift` (CSS scroll timeline)                  |
| Landing: numbers                           | count up once visible                                 | `useInView` + `useCountUp`                            |
| Landing: answer sheet, keys                | marks and keys appear one after another               | `useInView` sets `data-reveal`; `.stagger` with `--i` |
| Landing: demo quiz                         | next question fades in, result slides in              | `animate-in`                                          |

`useInView` (`src/hooks/useInView.ts`) hides only after mounting, before the
first paint, and returns nothing without IntersectionObserver or with reduced
motion — then everything is visible from the start.
