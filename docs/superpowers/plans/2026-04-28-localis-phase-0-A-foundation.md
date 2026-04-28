# Milestone A — Foundation

> Part of [Phase 0 master plan](2026-04-28-localis-phase-0-foundation.md).

**Goal:** Initialize Git repo, scaffold Astro 5 + Tailwind project, implement OKLCH design tokens and Spectral + Schibsted Grotesk typography, build base layout components (Layout, Header, Footer, LangSwitcher), and deploy first preview to Netlify via GitHub integration.

**Architecture:** A blank Astro 5 project gets configured with TypeScript strict mode, Tailwind CSS plugin, Astro Content Collections (schema definition), and i18n routing for IT (default, no prefix) + EN (`/en/` prefix). Design tokens live in `src/styles/tokens.css` consumed by Tailwind theme extension. Components are pure Astro (no React island unless required later for AudioPlayer in Milestone D).

**Estimated effort:** 12-16h.

**Prerequisites:** `Phase 0 master plan` Prerequisites section completed.

---

## Files

### Created in this milestone

```
LocalisGuide/                                    # working directory (existing)
├── .gitignore
├── .editorconfig
├── .nvmrc
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml                              # auto-generated
├── netlify.toml
├── README.md
├── public/
│   ├── favicon.svg
│   └── robots.txt                              # placeholder, full version Milestone F
├── src/
│   ├── content/
│   │   └── config.ts                           # Astro Content Collection schemas
│   ├── components/
│   │   ├── Layout.astro
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LangSwitcher.astro
│   │   └── SkipLink.astro
│   ├── lib/
│   │   ├── i18n.ts
│   │   └── i18n-strings.ts                     # IT + EN translation map
│   ├── pages/
│   │   ├── index.astro                         # IT homepage placeholder
│   │   └── en/
│   │       └── index.astro                     # EN homepage placeholder
│   └── styles/
│       ├── tokens.css                          # OKLCH palette + type scale + spacing
│       └── global.css                          # imports, base resets
└── tests/
    ├── unit/
    │   └── i18n.test.ts                        # i18n helper smoke test
    └── e2e/
        └── homepage.spec.ts                    # Playwright homepage renders test
```

### Files moved or removed

The current 18 static files (HTML, MP3, JPG) downloaded earlier remain in `LocalisGuide/` root from Section 5 of brainstorming. They will be migrated/replaced in Milestone B. For Milestone A, leave them where they are; `.gitignore` will exclude them from the new repo until B.

### Add to `.gitignore`

```
node_modules/
dist/
.astro/
.env*
!.env.example
.netlify/
.vercel/
.turbo/
.DS_Store
Thumbs.db
*.log
.superpowers/
.vscode/

# Existing static site files (will be replaced in Milestone B)
*.html
*.mp3
*.jpg
*.jpeg
*.png
!public/**/*
!src/**/*
```

---

## Task 1: Initialize Git repo and verify prerequisites

**Files:**
- Create: `.gitignore`, `.editorconfig`, `.nvmrc`, `README.md`

- [ ] **Step 1: Verify Node version**

```bash
node -v
```
Expected: `v20.x.x` or higher. If lower, install Node 20+ via official installer or `nvm install 20 && nvm use 20`.

- [ ] **Step 2: Verify pnpm installed**

```bash
pnpm -v
```
Expected: `8.x.x` or higher. If missing: `npm install -g pnpm`.

- [ ] **Step 3: Verify gh CLI authenticated**

```bash
gh auth status
```
Expected: "Logged in to github.com". If not, run `gh auth login` and follow prompts.

- [ ] **Step 4: Initialize Git in LocalisGuide directory**

```bash
cd "c:/Users/Admin/Desktop/Progetti & Lab/Sites/LocalisGuide"
git init -b main
```
Expected: "Initialized empty Git repository in .../LocalisGuide/.git/"

- [ ] **Step 5: Create .gitignore**

Write the following to `.gitignore` at repo root:

```gitignore
# Node
node_modules/
*.log
npm-debug.log*
pnpm-debug.log*

# Astro
dist/
.astro/

# Env vars (never commit)
.env
.env.local
.env.production
.env.development
!.env.example

# Build / deploy
.netlify/
.vercel/
.turbo/

# OS
.DS_Store
Thumbs.db
desktop.ini

# Editor
.vscode/
.idea/
*.swp

# Brainstorming artifacts (local-only)
.superpowers/

# Existing legacy static site (replaced in Milestone B)
/index.html
/bari-vecchia-audioguida-v2.html
/il-meglio-di-bari-audioguida.html
/porto-bari-audioguida.html
/san-nicola-audioguida-completa.html
/tre-teatri-bari-audioguida.html
/*.mp3
/*.jpg
```

- [ ] **Step 6: Create .editorconfig**

Write to `.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 7: Create .nvmrc**

Write to `.nvmrc`:

```
20
```

- [ ] **Step 8: Create initial README.md**

Write to `README.md`:

```markdown
# Localis

Audioguide narrative della Puglia. localis.guide

## Stack

- Astro 5 + Tailwind CSS
- TypeScript (strict)
- Stripe Checkout + Connect
- Resend (email)
- Cloudflare R2 (audio storage)
- ElevenLabs (voice)
- Plausible (analytics)
- Sentry (errors)

## Local development

```bash
pnpm install
pnpm dev
```

Open http://localhost:4321

## Deploy

Push to `main` triggers Netlify production deploy. Push to any other branch creates a preview deploy.

## Documentation

