# Vue 3 + Vite + Dexie.js + TypeScript Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate mail-mvp from vanilla JS (24 modules, ~2,324 LOC) to Vue 3 + Vite + Dexie.js + Vue Router + Pinia + TypeScript, preserving offline-first Android mobile support and adding offline email send queue.

**Architecture:** Vue 3 SPA with Composition API (`<script setup lang="ts">`), Vite bundler, Dexie.js for IndexedDB, Pinia for state management, Vue Router for navigation. Single Netlify Function (`send.js`) remains unchanged as CommonJS. PWA via `vite-plugin-pwa` replaces manual Service Worker.

**Tech Stack:** Vue 3.5, Vue Router 4.5, Pinia 3.0, Dexie 4.0, Vite 6.0, Tailwind CSS 4.0 (`@tailwindcss/vite`), TypeScript 5.5 (strict), `vite-plugin-pwa` 1.0, Vitest 3.0

**Spec:** `dados_projeto/refact_vue.md` (1,267 lines, 11 sections)

**Execution order:** Phase 1 (Infra) → Phase 4 (Dexie) → Phase 2 (Vue scaffold) → Phase 3 (Stores/Composables) → Phase 5 (Components) → Phase 6 (PWA) → Phase 7 (Tests) → Phase 8 (Cleanup)

---

## File Structure

### New files (~50)

| File | Responsibility |
|------|---------------|
| `vite.config.ts` | Vite + Vue + Tailwind + PWA plugins, dev proxy |
| `tsconfig.json` | TypeScript strict config, path aliases `@/*` |
| `tsconfig.test.json` | Composite TS config for test files |
| `vitest.config.ts` | Vitest with vue plugin, jsdom, path aliases |
| `index.html` | Vite entry point |
| `src/env.d.ts` | Vue type declarations |
| `src/main.ts` | createApp + Pinia + Router + mount |
| `src/App.vue` | Layout root: sidebar + router-view + global modals |
| `src/router/index.ts` | Routes: `/` → FormPage |
| `src/stores/form.ts` | Pinia: form state (replaces state.js + persistence.js) |
| `src/stores/ui.ts` | Pinia: UI state (replaces ui.js) |
| `src/types/index.ts` | All TypeScript interfaces |
| `src/db/index.ts` | Dexie instance + schema (v4) |
| `src/constants/fields.ts` | Field definitions (replaces fields.js) |
| `src/composables/useEmail.ts` | composeEmail + preview |
| `src/composables/useValidation.ts` | Section validation rules |
| `src/composables/useOnlineStatus.ts` | navigator.onLine reactive detection |
| `src/composables/useOfflineQueue.ts` | PendingSends + flush on reconnect |
| `src/pages/FormPage.vue` | Route `/` — orchestrates 5 sections |
| `src/components/SecaoInicio.vue` | Section 1: Iniciais fields |
| `src/components/SecaoRetorno.vue` | Section 2: Conditional retorno fields |
| `src/components/SecaoEquipamentos.vue` | Section 3: Equipment rows |
| `src/components/SecaoAnexos.vue` | Section 4: Attachments + preview |
| `src/components/SecaoRevisao.vue` | Section 5: Review + send |
| `src/components/Sidebar.vue` | Record list + filter + edit/delete |
| `src/components/DuplicateModal.vue` | Resend confirmation modal |
| `src/components/ConfirmModal.vue` | Generic confirm modal |
| `src/components/UpdateModal.vue` | SW update prompt modal |
| `src/components/OrientationOverlay.vue` | Landscape warning overlay |
| `src/utils/compress.ts` | Image compression (pure, no DOM) |
| `src/utils/format.ts` | formatDate |
| `src/utils/base64.ts` | toBase64, blobToBase64, base64ToBlob |
| `src/utils/coordinates.ts` | captureCoordinates |
| `src/styles/main.css` | Tailwind imports + custom CSS |

### Modified files (~3)

