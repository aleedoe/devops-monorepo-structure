# 🏗️ PNPM + Turborepo Monorepo — Shared Validators Demo

A **minimal, fully working** monorepo that demonstrates how shared packages work across **Next.js** and **Express** using **PNPM Workspaces** and **Turborepo**.

This project exists to **remove confusion** about:

- Where `node_modules` actually lives in a monorepo
- How symlinks work
- How Next.js can import a shared package located _outside_ its root folder
- How Express and Next.js can share the **same** Zod validator package
- What the correct setup flow is from scratch

---

## Table of Contents

1. [Overview](#1-overview)
2. [Step-by-Step Setup](#2-step-by-step-setup)
3. [Folder Structure](#3-folder-structure)
4. [Config Files Explained](#4-config-files-explained)
5. [Source Code Walkthrough](#5-source-code-walkthrough)
6. [Understanding node_modules & Symlinks](#6-understanding-node_modules--symlinks)
7. [Understanding Deployment Behavior](#7-understanding-deployment-behavior)

---

## 1. Overview

### Architecture

```
┌───────────────────────────────────────────────────┐
│                  MONOREPO ROOT                     │
│                                                    │
│  ┌─────────────────┐    ┌─────────────────────┐   │
│  │   apps/web       │    │   apps/api           │   │
│  │   (Next.js)      │    │   (Express)          │   │
│  │   Port 3000      │    │   Port 3001          │   │
│  └────────┬─────────┘    └────────┬─────────────┘   │
│           │                       │                  │
│           │    ┌──────────────┐   │                  │
│           └───►│  packages/   │◄──┘                  │
│                │  validators  │                      │
│                │  (Zod)       │                      │
│                └──────────────┘                      │
│                                                      │
│  📦 pnpm-workspace.yaml    (defines workspace)      │
│  ⚡ turbo.json              (orchestrates tasks)     │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer             | Technology              |
| ----------------- | ----------------------- |
| Package Manager   | PNPM (Workspaces)       |
| Monorepo Tool     | Turborepo               |
| Web App           | Next.js 15 (App Router) |
| API Server        | Express (TypeScript)    |
| Shared Validation | Zod                     |
| Build Tool        | tsup (for validators)   |
| Language          | TypeScript everywhere   |

### The Core Idea

```
                ┌─────────────────────────────┐
                │     @repo/validators        │
                │                             │
                │   userSchema = z.object({   │
                │     name: z.string(),       │
                │     email: z.string(),      │
                │     age: z.number(),        │
                │   })                        │
                └──────────┬──────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐     ┌──────────▼──────────┐
     │  apps/web        │     │  apps/api            │
     │                  │     │                      │
     │  import {        │     │  import {            │
     │    userSchema    │     │    userSchema        │
     │  } from          │     │  } from              │
     │  "@repo/         │     │  "@repo/             │
     │   validators"    │     │   validators"        │
     └──────────────────┘     └──────────────────────┘

          SAME import            SAME import
          SAME schema            SAME schema
          ✅ Zero duplication    ✅ Always in sync
```

---

## 2. Step-by-Step Setup

### Prerequisites

Make sure you have installed:

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **PNPM** v9+ → `npm install -g pnpm`

### Step 1: Create the Root Folder

```bash
mkdir devops-monorepo-structure
cd devops-monorepo-structure
```

**Why?** Every monorepo starts with a root folder that will contain all your apps and shared packages.

### Step 2: Initialize the Root `package.json`

```bash
pnpm init
```

Then edit `package.json` to make it `"private": true` and add Turborepo scripts. See [Section 4](#4-config-files-explained) for the full content.

**Why?**

- `"private": true` — prevents accidentally publishing the root package to npm.
- The root `package.json` only contains **scripts** and **dev dependencies** shared across the repo (like `turbo` and `typescript`).

### Step 3: Create `pnpm-workspace.yaml`

Create the file at the root:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Why?** This file tells PNPM: _"Hey, look inside `apps/` and `packages/` — each subfolder with a `package.json` is a separate workspace."_

Without this file, PNPM treats the repo as a single package and ignores the sub-packages entirely.

### Step 4: Create `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Why?**

- `"dependsOn": ["^build"]` — the `^` means "build my **dependencies** first". So if `apps/web` depends on `packages/validators`, Turborepo will build `validators` **before** building `web`.
- `"persistent": true` — dev servers don't exit, so Turborepo must keep them alive.
- `"cache": false` — dev mode shouldn't be cached.

### Step 5: Create the Shared Package (`packages/validators`)

```bash
mkdir -p packages/validators/src
```

Then create:

- `packages/validators/package.json`
- `packages/validators/tsconfig.json`
- `packages/validators/tsup.config.ts`
- `packages/validators/src/user.schema.ts`
- `packages/validators/src/index.ts`

See [Section 5](#5-source-code-walkthrough) for full content.

**Why?**

- This is the **single source of truth** for your validation logic.
- Both `apps/web` and `apps/api` will import from `@repo/validators`.
- `tsup` bundles it into both CommonJS and ESM formats so it works everywhere.

### Step 6: Create the Express API (`apps/api`)

```bash
mkdir -p apps/api/src
```

Then create:

- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/index.ts`

**Why?** The API server uses the shared Zod schema to validate incoming requests. If the schema changes in `packages/validators`, the API automatically gets the update.

### Step 7: Create the Next.js App (`apps/web`)

```bash
mkdir -p apps/web/src/app
```

Then create:

- `apps/web/package.json`
- `apps/web/next.config.js` ← **Critical: must include `transpilePackages`!**
- `apps/web/tsconfig.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`

**Why?** The web app uses the same shared Zod schema for client-side validation. The key insight is `transpilePackages: ["@repo/validators"]` in `next.config.js` — this tells Next.js to compile code from outside its own folder.

### Step 8: Install ALL Dependencies

```bash
# From the root of the monorepo
pnpm install
```

**Why?** PNPM reads `pnpm-workspace.yaml`, finds all workspace packages, and:

1. Installs all `node_modules` at the **root** (hoisted)
2. Creates **symlinks** in each workspace's `node_modules` pointing to the shared packages
3. Resolves `workspace:*` references to local packages instead of downloading from npm

> **⚠️ IMPORTANT:** Always run `pnpm install` from the **root** of the monorepo, never from inside a sub-folder.

### Step 9: Build Everything

```bash
pnpm build
```

**Why?** Turborepo will:

1. First build `packages/validators` (because `apps/*` depend on it via `^build`)
2. Then build `apps/api` and `apps/web` in parallel

The build order is **automatic** — Turborepo reads the dependency graph.

### Step 10: Run Dev Servers

```bash
pnpm dev
```

This starts **all** dev servers simultaneously:

- 🌐 Next.js → `http://localhost:3000`
- 🔥 Express → `http://localhost:3001`
- 👀 Validators → watching for changes (via `tsup --watch`)

---

## 3. Folder Structure

After completing all steps, your project looks like this:

```
devops-monorepo-structure/
├── 📄 .gitignore
├── 📄 .npmrc                          # PNPM configuration
├── 📄 package.json                    # Root — scripts + devDeps only
├── 📄 pnpm-workspace.yaml            # Defines workspace packages
├── 📄 turbo.json                      # Turborepo task pipeline
├── 📄 tsconfig.json                   # Base TypeScript config
├── 📄 README.md
│
├── 📦 node_modules/                   # ← ALL deps hoisted here
│   ├── @repo/
│   │   └── validators → ../../packages/validators  ← SYMLINK!
│   ├── react/
│   ├── next/
│   ├── express/
│   ├── zod/
│   └── ... (every dependency)
│
├── 📁 apps/
│   ├── 📁 api/                        # Express API Server
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 📁 src/
│   │       └── 📄 index.ts            # POST /users endpoint
│   │
│   └── 📁 web/                        # Next.js Web App
│       ├── 📄 package.json
│       ├── 📄 next.config.js          # transpilePackages config
│       ├── 📄 tsconfig.json
│       └── 📁 src/
│           └── 📁 app/
│               ├── 📄 layout.tsx
│               ├── 📄 page.tsx        # Validation demo page
│               └── 📄 globals.css
│
└── 📁 packages/
    └── 📁 validators/                 # Shared Zod Schemas
        ├── 📄 package.json
        ├── 📄 tsconfig.json
        ├── 📄 tsup.config.ts
        ├── 📁 dist/                   # ← Build output (after pnpm build)
        │   ├── index.js               # CommonJS
        │   ├── index.mjs              # ESM
        │   └── index.d.ts             # Type declarations
        └── 📁 src/
            ├── 📄 index.ts            # Barrel export
            └── 📄 user.schema.ts      # Zod schema definition
```

---

## 4. Config Files Explained

### `pnpm-workspace.yaml` (Root)

```yaml
packages:
  - "apps/*" # Each folder inside apps/ is a workspace
  - "packages/*" # Each folder inside packages/ is a workspace
```

This is how PNPM knows where to find workspace packages. Without this, `workspace:*` references in `package.json` files won't work.

---

### `package.json` (Root)

```json
{
  "name": "devops-monorepo-structure",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.4.4",
    "typescript": "^5.7.3"
  },
  "packageManager": "pnpm@9.15.4"
}
```

| Key               | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `private: true`   | Prevents publishing root to npm              |
| `scripts`         | Delegates everything to Turborepo            |
| `devDependencies` | Only monorepo-wide tools (turbo, typescript) |
| `packageManager`  | Ensures everyone uses the same PNPM version  |

---

### `turbo.json` (Root)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

| Key                | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `^build`           | Build dependencies first (validators → then apps)  |
| `outputs`          | Files produced by builds (for caching)             |
| `cache: false`     | Don't cache dev mode                               |
| `persistent: true` | Keep dev servers alive (they don't naturally exit) |

---

### `next.config.js` (apps/web)

```js
const nextConfig = {
  transpilePackages: ["@repo/validators"],
};
```

> **🔑 This is the most important config in the entire monorepo for Next.js.**
>
> Without `transpilePackages`, Next.js would refuse to compile code from `packages/validators/` because it lives **outside** the `apps/web/` directory.
>
> This option tells Next.js: _"Trust me, this package needs to be transpiled by my bundler, even though it's not in my folder."_

---

### `.npmrc` (Root)

```
public-hoist-pattern[]=*
```

This tells PNPM to hoist **all** packages to the root `node_modules/`. Without this, some packages (especially React and Next.js) may fail because they expect their dependencies to be at a shared location.

---

## 5. Source Code Walkthrough

### Shared Validator: `packages/validators/src/user.schema.ts`

```typescript
import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
  age: z
    .number()
    .int("Age must be a whole number")
    .positive("Age must be a positive number")
    .optional(),
});

export type User = z.infer<typeof userSchema>;
```

This is the **single source of truth**. Both apps import from here. If you change a validation rule, both apps update automatically.

---

### Express API: `apps/api/src/index.ts`

```typescript
import { userSchema } from "@repo/validators"; // ← Shared import!

app.post("/users", (req, res) => {
  const result = userSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: result.data,
  });
});
```

**Test it:**

```bash
# Valid request
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 25}'

# Invalid request
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "J", "email": "bad", "age": -1}'
```

---

### Next.js Page: `apps/web/src/app/page.tsx`

```typescript
import { userSchema } from "@repo/validators"; // ← SAME shared import!

function validate(data: unknown) {
  const result = userSchema.safeParse(data);
  // Show success or error to user...
}
```

The page has two buttons:

- ✅ "Validate Good Data" — validates `{ name: "John Doe", email: "john@example.com", age: 25 }`
- ❌ "Validate Bad Data" — validates `{ name: "J", email: "not-an-email", age: -5 }`

Both use the **exact same `userSchema`** as the Express API.

---

## 6. Understanding node_modules & Symlinks

This is where most people get confused. Let's clear it up.

### Where does `node_modules` actually live?

```
devops-monorepo-structure/
├── node_modules/          ← 🟢 THE MAIN ONE (root)
│   ├── react/
│   ├── next/
│   ├── express/
│   ├── zod/
│   ├── typescript/
│   ├── @repo/
│   │   └── validators/   ← This is a SYMLINK (see below)
│   └── ... (everything)
│
├── apps/
│   ├── web/
│   │   └── node_modules/  ← 🟡 MAY or MAY NOT exist
│   └── api/
│       └── node_modules/  ← 🟡 MAY or MAY NOT exist
│
└── packages/
    └── validators/
        └── node_modules/  ← 🟡 MAY or MAY NOT exist
```

### The Rule

> **ALL dependencies are installed in the ROOT `node_modules/`.**
>
> Sub-workspace `node_modules/` folders only appear when there are version conflicts (e.g., `apps/web` needs `react@19` but `apps/api` needs `react@18`).

### What is a Symlink?

A **symlink** (symbolic link) is like a **shortcut** on your computer.

When you run `pnpm install`, PNPM creates this symlink:

```
node_modules/@repo/validators  →  packages/validators
```

This means:

- When `apps/web/src/app/page.tsx` does `import { userSchema } from "@repo/validators"`
- Node.js looks in `node_modules/@repo/validators/`
- That folder is actually a **shortcut** pointing to `packages/validators/`
- So it reads the files from `packages/validators/dist/`

```
┌──────────────────────────────┐
│  import from "@repo/validators"
└─────────────┬────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  node_modules/@repo/validators
│  (this is a SYMLINK)
└─────────────┬────────────────┘
              │ points to
              ▼
┌──────────────────────────────┐
│  packages/validators/
│  (the actual code)
└──────────────────────────────┘
```

### How Node Module Resolution Works

When any file does `import { userSchema } from "@repo/validators"`:

1. Node.js starts looking for `@repo/validators` in `node_modules/`
2. It first checks the **current directory's** `node_modules/`
3. If not found, it walks **up** the directory tree
4. Eventually reaches the **root** `node_modules/`
5. Finds `@repo/validators` (the symlink)
6. Follows the symlink to `packages/validators/`
7. Reads `package.json` → `"main": "./dist/index.js"`
8. Imports `packages/validators/dist/index.js`

This is standard Node.js module resolution — the monorepo tooling just leverages it via symlinks.

### Why might `apps/web/node_modules` appear?

This can happen when:

- A package needs a **different version** than what's hoisted at root
- PNPM's strict isolation mode creates `.pnpm` directories
- Next.js generates its own cache inside `node_modules/.cache`

**This is normal behavior** — it doesn't mean your setup is broken.

---

## 7. Understanding Deployment Behavior

### What Happens During `next build`

```
pnpm build
  │
  ├─→  1. Turborepo reads turbo.json
  │       Sees build.dependsOn: ["^build"]
  │       Determines: validators must build FIRST
  │
  ├─→  2. packages/validators: tsup runs
  │       Input:  src/index.ts + src/user.schema.ts
  │       Output: dist/index.js, dist/index.mjs, dist/index.d.ts
  │
  ├─→  3. apps/api: tsc runs
  │       Imports @repo/validators from dist/
  │       Output: dist/ (compiled JS)
  │
  └─→  4. apps/web: next build runs
          Sees transpilePackages: ["@repo/validators"]
          Follows symlink to packages/validators/
          Bundles the validator code INTO the Next.js build
          Output: .next/ (fully self-contained)
```

### Why Importing Outside Web Root Works

People often worry: _"The validators package is in `packages/validators/`, which is outside `apps/web/`. Won't this break?"_

**No, it won't break. Here's why:**

1. **During development:** `transpilePackages` tells Next.js's Webpack/Turbopack to follow the symlink and compile the code, even though it's outside `apps/web/`.

2. **During build:** Next.js bundles **everything** into the `.next/` folder. The compiled validator code is **copied into** the bundle. The final `.next/` output is completely self-contained.

3. **During deployment:** You deploy the `.next/` folder. It doesn't care where the source code came from — everything it needs is already bundled inside.

```
BEFORE BUILD:                      AFTER BUILD:

packages/validators/src/ ──┐       apps/web/.next/
                           │          └── (validator code is
apps/web/src/ ─────────────┤               BUNDLED INSIDE here)
                           │
                           └──→    No external dependencies!
                                   Fully self-contained! ✅
```

### Why This Does NOT Break Deployment

| Concern                               | Reality                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------- |
| _"Files are outside web root"_        | Doesn't matter — `transpilePackages` handles it                           |
| _"Symlinks won't work in production"_ | Symlinks are only needed during dev/build, not at runtime                 |
| _"node_modules structure differs"_    | Build output is bundled — no `node_modules` needed at runtime for Next.js |
| _"Vercel won't understand this"_      | Vercel has native monorepo support and understands PNPM workspaces        |

### Deploying to Vercel

Vercel automatically detects PNPM workspaces. In your project settings:

- **Root Directory:** `apps/web`
- **Build Command:** `cd ../.. && pnpm build --filter=@repo/web`
- **Output Directory:** `.next`

Vercel will install all dependencies, build validators first (respecting Turborepo's pipeline), then build the Next.js app.

---

## Quick Reference

```bash
# Install all dependencies (always from root!)
pnpm install

# Build everything (validators → api + web)
pnpm build

# Start all dev servers simultaneously
pnpm dev

# Build only the web app (with its dependencies)
pnpm build --filter=@repo/web

# Add a dependency to a specific workspace
pnpm add axios --filter=@repo/api

# Add a shared dev dependency to root
pnpm add -D prettier -w
```

---

## License

MIT