- Design context: [.impeccable.md](./.impeccable.md)
- Spec: [docs/superpowers/specs/2026-04-28-localis-restructure-design.md](./docs/superpowers/specs/2026-04-28-localis-restructure-design.md)
- Plan: [docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md](./docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md)
```

- [ ] **Step 9: First commit**

```bash
git add .gitignore .editorconfig .nvmrc README.md
git commit -m "chore: initialize repo with .gitignore and tooling config"
```

Expected: "1 file changed" (or similar). Commit hash printed.

---

## Task 2: Scaffold Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro` (placeholder)

- [ ] **Step 1: Run Astro create**

```bash
pnpm create astro@latest . --template minimal --typescript strict --install --git false --skip-houston
```

Expected: Astro creates files in current directory. Answer "Yes" if prompted to overwrite README.md (we'll restore ours in Step 5).

- [ ] **Step 2: Verify dev server starts**

```bash
pnpm dev
```

Expected: "Local http://localhost:4321/" plus "Ready in N ms". Open browser → minimal Astro welcome page.

Press `Ctrl+C` to stop.

- [ ] **Step 3: Restore README**

The Astro template overwrote our README. Restore it manually with the content from Task 1 Step 8.

- [ ] **Step 4: Verify tsconfig.json strict mode**

Open `tsconfig.json`. Confirm contents include:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

If different, replace with the above.

- [ ] **Step 5: Update package.json scripts**

Open `package.json`. Replace `scripts` section with:

```json
"scripts": {
  "dev": "astro dev",
  "start": "astro dev",
  "build": "astro check && astro build",
  "preview": "astro preview",
  "astro": "astro",
  "check": "astro check",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 6: Add @astrojs/check for type checking in build**

```bash
pnpm add -D @astrojs/check typescript
```

Expected: package.json updated, lockfile regenerated.

- [ ] **Step 7: Verify build passes**

```bash
pnpm build
```

Expected: "✓ Completed in N ms" with no type errors. Build outputs to `dist/`.

- [ ] **Step 8: Commit Astro scaffold**

```bash
git add .
git commit -m "feat: scaffold Astro 5 project with TypeScript strict mode"
```

---

## Task 3: Add Tailwind CSS

**Files:**
- Modify: `astro.config.mjs`, `package.json`
- Create: `tailwind.config.mjs`, `src/styles/global.css`

- [ ] **Step 1: Install Tailwind via Astro integration**

```bash
pnpm astro add tailwind
```

Answer "y" to all prompts. Astro modifies `astro.config.mjs` to register the Tailwind integration and creates `tailwind.config.mjs`.

- [ ] **Step 2: Verify astro.config.mjs**

Open `astro.config.mjs`. Confirm contents include:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false })],
  site: 'https://localis.guide',
});
```

`applyBaseStyles: false` is critical — we'll provide our own base styles via `global.css` so we control reset behavior.

- [ ] **Step 3: Create src/styles/global.css**

Write to `src/styles/global.css`:

```css
@import './tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base resets — replace browser defaults with intentional values */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    /* Prevent text size inflation on iOS landscape */
    -webkit-text-size-adjust: 100%;
    /* Improve text rendering */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Smooth scrolling for in-page anchors */
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background: var(--color-surface);
    color: var(--color-ink);
    font-family: 'Schibsted Grotesk', system-ui, -apple-system, sans-serif;
    font-size: 1rem;
    line-height: 1.65;
    min-height: 100vh;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Spectral', Georgia, serif;
    font-weight: 400;
    line-height: 1.15;
    color: var(--color-ink);
    margin: 0;
  }

  p {
    margin: 0;
    max-width: 65ch;
  }

  a {
    color: var(--color-link);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-thickness: 1px;
  }

  a:hover {
    color: var(--color-link-hover);
  }

  /* Focus visible: 2px terracotta outline */
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 4: Configure tailwind.config.mjs with design tokens**

Open `tailwind.config.mjs` and replace contents with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-elev': 'var(--color-surface-elev)',
        'surface-deep': 'var(--color-surface-deep)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        'ink-subtle': 'var(--color-ink-subtle)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        link: 'var(--color-link)',
        'link-hover': 'var(--color-link-hover)',
      },
      fontFamily: {
        display: ['Spectral', 'Georgia', 'serif'],
        body: ['Schibsted Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
      },
      spacing: {
        '2xs': 'var(--space-2xs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4xl': 'var(--space-4xl)',
      },
      maxWidth: {
        prose: '65ch',
        wrap: '1100px',
        narrow: '720px',
      },
      transitionTimingFunction: {
        'ease-out-quart': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        med: '250ms',
        slow: '400ms',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Commit Tailwind setup**

```bash
git add astro.config.mjs tailwind.config.mjs src/styles/global.css package.json pnpm-lock.yaml
git commit -m "feat: add Tailwind CSS with custom design token theme extension"
```

---

## Task 4: Implement OKLCH design tokens

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Write tokens.css**

Write to `src/styles/tokens.css`:

```css
/* Localis Design Tokens
 * OKLCH palette per spec §5 Brand & visual direction
 * Editorial Modern: parchment + deep navy + terracotta accent
 */

:root {
  /* === Color: Surface === */
  --color-surface:        oklch(96% 0.012 75);    /* parchment base */
  --color-surface-elev:   oklch(92% 0.018 75);    /* elevated cards */
  --color-surface-deep:   oklch(99% 0.006 75);    /* near-white tinted, never #fff */

  /* === Color: Ink === */
  --color-ink:            oklch(20% 0.025 240);   /* deep navy-black, primary text */
  --color-ink-muted:      oklch(45% 0.020 240);   /* secondary text */
  --color-ink-subtle:     oklch(55% 0.012 240);   /* labels, eyebrows */

  /* === Color: Lines === */
  --color-border:         oklch(85% 0.012 75);    /* hairlines, dividers */

  /* === Color: Accent === */
  --color-accent:         oklch(56% 0.14 45);     /* terracotta — used 1-3x per screen max */
  --color-accent-soft:    oklch(85% 0.06 45);     /* soft wash, rare */

  /* === Color: Link === */
  --color-link:           oklch(46% 0.085 240);   /* muted Adriatic */
  --color-link-hover:     oklch(38% 0.10 240);

  /* === Color: Status === */
  --color-success:        oklch(58% 0.12 145);
  --color-warning:        oklch(68% 0.16 70);
  --color-error:          oklch(54% 0.18 25);

  /* === Type scale (modular 1.25 ratio) === */
  --text-xs:   0.75rem;   /* 12px — eyebrows, microcopy */
  --text-sm:   0.875rem;  /* 14px — secondary labels */
  --text-base: 1rem;      /* 16px — body */
  --text-lg:   1.125rem;  /* 18px — lead body */
  --text-xl:   1.25rem;   /* 20px — h4 */
  --text-2xl:  1.5rem;    /* 24px — h3 */
  --text-3xl:  2rem;      /* 32px — h2 */
  --text-4xl:  clamp(2.2rem, 5vw, 3.4rem);  /* h1 hero */
  --text-5xl:  clamp(2.8rem, 7vw, 4.8rem);  /* display, rare */

  /* === Spacing scale (4pt base) === */
  --space-2xs: 0.25rem;   /* 4px */
  --space-xs:  0.5rem;    /* 8px */
  --space-sm:  0.75rem;   /* 12px */
  --space-md:  1rem;      /* 16px */
  --space-lg:  1.5rem;    /* 24px */
  --space-xl:  2rem;      /* 32px */
  --space-2xl: 3rem;      /* 48px */
  --space-3xl: 4rem;      /* 64px */
  --space-4xl: 6rem;      /* 96px */

  /* === Misc === */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  --shadow-subtle:  0 1px 2px oklch(20% 0.025 240 / 0.05);
  --shadow-elev:    0 4px 12px oklch(20% 0.025 240 / 0.06);
}

/* === Dark mode (opt-in via prefers-color-scheme) === */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface:        oklch(18% 0.020 240);
    --color-surface-elev:   oklch(22% 0.022 240);
    --color-surface-deep:   oklch(15% 0.018 240);
    --color-ink:            oklch(94% 0.012 75);
    --color-ink-muted:      oklch(70% 0.012 75);
    --color-ink-subtle:     oklch(60% 0.010 75);
    --color-border:         oklch(28% 0.018 240);
    --color-accent:         oklch(68% 0.14 45);
    --color-accent-soft:    oklch(35% 0.08 45);
    --color-link:           oklch(70% 0.10 220);
    --color-link-hover:     oklch(78% 0.10 220);
  }
}
```

- [ ] **Step 2: Update src/pages/index.astro to use tokens**

Replace contents of `src/pages/index.astro` (created by Astro template) with:

```astro
---
import '../styles/global.css';
---
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Localis — design tokens preview</title>
</head>
<body class="bg-surface text-ink">
  <main class="max-w-wrap mx-auto px-md py-2xl">
    <h1 class="font-display text-4xl mb-md">Design tokens preview</h1>
    <p class="text-base text-ink-muted mb-xl max-w-prose">
      Verifica visiva palette + typography + spacing. Questa pagina è temporanea, sostituita in Milestone B con la homepage reale.
    </p>

    <section class="mb-2xl">
      <h2 class="font-display text-3xl mb-lg">Colori</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-md">
        <div class="p-md bg-surface border border-border rounded-md">surface</div>
        <div class="p-md bg-surface-elev border border-border rounded-md">surface-elev</div>
        <div class="p-md bg-ink text-surface rounded-md">ink</div>
        <div class="p-md bg-accent text-surface rounded-md">accent</div>
        <div class="p-md text-link border border-link rounded-md">link</div>
        <div class="p-md text-ink-muted border border-border rounded-md">ink-muted</div>
      </div>
    </section>

    <section class="mb-2xl">
      <h2 class="font-display text-3xl mb-lg">Type scale</h2>
      <div class="space-y-md">
        <p class="font-display text-5xl">Display 5xl · Spectral</p>
        <p class="font-display text-4xl">Heading 4xl · h1 hero</p>
        <p class="font-display text-3xl">Heading 3xl · h2</p>
        <p class="font-display text-2xl">Heading 2xl · h3</p>
        <p class="text-lg">Lead body · Schibsted Grotesk</p>
        <p class="text-base">Body 16px regular</p>
        <p class="text-sm text-ink-muted">Secondary text 14px</p>
        <p class="text-xs uppercase tracking-[0.22em] text-accent font-semibold">Eyebrow label</p>
      </div>
    </section>

    <section class="mb-2xl">
      <h2 class="font-display text-3xl mb-lg">Italic narrative</h2>
      <p class="font-display text-2xl italic text-accent">Mentre sei lì.</p>
    </section>
  </main>