| File | Change |
|------|--------|
| `netlify.toml` | `publish = "dist"`, `command = "npm run build"`, SPA redirect |
| `package.json` | Add Vue/Vite/Dexie/TS deps, add `dev`/`build`/`typecheck` scripts |
| `.gitignore` | Add `dist/`, `.vite/` |

### Removed in Phase 8 (~25)

| File | Reason |
|------|--------|
| `scripts/*.js` (24 files) | Replaced by Vue components/composables/stores |
| `sw.js` | Replaced by vite-plugin-pwa |
| `tailwind-input.css` | Replaced by `src/styles/main.css` |

---

## Task 1: Install Dependencies + Configure Vite + TypeScript

**Files:**
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.test.json`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install all dependencies**

```powershell
cd C:\web-projects\mail
npm install vue@^3.5 vue-router@^4 pinia@^3 dexie@^4
npm install -D vite@^6 @vitejs/plugin-vue@^5 vite-plugin-pwa@^1 @tailwindcss/vite@^4 @vue/test-utils@^2 @pinia/testing@^1 vitest@^3 jsdom@^25 fake-indexeddb@^6 @fontsource/inter@^5 typescript@^5.5 vue-tsc@^2 @types/node@^20
```

- [ ] **Step 2: Verify install succeeds**

Run: `npm ls vue vue-router pinia dexie vite typescript`
Expected: All listed with resolved versions

- [ ] **Step 3: Add scripts to package.json**

Add these to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "build:css": "tailwindcss -i tailwind-input.css -o tailwind.css --minify"
  }
}
```

Note: `build:css` is kept temporarily for backward compatibility — removed in Phase 8.

- [ ] **Step 4: Create vite.config.ts**

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

Note: PWA plugin added in Task 14.

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "tests/**/*.ts"],
  "references": [{ "path": "./tsconfig.test.json" }]
}
```

- [ ] **Step 6: Create tsconfig.test.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@vue/test-utils", "@pinia/testing"]
  },
  "include": ["tests/**/*.ts", "vitest.config.ts"]
}
```

- [ ] **Step 7: Update .gitignore — add `dist/` and `.vite/`**

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.test.json .gitignore
git commit -m "feat: add Vite + Vue 3 + TypeScript infrastructure (Phase 1)"
```

---

## Task 2: Create Vite Entry Point + Move Static Assets

**Files:**
- Create: `index.html`
- Create: `src/styles/main.css`
- Move: `manifest.json` → `public/manifest.json`
- Move: `icons/` → `public/icons/`

- [ ] **Step 1: Create index.html at project root**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#2563eb" />
  <link rel="icon" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <title>Retorno</title>
</head>
<body class="font-sans">
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Move static assets to public/**

```powershell
New-Item -ItemType Directory -Path "C:\web-projects\mail\public\icons" -Force
Copy-Item "C:\web-projects\mail\manifest.json" "C:\web-projects\mail\public\manifest.json"
Copy-Item "C:\web-projects\mail\icons\*" "C:\web-projects\mail\public\icons\" -Recurse
```

- [ ] **Step 3: Create src/styles/main.css**

```css
@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/600.css";

.is-filled {
  background-color: #eff6ff;
}
```

Note: Full `style.css` contents migrated to this file during Phase 5 component work.

- [ ] **Step 4: Commit**

```bash
git add index.html src/styles/main.css public/
git commit -m "feat: add Vite entry point + move static assets to public/ (Phase 1)"
```

---

## Task 3: Update netlify.toml for Vite + SPA

**Files:**
- Modify: `netlify.toml`
- Create: `tests/deploy/netlify-toml.test.ts`

- [ ] **Step 1: Write failing test for netlify.toml build config**

```ts
// tests/deploy/netlify-toml.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const tomlPath = resolve(__dirname, '../../netlify.toml');
const tomlContent = readFileSync(tomlPath, 'utf-8');