</body>
</html>
```

This is a token preview page. Sostituita in Milestone B.

- [ ] **Step 3: Run dev server and verify visually**

```bash
pnpm dev
```

Open http://localhost:4321. Verify:
- ✓ Background is warm parchment (NOT pure white)
- ✓ Text is deep navy (NOT pure black)
- ✓ "Mentre sei lì." appears in italic terracotta
- ✓ Type scale steps are visibly distinct

NB: at this stage fonts will fall back to system fonts (Spectral and Schibsted Grotesk are loaded in Task 6). Page will look serviceable but not final.

- [ ] **Step 4: Type check**

```bash
pnpm check
```

Expected: "0 errors" (or no output, depending on Astro version).

- [ ] **Step 5: Commit design tokens**

```bash
git add src/styles/tokens.css src/pages/index.astro
git commit -m "feat: implement OKLCH design tokens and token preview page"
```

---

## Task 5: Configure font loading (Spectral + Schibsted Grotesk)

**Files:**
- Modify: `src/styles/global.css`
- Create: `src/components/Layout.astro` (initial version, expanded later)

- [ ] **Step 1: Add Google Fonts links to global.css preconnect**

We use Astro's `<head>` injection via Layout component. First create the Layout.

Create `src/components/Layout.astro`:

```astro
---
import '../styles/global.css';

export interface Props {
  title: string;
  description?: string;
  lang?: 'it' | 'en';
}

const { title, description = '', lang = 'it' } = Astro.props;
---
<!DOCTYPE html>
<html lang={lang}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#FAF7F2" />
  <title>{title}</title>
  {description && <meta name="description" content={description} />}

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <!-- Fonts: Spectral display + Schibsted Grotesk body -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>
<body class="bg-surface text-ink font-body antialiased">
  <slot />
</body>
</html>
```

- [ ] **Step 2: Update src/pages/index.astro to use Layout**

Replace `src/pages/index.astro` with:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Localis — design tokens preview" lang="it">
  <main class="max-w-wrap mx-auto px-md py-2xl">
    <h1 class="font-display text-4xl mb-md">Design tokens preview</h1>
    <p class="text-base text-ink-muted mb-xl max-w-prose">
      Verifica visiva palette + typography + spacing. Pagina temporanea, sostituita in Milestone B.
    </p>

    <section class="mb-2xl">
      <h2 class="font-display text-3xl mb-lg">Colori</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-md">
        <div class="p-md bg-surface border border-border rounded-md">surface</div>
        <div class="p-md bg-surface-elev border border-border rounded-md">surface-elev</div>
        <div class="p-md bg-ink text-surface rounded-md">ink</div>
        <div class="p-md bg-accent text-surface rounded-md">accent</div>
        <div class="p-md text-link border border-link rounded-md">link</div>
        <div class="p-md text-ink-muted border border-border rounded-md">ink-muted</div>
      </div>
    </section>

    <section class="mb-2xl">
      <h2 class="font-display text-3xl mb-lg">Type scale</h2>
      <div class="space-y-md">
        <p class="font-display text-5xl">Display 5xl</p>
        <p class="font-display text-4xl">Heading 4xl · h1 hero</p>
        <p class="font-display text-3xl">Heading 3xl · h2</p>
        <p class="font-display text-2xl">Heading 2xl · h3</p>
        <p class="text-lg">Lead body · Schibsted Grotesk</p>
        <p class="text-base">Body 16px regular</p>
        <p class="text-sm text-ink-muted">Secondary text 14px</p>
        <p class="text-xs uppercase tracking-[0.22em] text-accent font-semibold">Eyebrow label</p>
      </div>
    </section>

    <section class="mb-2xl">
      <h2 class="font-display text-3xl mb-lg">Italic narrative</h2>
      <p class="font-display text-2xl italic text-accent">Mentre sei lì.</p>
    </section>
  </main>
</Layout>
```

- [ ] **Step 3: Create placeholder favicon.svg**

Write to `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#FAF7F2"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="20" font-weight="400" font-style="italic" text-anchor="middle" fill="#C2521A">L</text>
</svg>
```

Sostituito in Milestone F con un favicon più rifinito.

- [ ] **Step 4: Verify font loads in dev server**

```bash
pnpm dev
```

Open http://localhost:4321. Open browser DevTools → Network → filter "Font". Verify Spectral + Schibsted Grotesk loaded as woff2. Visual check: italic Spectral renders distinctively (NOT Times/Georgia).

- [ ] **Step 5: Commit Layout + fonts**

```bash
git add src/components/Layout.astro src/pages/index.astro public/favicon.svg
git commit -m "feat: add Layout component with Spectral + Schibsted Grotesk font loading"
```

---

## Task 6: Implement i18n routing skeleton

**Files:**
- Create: `src/lib/i18n.ts`, `src/lib/i18n-strings.ts`, `src/pages/en/index.astro`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Configure Astro i18n**