describe('netlify.toml', () => {
  it('should set publish to dist', () => {
    expect(tomlContent).toContain('publish = "dist"');
  });

  it('should set build command to npm run build', () => {
    expect(tomlContent).toContain('command = "npm run build"');
  });

  it('should have SPA redirect for Vue Router', () => {
    expect(tomlContent).toMatch(/from\s*=\s*\/\*\/\s+to\s*=\s*\/index\.html\/\s+status\s*=\s*200/);
  });

  it('should preserve API redirect for send function', () => {
    expect(tomlContent).toContain('/api/send');
    expect(tomlContent).toContain('/.netlify/functions/send');
  });

  it('should preserve functions directory', () => {
    expect(tomlContent).toContain('functions = "netlify/functions"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/deploy/netlify-toml.test.ts`
Expected: FAIL — current `netlify.toml` has `publish = "."` not `"dist"`

- [ ] **Step 3: Update netlify.toml**

Replace entire file:

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/send"
  to = "/.netlify/functions/send"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/icons/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/deploy/netlify-toml.test.ts`
Expected: PASS

- [ ] **Step 5: Run existing tests to confirm nothing broke**

Run: `npm test`
Expected: 394 tests pass (vanilla modules unaffected)

- [ ] **Step 6: Commit**

```bash
git add netlify.toml tests/deploy/netlify-toml.test.ts
git commit -m "feat: update netlify.toml for Vite dist/ + SPA redirect (Phase 1)"
```

---

## Task 4: Define TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create type definitions**

```ts
// src/types/index.ts

/** A single field definition (from fields.js) */
export interface FieldDefinition {
  linha?: number;
  nome: string;
  label: string;
  tipo: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'time' | 'coordinates';
  obrigatorio?: boolean;
  readonly?: boolean;
  opcoes?: string[];
  condicional?: {
    campoRef: string;
    valor: string | string[];
    negado?: boolean;
  };
}

/** Initial form data (kebab-case keys matching field.nome) */
export interface IniciaisData {
  [key: string]: string;
}

/** Retorno form data */
export interface RetornoData {
  [key: string]: string;
}

/** Equipment row */
export interface EquipamentoData {
  status: string;
  categoria: string;
  numero: string;
}

/** A saved record in IndexedDB */
export interface RecordData {
  uuid: string;
  status: 'draft' | 'sent';
  createdAt: string;
  updatedAt: string;
  iniciais: IniciaisData;
  retorno: RetornoData;
  tipoOrdem: string;
  equipamentos: EquipamentoData[];
  composicao: { complementoCorpo: string };
  attachmentCount: number;
  sentData: SentData | null;
}

/** Data stored when email is sent successfully */
export interface SentData {
  sentAt: string;
  response?: string;
}

/** Serialized attachment with IndexedDB key */
export interface StoredAttachment {
  id?: number;
  uuid: string;
  index: number;
  name: string;
  type: string;
  data: string;
}

/** Pending offline email send */
export interface PendingSendData {
  id?: number;
  uuid: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

/** Validation error for a field */
export interface FieldError {
  field: string;
  message: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions for all data models (Phase 1)"
```

---

## Task 5: Create Dexie Database + Migration

**Files:**
- Create: `src/db/index.ts`
- Create: `tests/db/dexie.test.ts`

- [ ] **Step 1: Write failing test for Dexie database**

```ts
// tests/db/dexie.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/db/index';
import type { RecordData, StoredAttachment, PendingSendData } from '../../src/types';

describe('Dexie MailDB', () => {
  beforeEach(async () => {
    await db.records.clear();
    await db.attachments.clear();
    await db.pendingSends.clear();
  });

  it('should have records store with uuid primary key', async () => {
    const record: RecordData = {
      uuid: 'test-uuid-1', status: 'draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      iniciais: { uc: '123', os: '456' }, retorno: {},
      tipoOrdem: 'VISTORIA DA UC', equipamentos: [],
      composicao: { complementoCorpo: '' }, attachmentCount: 0, sentData: null,
    };
    await db.records.put(record);
    const fetched = await db.records.get('test-uuid-1');
    expect(fetched).toBeDefined();
    expect(fetched!.uuid).toBe('test-uuid-1');
  });

  it('should have attachments store with uuid index', async () => {
    const att: StoredAttachment = {
      uuid: 'test-uuid-1', index: 0,
      name: 'photo.jpg', type: 'image/jpeg', data: 'base64data',
    };
    await db.attachments.put(att);
    const byUuid = await db.attachments.where('uuid').equals('test-uuid-1').toArray();
    expect(byUuid).toHaveLength(1);
  });

  it('should have pendingSends store', async () => {
    const pending: PendingSendData = {
      uuid: 'test-uuid-1', payload: { test: true },
      createdAt: new Date().toISOString(), attempts: 0,
    };
    await db.pendingSends.put(pending);
    const all = await db.pendingSends.toArray();
    expect(all).toHaveLength(1);
  });

  it('should support CRUD on records', async () => {
    const record: RecordData = {
      uuid: 'crud-uuid', status: 'draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      iniciais: {}, retorno: {}, tipoOrdem: '',
      equipamentos: [], composicao: { complementoCorpo: '' },
      attachmentCount: 0, sentData: null,
    };
    await db.records.put(record);
    expect(await db.records.get('crud-uuid')).toBeDefined();

    await db.records.update('crud-uuid', { status: 'sent' });
    expect((await db.records.get('crud-uuid'))!.status).toBe('sent');

    await db.records.delete('crud-uuid');
    expect(await db.records.get('crud-uuid')).toBeUndefined();
  });

  it('should delete attachments by uuid', async () => {
    await db.attachments.bulkAdd([
      { uuid: 'del-uuid', index: 0, name: 'a.jpg', type: 'image/jpeg', data: '' },
      { uuid: 'del-uuid', index: 1, name: 'b.jpg', type: 'image/jpeg', data: '' },
      { uuid: 'other-uuid', index: 0, name: 'c.jpg', type: 'image/jpeg', data: '' },
    ]);
    await db.attachments.where('uuid').equals('del-uuid').delete();
    expect(await db.attachments.where('uuid').equals('del-uuid').count()).toBe(0);
    expect(await db.attachments.where('uuid').equals('other-uuid').count()).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/dexie.test.ts`
Expected: FAIL — `src/db/index.ts` doesn't exist

- [ ] **Step 3: Create Dexie database**

```ts
// src/db/index.ts
import Dexie, { type Table } from 'dexie';
import type { RecordData, StoredAttachment, PendingSendData } from '@/types';

export class MailDB extends Dexie {
  records!: Table<RecordData, string>;
  attachments!: Table<StoredAttachment, number>;
  pendingSends!: Table<PendingSendData, number>;

  constructor() {
    super('mail-mvp');
    this.version(4).stores({
      records: 'uuid, status, tipoOrdem, updatedAt',
      attachments: '++id, uuid',
      pendingSends: '++id, uuid',
    });
  }
}

export const db = new MailDB();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/dexie.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/db/index.ts tests/db/dexie.test.ts
git commit -m "feat: add Dexie.js database with v4 schema + tests (Phase 4)"
```

---

## Task 6: Create Utility Modules

**Files:**
- Create: `src/utils/format.ts`, `src/utils/base64.ts`, `src/utils/compress.ts`, `src/utils/coordinates.ts`
- Create: `tests/utils/format.test.ts`, `tests/utils/base64.test.ts`

- [ ] **Step 1: Write failing test for format**

```ts
// tests/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/utils/format';

describe('formatDate', () => {
  it('should reverse YYYY-MM-DD to DD-MM-YYYY', () => {
    expect(formatDate('2026-06-14')).toBe('14-06-2026');
  });
  it('should return original for non-date format', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
  it('should handle empty string', () => {
    expect(formatDate('')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/format.test.ts`
Expected: FAIL

- [ ] **Step 3: Create src/utils/format.ts**

```ts
// src/utils/format.ts
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return parts.reverse().join('-');
}
```

- [ ] **Step 4: Create src/utils/base64.ts**

```ts
// src/utils/base64.ts
export function toBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const blobToBase64 = toBase64;

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
```

- [ ] **Step 5: Create src/utils/compress.ts**

```ts
// src/utils/compress.ts
import { loadImage } from './base64';

export async function compressAttachment(
  file: File, maxWidth: number, quality: number,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const ratio = img.width / img.height;
    let newWidth = img.width;
    let newHeight = img.height;
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(maxWidth / ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('toBlob returned null')); },
        'image/jpeg', quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
```

- [ ] **Step 6: Create src/utils/coordinates.ts**

```ts
// src/utils/coordinates.ts
export function captureCoordinates(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Geolocalizacao nao disponivel');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
      () => resolve('Nao disponivel'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}
```

- [ ] **Step 7: Write + run test for base64**

```ts
// tests/utils/base64.test.ts
import { describe, it, expect } from 'vitest';
import { toBase64, base64ToBlob } from '../../src/utils/base64';

describe('toBase64', () => {
  it('should convert a File to base64 string', async () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const result = await toBase64(file);
    expect(result).toBe('aGVsbG8=');
  });
});

describe('base64ToBlob', () => {
  it('should convert base64 string to Blob', () => {
    const blob = base64ToBlob('aGVsbG8=', 'text/plain');
    expect(blob).toBeInstanceOf(Blob);
  });
});
```

Run: `npx vitest run tests/utils/`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/utils/ tests/utils/
git commit -m "feat: add utility modules (compress, format, base64, coordinates) + tests (Phase 3 partial)"
```

---

## Task 7: Create Field Constants

**Files:**
- Create: `src/constants/fields.ts`
- Create: `tests/constants/fields.test.ts`

- [ ] **Step 1: Write failing test for fields constants**

```ts
// tests/constants/fields.test.ts
import { describe, it, expect } from 'vitest';
import { iniciaisFields, getRetornoFields } from '../../src/constants/fields';
import type { FieldDefinition } from '../../src/types';

describe('iniciaisFields', () => {
  it('should include all required fields', () => {
    const names = iniciaisFields.map((f: FieldDefinition) => f.nome);
    ['coordenadas','lider','uc','os','tipo-ordem','data'].forEach(n => expect(names).toContain(n));
  });
  it('should have select tipo with opcoes for lider', () => {
    const lider = iniciaisFields.find((f: FieldDefinition) => f.nome === 'lider');
    expect(lider!.tipo).toBe('select');
    expect(lider!.opcoes!.length).toBeGreaterThan(0);
  });
  it('should have 42 tipo-ordem options', () => {
    const t = iniciaisFields.find((f: FieldDefinition) => f.nome === 'tipo-ordem');
    expect(t!.opcoes).toHaveLength(42);
  });
});

describe('getRetornoFields', () => {
  it('should return default fields for unknown tipo', () => {
    expect(getRetornoFields('UNKNOWN')[0].nome).toBe('descricao');
  });
  it('should return UC cortada fields for INSPECAO types', () => {
    expect(getRetornoFields('INSPECAO UC CORTADA I15').length).toBeGreaterThan(1);
  });
  it('should have conditional fields', () => {
    const fields = getRetornoFields('VISTORIA DA UC');
    const cond = fields.filter((f: FieldDefinition) => f.condicional);
    expect(cond.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Create src/constants/fields.ts**

This is a 1:1 TypeScript port of `scripts/fields.js` — copy the full file content from the spec (`dados_projeto/refact_vue.md` section 4.7) with TypeScript types applied. Key changes:
- Add `as FieldDefinition[]` type annotations
- Add `as string[]` for opcoes arrays
- Export typed `getRetornoFields(tipo: string): FieldDefinition[]`

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**

```bash
git add src/constants/fields.ts tests/constants/fields.test.ts
git commit -m "feat: add typed field constants migrated from fields.js (Phase 3 partial)"
```

---

## Task 8: Create Pinia Stores

**Files:**
- Create: `src/stores/form.ts`, `src/stores/ui.ts`
- Create: `tests/stores/form.test.ts`, `tests/stores/ui.test.ts`

- [ ] **Step 1: Create src/stores/ui.ts** (simpler store first)

See full code in spec section 4.4. Key interface: `showToast(msg, success)`, `showError(msg)`, `hideError()`, `showConfirm(msg) → Promise<boolean>`, `resolveConfirm(result)`.

- [ ] **Step 2: Write + run test for ui store — PASS**

- [ ] **Step 3: Create src/stores/form.ts**

See full code in spec section 4.4. Key interface: `iniciais`, `equipamentos`, `attachments`, `retorno`, `currentUUID`, `composicao`, `iniciaisValido`, `tipoOrdem`, `saveDraft()`, `loadRecord(uuid)`, `resetForm()`. Auto-save via `watch()` with 1s debounce.

- [ ] **Step 4: Write + run test for form store — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/stores/ tests/stores/
git commit -m "feat: add Pinia stores (form + ui) with IndexedDB persistence + tests (Phase 3)"
```

---

## Task 9: Create Vue Application Skeleton

**Files:**
- Create: `src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/pages/FormPage.vue`, `src/env.d.ts`

- [ ] **Step 1: Create src/router/index.ts** — single route `/` → `FormPage.vue`

- [ ] **Step 2: Create src/main.ts** — `createApp(App).use(pinia).use(router).mount('#app')`

- [ ] **Step 3: Create src/env.d.ts** — Vue module declaration for TypeScript

- [ ] **Step 4: Create minimal src/App.vue** — header + `<router-view>` + toast + error banner

- [ ] **Step 5: Create minimal src/pages/FormPage.vue** — placeholder for sections

- [ ] **Step 6: Verify `npx vite --host` starts dev server + `npm run typecheck` passes**

- [ ] **Step 7: Commit**

```bash
git add src/main.ts src/App.vue src/router/ src/pages/ src/env.d.ts
git commit -m "feat: add Vue 3 skeleton with Router + Pinia + minimal App (Phase 2)"
```

---

## Task 10: Create Composable — useEmail

**Files:**
- Create: `src/composables/useEmail.ts`
- Create: `tests/composables/useEmail.test.ts`

- [ ] **Step 1: Write failing test for composeEmail** — verifies field output, date reversal, accent normalization, equipment rows, retorno fields. See spec section 4.7.

- [ ] **Step 2: Create src/composables/useEmail.ts** — `composeEmail()` reads from `useFormStore()`, normalizes text, reverses dates, iterates fields. Must match original `email.js` output exactly.

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**

---

## Task 11: Create Composables — useValidation + useOnlineStatus + useOfflineQueue

**Files:**
- Create: `src/composables/useValidation.ts`, `src/composables/useOnlineStatus.ts`, `src/composables/useOfflineQueue.ts`
- Create: tests for each

- [ ] **Step 1: Write + test useValidation** — `validateIniciais()` checks obrigatorio fields from `iniciaisFields`

- [ ] **Step 2: Write + test useOnlineStatus** — `isOnline` ref, online/offline event listeners

- [ ] **Step 3: Write + test useOfflineQueue** — `queueSend(uuid, payload)` → `db.pendingSends.put()`, `flushQueue()` → iterate + fetch + delete on success

- [ ] **Step 4: Commit**

---

## Task 12: Create Section Components

**Files:**
- Create: `SecaoInicio.vue`, `SecaoRetorno.vue`, `SecaoEquipamentos.vue`, `SecaoAnexos.vue`, `SecaoRevisao.vue`
- Modify: `FormPage.vue`

- [ ] **Step 1: Create SecaoInicio.vue** — renders `iniciaisFields` with v-model bound to `form.iniciais`. Handles all field types (select, date, time, number, text, coordinates). Groups by `linha` into flex rows. GPS button for coordinates.

- [ ] **Step 2: Create SecaoRetorno.vue** — computed `activeRetornoFields` that filters by `condicional` based on form values. Watch `tipoOrdem` change → clear `form.retorno`. v-model bound to `form.retorno[field.nome]`.

- [ ] **Step 3: Create SecaoEquipamentos.vue** — add/remove equipment rows. v-model on each row bound to `form.equipamentos[index]`.

- [ ] **Step 4: Create SecaoAnexos.vue** — file input with compress, preview, lightbox. `URL.createObjectURL` for previews with cleanup. Remove button on each.

- [ ] **Step 5: Create SecaoRevisao.vue** — email preview via computed `composeEmail()`. Complement textarea. Send button with validation → `saveDraft()` → `fetch('/api/send')` or `queueSend()` if offline.

- [ ] **Step 6: Update FormPage.vue** — import and render all 5 sections in order.

- [ ] **Step 7: Verify with `npm run typecheck` + dev server visual check**

- [ ] **Step 8: Commit**

---

## Task 13: Create Sidebar + Modals

**Files:**
- Create: `Sidebar.vue`, `ConfirmModal.vue`, `UpdateModal.vue`, `DuplicateModal.vue`, `OrientationOverlay.vue`
- Modify: `App.vue`

- [ ] **Step 1: Create Sidebar.vue** — Dexie live query for records, filter input, edit (loads record), delete (with confirm). Teleport to body. Slide-in from left.

- [ ] **Step 2: Create ConfirmModal.vue** — reads `ui.confirmOpen`/`ui.confirmMessage`, calls `ui.resolveConfirm()`. Teleport.

- [ ] **Step 3: Create UpdateModal.vue** — PWA update prompt, `SKIP_WAITING` message to SW.

- [ ] **Step 4: Create DuplicateModal.vue** — emits `confirm`/`cancel` events.

- [ ] **Step 5: Create OrientationOverlay.vue** — detects landscape on mobile, shows rotate prompt.

- [ ] **Step 6: Update App.vue** — import all new components.

- [ ] **Step 7: Commit**

---

## Task 14: Configure PWA with vite-plugin-pwa

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add VitePWA plugin to vite.config.ts** — `registerType: 'prompt'`, `cleanupOutdatedCaches: true`, `navigateFallback: 'index.html'`, manifest config. See spec section 4.10.

- [ ] **Step 2: Run `npm run build`** — verify `dist/` contains `sw.js` generated by Workbox.

- [ ] **Step 3: Commit**

---

## Task 15: Create Vitest Config for Vue + TypeScript

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Create vitest.config.ts** — vue plugin, jsdom environment, `@/` alias, `fake-indexeddb` setup.

- [ ] **Step 2: Create tests/setup.ts** — mock canvas.toBlob, crypto.randomUUID.

- [ ] **Step 3: Run all new tests — PASS**

- [ ] **Step 4: Commit**

---

## Task 16: Final Verification

- [ ] **Step 1:** `npm run typecheck` — no errors
- [ ] **Step 2:** `npm run build` — `dist/` produced
- [ ] **Step 3:** All new tests pass
- [ ] **Step 4:** `git push origin refactor/vue-vite-dexie`
- [ ] **Step 5:** Verify Deploy Preview on Netlify

---

## Task 17 (Phase 8 — Future): Remove Old Vanilla JS + Update AGENTS.md

**Blocked by:** Successful Deploy Preview confirming Vue app works.

**Files to remove:** `scripts/*.js` (24), `sw.js`, `tailwind-input.css`, old test files
**Files to update:** `AGENTS.md` — complete rewrite for Vue architecture

---

## Dependency Graph

```
Task 1 (deps + Vite + TS)
  → Task 2 (entry point + assets)
  → Task 3 (netlify.toml)
  → Task 4 (types)

Task 4 → Task 5 (Dexie needs types)
Task 4 → Task 7 (field constants need types)

Task 1 + Task 4 → Task 8 (Pinia stores)
Task 1 + Task 4 → Task 9 (Vue skeleton)

Task 8 + Task 5 → Task 10 (useEmail needs stores)
Task 8 → Task 11 (composables need stores)
Task 9 + Task 8 + Task 11 → Task 12 (sections need stores + composables)
Task 12 → Task 13 (sidebar + modals)
Task 9 → Task 14 (PWA needs Vite)
Task 1 → Task 15 (Vitest config)
Task 1-15 → Task 16 (verification)
Task 16 → Task 17 (cleanup)
```

**Parallelizable after Task 4:** Tasks 5, 6, 7 can run in parallel.
**Parallelizable after Task 8:** Tasks 10, 11 can run in parallel.