Open `astro.config.mjs`. Replace with:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://localis.guide',
  integrations: [tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

This makes `/` serve Italian and `/en/` serve English. Astro's `Astro.currentLocale` will reflect the active locale.

- [ ] **Step 2: Create src/lib/i18n.ts (helper utilities)**

Write to `src/lib/i18n.ts`:

```typescript
import type { AstroGlobal } from 'astro';

export type Lang = 'it' | 'en';

/**
 * Get current language from Astro context.
 */
export function getLang(astro: AstroGlobal): Lang {
  return (astro.currentLocale as Lang) || 'it';
}

/**
 * Build a localized URL given current lang and target path.
 * Italian (default) has no prefix; English uses /en/.
 *
 * @example
 *   localizedHref('/guide/bari-vecchia', 'it') === '/guide/bari-vecchia'
 *   localizedHref('/guide/bari-vecchia', 'en') === '/en/guide/bari-vecchia'
 */
export function localizedHref(path: string, lang: Lang): string {
  // Normalize: ensure leading slash
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'it') return normalized;
  // English: prefix with /en
  return `/en${normalized}`;
}

/**
 * Strip locale prefix from path. Useful for building lang-switcher links.
 *
 * @example
 *   stripLocalePrefix('/en/guide/bari-vecchia') === '/guide/bari-vecchia'
 *   stripLocalePrefix('/guide/bari-vecchia') === '/guide/bari-vecchia'
 */
export function stripLocalePrefix(path: string): string {
  return path.replace(/^\/en\b/, '') || '/';
}

/**
 * Get the alternate language pair URL for hreflang tags.
 */
export function alternateLangUrl(currentPath: string, currentLang: Lang): string {
  const stripped = stripLocalePrefix(currentPath);
  const targetLang: Lang = currentLang === 'it' ? 'en' : 'it';
  return localizedHref(stripped, targetLang);
}
```

- [ ] **Step 3: Create src/lib/i18n-strings.ts (translation map)**

Write to `src/lib/i18n-strings.ts`:

```typescript
import type { Lang } from './i18n';

/**
 * UI strings shared across components. Page-specific copy lives in MDX content.
 * Keep keys flat for simplicity; add nesting only if strings grow >50.
 */
export const STRINGS = {
  it: {
    'site.name': 'Localis',
    'site.tagline': 'Audioguide narrative · Puglia',
    'nav.home': 'Home',
    'nav.guide': 'Guide',
    'nav.partner': 'Diventa partner',
    'nav.about': 'Chi siamo',
    'lang.switch_to_en': 'EN',
    'lang.switch_to_it': 'IT',
    'lang.current_it': 'Italiano',
    'lang.current_en': 'English',
    'footer.copyright': '© Localis · Audioguide narrative della Puglia',
    'footer.terms': 'Termini',
    'footer.privacy': 'Privacy',
    'a11y.skip_to_content': 'Salta al contenuto principale',
  },
  en: {
    'site.name': 'Localis',
    'site.tagline': 'Narrative audio guides · Puglia',
    'nav.home': 'Home',
    'nav.guide': 'Guides',
    'nav.partner': 'Become a partner',
    'nav.about': 'About',
    'lang.switch_to_en': 'EN',
    'lang.switch_to_it': 'IT',
    'lang.current_it': 'Italiano',
    'lang.current_en': 'English',
    'footer.copyright': '© Localis · Narrative audio guides for Puglia',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy',
    'a11y.skip_to_content': 'Skip to main content',
  },
} as const;

export type StringKey = keyof typeof STRINGS['it'];

/**
 * Lookup a translation. Falls back to Italian if key missing in English.
 */
export function t(key: StringKey, lang: Lang): string {
  return STRINGS[lang][key] ?? STRINGS.it[key];
}
```

- [ ] **Step 4: Create src/pages/en/index.astro**

Write to `src/pages/en/index.astro`:

```astro
---
import Layout from '../../components/Layout.astro';
---
<Layout title="Localis — design tokens preview" lang="en">
  <main class="max-w-wrap mx-auto px-md py-2xl">
    <h1 class="font-display text-4xl mb-md">English homepage placeholder</h1>
    <p class="text-base text-ink-muted">Replaced in Milestone B.</p>
  </main>
</Layout>
```

- [ ] **Step 5: Verify both routes work**

```bash
pnpm dev
```

Open http://localhost:4321/ → Italian preview. Open http://localhost:4321/en/ → English placeholder. Both should render in correct language.

- [ ] **Step 6: Commit i18n skeleton**

```bash
git add astro.config.mjs src/lib/i18n.ts src/lib/i18n-strings.ts src/pages/en/index.astro
git commit -m "feat: add i18n routing (IT default, /en/ for English) with translation helpers"
```

---

## Task 7: Implement i18n unit test

**Files:**
- Create: `tests/unit/i18n.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
pnpm add -D vitest @vitest/ui
```

- [ ] **Step 2: Create vitest.config.ts**

Write to repo root `vitest.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': new URL('./src', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 3: Write the failing test**

Create `tests/unit/i18n.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { localizedHref, stripLocalePrefix, alternateLangUrl } from '../../src/lib/i18n';
import { t } from '../../src/lib/i18n-strings';

describe('i18n helpers', () => {
  describe('localizedHref', () => {
    it('returns path unchanged for Italian', () => {
      expect(localizedHref('/guide/bari-vecchia', 'it')).toBe('/guide/bari-vecchia');
    });

    it('prefixes path with /en for English', () => {
      expect(localizedHref('/guide/bari-vecchia', 'en')).toBe('/en/guide/bari-vecchia');
    });

    it('handles paths without leading slash', () => {
      expect(localizedHref('guide/porto-bari', 'en')).toBe('/en/guide/porto-bari');
    });

    it('handles root path', () => {
      expect(localizedHref('/', 'it')).toBe('/');
      expect(localizedHref('/', 'en')).toBe('/en/');
    });
  });

  describe('stripLocalePrefix', () => {
    it('strips /en prefix', () => {
      expect(stripLocalePrefix('/en/guide/bari-vecchia')).toBe('/guide/bari-vecchia');
    });

    it('leaves Italian paths unchanged', () => {
      expect(stripLocalePrefix('/guide/porto-bari')).toBe('/guide/porto-bari');
    });

    it('handles bare /en correctly', () => {
      expect(stripLocalePrefix('/en')).toBe('/');
    });
  });

  describe('alternateLangUrl', () => {
    it('flips IT path to EN equivalent', () => {
      expect(alternateLangUrl('/guide/bari-vecchia', 'it')).toBe('/en/guide/bari-vecchia');
    });

    it('flips EN path to IT equivalent', () => {
      expect(alternateLangUrl('/en/guide/bari-vecchia', 'en')).toBe('/guide/bari-vecchia');
    });
  });
});

describe('translation lookup t()', () => {
  it('returns Italian string for IT lang', () => {
    expect(t('site.tagline', 'it')).toBe('Audioguide narrative · Puglia');
  });

  it('returns English string for EN lang', () => {
    expect(t('site.tagline', 'en')).toBe('Narrative audio guides · Puglia');
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: all tests PASS. If failures, fix `src/lib/i18n.ts` or the test until passing.

- [ ] **Step 5: Commit tests**

```bash
git add vitest.config.ts tests/unit/i18n.test.ts package.json pnpm-lock.yaml
git commit -m "test: add unit tests for i18n helpers and translation lookup"
```

---

## Task 8: Build Header component

**Files:**
- Create: `src/components/Header.astro`, `src/components/SkipLink.astro`, `src/components/LangSwitcher.astro`
- Modify: `src/components/Layout.astro`

- [ ] **Step 1: Create SkipLink component**

Write to `src/components/SkipLink.astro`:

```astro
---
import { t } from '../lib/i18n-strings';
import type { Lang } from '../lib/i18n';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
---
<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:top-md focus:left-md focus:z-50 focus:bg-ink focus:text-surface focus:px-md focus:py-sm focus:rounded-md focus:shadow-elev focus:no-underline"
>
  {t('a11y.skip_to_content', lang)}
</a>
```

- [ ] **Step 2: Create LangSwitcher component**

Write to `src/components/LangSwitcher.astro`:

```astro
---
import { alternateLangUrl, type Lang } from '../lib/i18n';
import { t } from '../lib/i18n-strings';

export interface Props {
  lang: Lang;
  currentPath: string;
}

const { lang, currentPath } = Astro.props;
const altUrl = alternateLangUrl(currentPath, lang);
const altLang: Lang = lang === 'it' ? 'en' : 'it';
---
<a
  href={altUrl}
  class="font-body text-xs font-semibold tracking-widest uppercase text-ink-subtle hover:text-ink no-underline transition-colors duration-fast"
  aria-label={`Switch language to ${t(`lang.current_${altLang}`, lang)}`}
>
  {t(`lang.switch_to_${altLang}`, lang)}
</a>
```

- [ ] **Step 3: Create Header component**

Write to `src/components/Header.astro`:

```astro
---
import { t } from '../lib/i18n-strings';
import { localizedHref, type Lang } from '../lib/i18n';
import LangSwitcher from './LangSwitcher.astro';

export interface Props {
  lang: Lang;
  currentPath: string;
}

const { lang, currentPath } = Astro.props;
---
<header class="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-border">
  <div class="max-w-wrap mx-auto px-md flex items-center justify-between h-14">
    <a
      href={localizedHref('/', lang)}
      class="font-display text-xl font-medium tracking-tight text-ink no-underline"
      aria-label={t('site.name', lang)}
    >
      Loc<em class="text-accent not-italic">alis</em>
    </a>

    <nav class="flex items-center gap-lg">
      <a
        href={localizedHref('/diventa-partner', lang)}
        class="font-body text-sm font-medium text-ink-muted hover:text-ink no-underline transition-colors duration-fast hidden sm:inline"
      >
        {t('nav.partner', lang)}
      </a>
      <LangSwitcher lang={lang} currentPath={currentPath} />
    </nav>
  </div>
</header>
```

- [ ] **Step 4: Update Layout to include Header + SkipLink + main wrapper**

Replace `src/components/Layout.astro` with:

```astro
---
import '../styles/global.css';
import SkipLink from './SkipLink.astro';
import Header from './Header.astro';
import { type Lang } from '../lib/i18n';

export interface Props {
  title: string;
  description?: string;
  lang?: Lang;
}

const { title, description = '', lang = 'it' } = Astro.props;
const currentPath = Astro.url.pathname;
---
<!DOCTYPE html>
<html lang={lang}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#FAF7F2" />
  <title>{title}</title>
  {description && <meta name="description" content={description} />}

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>
<body class="bg-surface text-ink font-body antialiased min-h-screen flex flex-col">
  <SkipLink lang={lang} />
  <Header lang={lang} currentPath={currentPath} />

  <main id="main" class="flex-1">
    <slot />
  </main>
</body>
</html>
```

- [ ] **Step 5: Add Tailwind utility for sr-only (visually hidden)**

Astro Tailwind already includes `sr-only` and `not-sr-only` utilities. No changes needed; verify in next step.

- [ ] **Step 6: Visual check**

```bash
pnpm dev
```

Open http://localhost:4321/. Verify:
- ✓ Header sticky at top with `Loc**alis**` logo (terracotta italic on "alis" — actually `not-italic` because the wordmark uses Spectral mid-weight not italic — verify it reads as intentional emphasis, not actual italic)
- ✓ "Diventa partner" link visible on desktop, hidden on mobile (resize window)
- ✓ "EN" toggle on right; click → goes to `/en/`; toggle becomes "IT"
- ✓ Tab key reveals Skip Link in top-left when focused
- ✓ All transitions feel smooth (no janky animations)

- [ ] **Step 7: Commit Header + LangSwitcher**

```bash
git add src/components/Header.astro src/components/LangSwitcher.astro src/components/SkipLink.astro src/components/Layout.astro
git commit -m "feat: add Header with logo, partner link, language switcher, and skip-to-content"
```

---

## Task 9: Build Footer component

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/components/Layout.astro`

- [ ] **Step 1: Create Footer component**

Write to `src/components/Footer.astro`:

```astro
---
import { t } from '../lib/i18n-strings';
import { localizedHref, type Lang } from '../lib/i18n';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="border-t border-border mt-3xl">
  <div class="max-w-wrap mx-auto px-md py-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-lg">
    <div>
      <p class="font-display text-xl text-ink mb-2xs">
        Loc<em class="text-accent not-italic">alis</em>
      </p>
      <p class="text-sm text-ink-muted">
        {t('footer.copyright', lang)} · {year}
      </p>
    </div>

    <nav class="flex items-center gap-lg">
      <a
        href={localizedHref('/termini', lang)}
        class="text-sm text-ink-muted hover:text-ink no-underline transition-colors duration-fast"
      >
        {t('footer.terms', lang)}
      </a>
      <a
        href={localizedHref('/privacy', lang)}
        class="text-sm text-ink-muted hover:text-ink no-underline transition-colors duration-fast"
      >
        {t('footer.privacy', lang)}
      </a>
      <a
        href="mailto:hello@localis.guide"
        class="text-sm text-ink-muted hover:text-ink no-underline transition-colors duration-fast"
      >
        hello@localis.guide
      </a>
    </nav>
  </div>
</footer>
```

- [ ] **Step 2: Update Layout to include Footer**

Modify `src/components/Layout.astro` — add Footer import and render. Replace contents with:

```astro
---
import '../styles/global.css';
import SkipLink from './SkipLink.astro';
import Header from './Header.astro';
import Footer from './Footer.astro';
import { type Lang } from '../lib/i18n';

export interface Props {
  title: string;
  description?: string;
  lang?: Lang;
}

const { title, description = '', lang = 'it' } = Astro.props;
const currentPath = Astro.url.pathname;
---
<!DOCTYPE html>
<html lang={lang}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#FAF7F2" />
  <title>{title}</title>
  {description && <meta name="description" content={description} />}

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>
<body class="bg-surface text-ink font-body antialiased min-h-screen flex flex-col">
  <SkipLink lang={lang} />
  <Header lang={lang} currentPath={currentPath} />

  <main id="main" class="flex-1">
    <slot />
  </main>

  <Footer lang={lang} />
</body>
</html>
```

- [ ] **Step 3: Visual check**

```bash
pnpm dev
```

Open http://localhost:4321/. Scroll to bottom. Verify:
- ✓ Footer appears with logo, copyright + current year
- ✓ "Termini", "Privacy", email link visible
- ✓ Border-top separates footer from main content

- [ ] **Step 4: Commit Footer**

```bash
git add src/components/Footer.astro src/components/Layout.astro
git commit -m "feat: add Footer with copyright, legal links, and contact email"
```

---

## Task 10: Define Astro Content Collection schemas

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Create content collection schema**

Write to `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const guides = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    city: z.enum([
      'bari',
      'polignano',
      'ostuni',
      'lecce',
      'matera',
      'trani',
      'otranto',
      'gallipoli',
      'alberobello',
      'vieste',
    ]),
    title_it: z.string(),
    title_en: z.string(),
    subtitle_it: z.string(),
    subtitle_en: z.string(),
    duration_seconds: z.number().int().positive(),
    cover: z.string(),
    audio_full_key_it: z.string(),
    audio_full_key_en: z.string(),
    audio_trailer_path: z.string(),
    chapters: z
      .array(
        z.object({
          title_it: z.string(),
          title_en: z.string(),
          start_seconds: z.number().int().nonnegative(),
        }),
      )
      .min(1),
    coords_start: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    price_cents: z.number().int().default(499),
    status: z.enum(['live', 'soon', 'archived']).default('live'),
    published_at: z.date(),
    seo: z.object({
      description_it: z.string().max(160),
      description_en: z.string().max(160),
    }),
  }),
});

const partners = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    display_name: z.string(),
    type: z.enum(['hotel', 'bb', 'bar', 'restaurant', 'shop', 'other']),
    city: z.string(),
    contact_email: z.string().email(),
    stripe_account_id: z.string().regex(/^acct_/),
    commission_rate: z.number().min(0).max(0.5).default(0.25),
    created_at: z.date(),
    status: z.enum(['active', 'paused', 'terminated']),
    custom_landing_copy_it: z.string().optional(),
    custom_landing_copy_en: z.string().optional(),
  }),
});

export const collections = { guides, partners };
```

- [ ] **Step 2: Verify type generation**

```bash
pnpm astro sync
```

Expected: ".astro/types.d.ts" generated. Type-safe content collections now available across the codebase.

- [ ] **Step 3: Commit schema**

```bash
git add src/content/config.ts
git commit -m "feat: define Astro Content Collection schemas for guides and partners"
```

---

## Task 11: Configure Netlify deploy

**Files:**
- Create: `netlify.toml`
- GitHub repo creation + Netlify connection

- [ ] **Step 1: Create netlify.toml**

Write to repo root `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "pnpm build"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--no-frozen-lockfile"

# Cache headers for build assets (Astro outputs to /_astro/)
[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache headers for trailers (immutable once published)
[[headers]]
  for = "/audio/trailers/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache headers for static images
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000"

# HTML: short cache, allow stale while revalidate
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

- [ ] **Step 2: Test build locally**

```bash
pnpm build
```

Expected: builds to `dist/` with no errors. Verify `dist/index.html` and `dist/en/index.html` exist.

- [ ] **Step 3: Test build output locally**

```bash
pnpm preview
```

Expected: Astro serves built site at http://localhost:4321/. Visual check matches dev mode.

`Ctrl+C` to stop.

- [ ] **Step 4: Create GitHub repo via gh CLI**

```bash
gh repo create localis-guide --private --source=. --remote=origin --description "Localis — narrative audio guides for Puglia"
```

Expected: repo created at `https://github.com/<your-username>/localis-guide`. Local `origin` remote set.

- [ ] **Step 5: Push initial commits**

```bash
git push -u origin main
```

Expected: all commits pushed.

- [ ] **Step 6: Connect Netlify to GitHub repo**

Run interactive Netlify init:

```bash
netlify init
```

Choose:
- "Create & configure a new site"
- Team: your team
- Site name: `localis-guide-v2` (the existing `localis-guide` is taken by current drag-and-drop site)
- Build command: leave default (it reads from netlify.toml)
- Publish directory: leave default
- Authorize GitHub if prompted

Expected: Netlify creates new site, links to GitHub, triggers first build.

- [ ] **Step 7: Wait for first deploy**

```bash
netlify watch
```

Or check https://app.netlify.com/sites/localis-guide-v2/deploys. First deploy takes 1-2 minutes.

- [ ] **Step 8: Verify deploy live**

Open the Netlify-assigned URL (e.g., `https://localis-guide-v2.netlify.app`). Verify:
- ✓ Token preview page renders
- ✓ Spectral + Schibsted Grotesk fonts loaded
- ✓ Header + Footer present
- ✓ `/en/` route works

- [ ] **Step 9: Commit netlify.toml**

```bash
git add netlify.toml
git commit -m "chore: configure Netlify build settings, cache headers, security headers"
git push origin main
```

This triggers a redeploy with the new `netlify.toml` config. Verify cache headers via browser DevTools → Network → click any `/_astro/*` asset → "Cache-Control: public, max-age=31536000, immutable".

---

## Task 12: Add Playwright E2E test for homepage

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/homepage.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

Expected: Playwright installed. Chromium binary downloaded (~200MB).

- [ ] **Step 2: Create playwright.config.ts**

Write to repo root `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Write the failing E2E test**

Write to `tests/e2e/homepage.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders Italian page with logo and language switcher', async ({ page }) => {
    await page.goto('/');

    // Header logo present
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Localis' })).toBeVisible();

    // Italian content
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');

    // Language switcher to English
    const langSwitch = page.getByRole('link', { name: /switch language/i });
    await expect(langSwitch).toBeVisible();
    await expect(langSwitch).toHaveText('EN');
  });

  test('switches to English page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /switch language/i }).click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('skip-to-content link appears on Tab focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content|salta al contenuto/i });
    await expect(skipLink).toBeFocused();
  });

  test('footer renders copyright and links', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/© Localis/)).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Termini' })).toBeVisible();
  });
});
```

- [ ] **Step 4: Run E2E test**

```bash
pnpm test:e2e
```

Expected: all 4 tests PASS in both chromium + mobile-safari projects.

If failures: debug via `pnpm exec playwright test --headed` to watch live in browser.

- [ ] **Step 5: Add .gitignore entries for Playwright**

Append to `.gitignore`:

```
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 6: Commit E2E setup**

```bash
git add playwright.config.ts tests/e2e/homepage.spec.ts package.json pnpm-lock.yaml .gitignore
git commit -m "test: add Playwright E2E config and homepage smoke tests"
git push origin main
```

---

## Task 13: Final milestone polish + tag

- [ ] **Step 1: Run full quality gate**

```bash
pnpm check && pnpm test && pnpm test:e2e && pnpm build
```

Expected: all 4 commands pass with no errors.

- [ ] **Step 2: Lighthouse mobile run**

Open Netlify deploy URL (`https://localis-guide-v2.netlify.app`) in Chrome incognito. DevTools → Lighthouse → Mobile → Performance + Accessibility + Best Practices + SEO → Run.

Expected scores:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90 (will improve to 100 in Milestone F with sitemap + structured data)

If Performance < 90: investigate font loading delay. Possible fix: `<link rel="preload">` for Spectral + Schibsted Grotesk woff2 files (Astro auto-handles in Milestone F).

- [ ] **Step 3: Tag milestone complete**

```bash
git tag phase-0-A-complete
git push origin phase-0-A-complete
```

- [ ] **Step 4: Update master plan checklist**

Open [2026-04-28-localis-phase-0-foundation.md](./2026-04-28-localis-phase-0-foundation.md). Manually edit the Decomposition table to mark Milestone A row "✅ complete".

```bash
git add docs/superpowers/plans/2026-04-28-localis-phase-0-foundation.md
git commit -m "docs: mark Milestone A complete in master plan"
git push origin main
```

---

## Milestone A exit criteria

Verify each before proceeding to Milestone B:

- [ ] ✅ Git repo initialized at `localis-guide` on GitHub
- [ ] ✅ Astro 5 + TypeScript strict mode + Tailwind CSS configured
- [ ] ✅ OKLCH design tokens (palette + type scale + spacing) in `src/styles/tokens.css`
- [ ] ✅ Spectral + Schibsted Grotesk fonts load on every page
- [ ] ✅ Layout component with Header + Footer + SkipLink + main slot
- [ ] ✅ i18n routing: `/` IT default, `/en/` EN; lang attribute correct; LangSwitcher works
- [ ] ✅ Astro Content Collections schemas defined for guides + partners
- [ ] ✅ Netlify deploys preview URL on every push
- [ ] ✅ Vitest unit tests pass (`pnpm test`)
- [ ] ✅ Playwright E2E homepage tests pass (`pnpm test:e2e`)
- [ ] ✅ `pnpm build` produces clean `dist/` with no errors
- [ ] ✅ Lighthouse mobile: Perf ≥90, A11y ≥95, BP ≥95, SEO ≥90
- [ ] ✅ Tag `phase-0-A-complete` pushed

---

➡️ **Next: [Milestone B — Public site](2026-04-28-localis-phase-0-B-public-site.md)** (homepage, guide pages, trailers, legal pages, content collection content)
