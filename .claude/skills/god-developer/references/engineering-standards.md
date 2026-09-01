# Engineering Standards

Detailed standards for architecture, code quality, testing, and observability.

---

## Architecture Principles

### When to Use What

| Pattern | Use When | Avoid When |
|---|---|---|
| Monolith | Team < 10, early stage, unclear domain boundaries | Never avoid early on |
| Modular Monolith | Monolith growing unwieldy, want future service extraction | Premature micro-splitting |
| Microservices | Independent scaling needs, separate deploy cadences, separate teams | < 5 engineers, unclear boundaries |
| Event-Driven | Loose coupling needed, audit trail required, async workflows | Simple CRUD, strong consistency needed |
| CQRS | High read/write ratio asymmetry, complex query models | Simple apps, adds cognitive load |

### SOLID Application

- **Single Responsibility**: One module, one reason to change
- **Open/Closed**: Extend behavior via new code, not editing existing code
- **Liskov Substitution**: Subtypes must honor the contract of their parent
- **Interface Segregation**: Clients should not depend on methods they don't use
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

### Clean Architecture Layers (NestJS Context)

```
Controller (HTTP adapter)
  └── Service (Use case / business logic)
        └── Repository (Data access)
              └── Entity (Domain model)
```

Rules:
- Controllers never contain business logic
- Services never import from controllers
- Repositories never leak ORM-specific concerns into services
- Entities are pure domain objects

### Domain-Driven Design Concepts (Apply When Relevant)

- **Bounded Context**: Explicit boundaries where a domain model applies
- **Aggregate**: Consistency boundary - only one aggregate root per transaction
- **Value Object**: Immutable, identity-less types (Money, Address, Email)
- **Domain Event**: Something meaningful that happened in the domain

---

## Code Quality Standards

### Import Path Convention

Always use the configured path aliases when importing across package or library boundaries.
Never use deep relative paths (`../../..`) to reach files outside the current app or library.

**Available aliases (defined in `tsconfig.base.json`):**

| Alias | Resolves to |
|---|---|
| `@mau-apps/frontend` | `libs/frontend/src/index.ts` |
| `@mau-apps/frontend/services` | `libs/frontend/src/services/index.ts` |
| `@mau-apps/shared/types` | `libs/shared/types/src/index.ts` |
| `@mau-apps/shared/utils` | `libs/shared/utils/src/index.ts` |
| `@mau-apps/shared/entities` | `libs/shared/entities/src/index.ts` |
| `@mau-apps/shared/definitions` | `libs/shared/definitions/src/index.ts` |
| `@mau-apps/backend/dto` | `libs/backend/dto/src/index.ts` |
| `@mau-apps/backend/encryption` | `libs/backend/encryption/src/index.ts` |
| `@mau-apps/backend/iak` | `libs/backend/iak/src/index.ts` |
| `@mau-apps/backend/redis` | `libs/backend/redis/src/index.ts` |
| `@mau-apps/backend/sso` | `libs/backend/sso/src/index.ts` |
| `@mau-apps/backend/utils` | `libs/backend/utils/src/index.ts` |

**Nuxt app alias (defined in each `nuxt.config.ts`):**

| Alias | Resolves to |
|---|---|
| `@mau-apps/frontend/assets` | `libs/frontend/src/assets` |

**Rule:**

```typescript
// Bad - deep relative path crossing the app boundary into libs
import {axiosInstanceAccount} from "./../../../../../../libs/frontend/src/services";

// Good - path alias
import {axiosInstanceAccount} from "@mau-apps/frontend";
```

Relative paths are acceptable only for intra-app imports: files within the same app's
`src/` directory importing sibling modules. As soon as an import crosses into `libs/`,
a path alias is mandatory.

```typescript
// OK - intra-app relative import (same app, same src tree)
import {AuthService} from "../auth/auth.service";

// Not OK - crossing into libs via relative path
import {something} from "../../../../../../libs/frontend/src/...";
```

**Nuxt server routes (Nitro context):** `nxViteTsPaths()` only covers the Vite/client side.
Nitro resolves aliases from `nuxt.config.ts` `alias` block. Two rules apply:

1. **Aliases must be absolute paths** - relative paths cause Rollup to warn and may produce
   duplicate module instances. Use `fileURLToPath` with `import.meta.url`.

2. **Never alias the full `@mau-apps/frontend` in Nitro** - it includes Vue components that
   Rollup cannot parse in a server context. Alias only the server-safe sub-path instead.

```typescript
// nuxt.config.ts
import {fileURLToPath, URL} from "node:url";

alias: {
  "@mau-apps/frontend/services": fileURLToPath(new URL("../../libs/frontend/src/services", import.meta.url)),
  "@mau-apps/frontend/assets":   fileURLToPath(new URL("../../libs/frontend/src/assets",   import.meta.url)),
},
```

Server routes import from the scoped alias, never from the full package:

```typescript
// Bad - bundles Vue components into the server build
import {axiosInstanceAccount} from "@mau-apps/frontend";

// Good - only the Node-safe services layer
import {axiosInstanceAccount} from "@mau-apps/frontend/services";
```

### Naming

```typescript
// Bad
const d = new Date();
const u = await getU(id);
function proc(x: any) {}

// Good
const createdAt = new Date();
const user = await getUserById(id);
function processPaymentWebhook(payload: WebhookPayload) {}
```

### Function Design

- Maximum 20-30 lines per function
- One level of abstraction per function
- No boolean flag parameters — use separate functions or option objects
- Return early to avoid deep nesting

```typescript
// Bad - deep nesting
function processOrder(order: Order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.user.isActive) {
        // actual logic
      }
    }
  }
}

// Good - early returns
function processOrder(order: Order) {
  if (!order) return;
  if (order.items.length === 0) throw new BadRequestException('Order has no items');
  if (!order.user.isActive) throw new ForbiddenException('User account is inactive');
  // actual logic
}
```

### Type Safety

- Never use `any` without a documented reason
- Use discriminated unions for complex state
- Prefer interfaces for contracts, types for computed/union types
- Make illegal states unrepresentable

```typescript
// Bad
function updateStatus(status: string) {}

// Good
type TransactionStatus = 'pending' | 'success' | 'failed';
function updateStatus(status: TransactionStatus) {}
```

### Error Handling

- Never swallow exceptions silently
- Use typed exceptions (domain errors, not generic Error)
- Include context in error messages
- Log at the appropriate level (debug/info/warn/error)

```typescript
// Bad
try {
  await externalApi.call();
} catch (e) {
  console.log(e);
}

// Good
try {
  await externalApi.call();
} catch (error) {
  this.logger.error('IAK prepaid API call failed', {
    productCode: payload.productCode,
    error: error.message,
  });
  throw new ServiceUnavailableException('Top-up provider is currently unavailable');
}
```

---

## Testing Standards

### Test Pyramid

```
        /\
       /  \   E2E (few, slow, high confidence)
      /----\
     /      \  Integration (some, validate contracts)
    /--------\
   /          \ Unit (many, fast, isolated logic)
  /____________\
```

### Unit Tests

- Test business logic in isolation
- No database, no HTTP, no filesystem
- Mock external dependencies at the service boundary
- Name tests as: `it('should <expected behavior> when <condition>')`

```typescript
describe('TransactionService', () => {
  it('should throw InsufficientBalanceException when user balance is less than topup amount', async () => {
    // arrange
    const user = { balance: 5000 };
    const payload = { amount: 10000 };
    // act + assert
    await expect(service.topup(user.id, payload)).rejects.toThrow(InsufficientBalanceException);
  });
});
```

### Integration Tests

- Test that modules wire together correctly
- Use real database (test DB), not mocks
- Reset state between tests
- Cover happy path and primary error paths

### E2E Tests

- Cover critical user journeys only
- Run against staging environment
- Not a substitute for unit/integration tests

### Test Coverage Guidelines

- Business logic (services): 80%+ coverage
- Controllers: 60%+ (thin layer, mostly integration tested)
- Utilities: 90%+ (pure functions, easy to test)
- Not a goal in itself — 80% meaningful coverage beats 100% trivial coverage

### Keep Tests in Sync with Code Changes

Any change that affects behavior visible to tests MUST include the corresponding test update in the
same commit. Never leave tests broken or stale as a follow-up.

Examples of changes that require test updates:

- Renaming a page title, route, or URL -> update e2e specs that assert on those values
- Adding or removing auth protection on a route -> update e2e specs that test navigation/redirect
- Changing API response shape or status codes -> update unit/integration tests that assert on those
- Renaming a component, function, or exported symbol -> update tests that reference it
- Modifying business logic -> update unit tests that cover that logic

**Rule:** Before considering a task done, check whether any existing test would fail due to the
change. If yes, update the test as part of the same change. A green pipeline is part of the
definition of done.

---

## Observability Standards

A system that cannot be observed cannot be reliably operated.

### Structured Logging

Every log entry should be machine-parseable (JSON) and include:
- `timestamp` - ISO 8601
- `level` - debug / info / warn / error
- `service` - app name
- `traceId` - correlation ID for distributed tracing
- `message` - human-readable description
- `context` - relevant domain data (userId, transactionCode, etc.)

```typescript
this.logger.info('Transaction created', {
  traceId: request.traceId,
  userId: user.id,
  transactionCode: transaction.code,
  amount: transaction.amount,
  type: transaction.type,
});
```

### What to Log

| Level | Use For |
|---|---|
| `debug` | Detailed internal state, only in dev/staging |
| `info` | Normal business events (transaction created, user logged in) |
| `warn` | Recoverable issues (retry attempt, rate limit approached) |
| `error` | Failures requiring attention (payment failed, dependency down) |

### Metrics to Track

- **Request rate** - Requests per second per endpoint
- **Error rate** - 4xx / 5xx per endpoint
- **Latency** - p50, p95, p99 response times
- **Database** - Query duration, connection pool usage
- **External dependencies** - Call rate, error rate, latency per provider (IAK, Midtrans)
- **Business metrics** - Transactions per minute, deposit volume, failed topup rate

### Distributed Tracing

- Propagate a `traceId` through all service calls
- Include `traceId` in every log entry
- Pass `X-Trace-Id` header in service-to-service HTTP calls

### Alerting Thresholds (Starting Points)

| Signal | Alert On |
|---|---|
| Error rate | > 1% of requests over 5 minutes |
| Latency p99 | > 2x baseline for 5 minutes |
| Payment failures | > 5% failure rate over 10 minutes |
| Database latency | > 500ms p95 |
| Dependency downtime | Any 2xx rate < 95% over 5 minutes |

---

## Vue / Frontend Standards

### File and Folder Naming

#### Directories

All directories use **lowercase**. Multi-word directories use **kebab-case**.

```
// Good
components/
composables/
axios-instance/
source-sans-pro/
tailwind/modal/

// Bad
Components/
composables/Components/    ← PascalCase directory
tailwind/Modal/            ← PascalCase directory
```

#### Vue component files (non-Nuxt pages)

Use **PascalCase**. The filename must match the component's exported default name.

```
// Good
BasicModal.vue
SignoutModal.vue
BasicSnackbar.vue
BasicTable.vue

// Bad
basic-modal.vue
signout_modal.vue
```

#### Nuxt page files

Use **lowercase** and **kebab-case** — Nuxt's file-based routing convention.
The filename becomes the URL segment.

```
// Good
index.vue
signin.vue
forgot-password.vue

// Bad
Index.vue
SignIn.vue           ← would route to /SignIn
```

#### Nuxt server route files

Use **lowercase** with the HTTP method as a suffix separated by a dot.

```
// Good
whoami.post.ts
signin.post.ts
product-list.get.ts

// Bad
Whoami.post.ts
signIn.post.ts
```

#### TypeScript / JS files (non-component)

Use **kebab-case**.

```
// Good
use-authentication.ts
use-mau-auth-cookie.ts
auth.global.ts
axios-instance-account.ts

// Bad
useAuthentication.ts
AuthGlobal.ts
```

#### Summary table

| Asset | Convention | Example |
|---|---|---|
| Directory | lowercase, kebab-case | `axios-instance/`, `tailwind/modal/` |
| Vue component (non-page) | PascalCase | `BasicModal.vue`, `SignoutModal.vue` |
| Nuxt page | lowercase, kebab-case | `index.vue`, `forgot-password.vue` |
| Nuxt server route | lowercase + method suffix | `signin.post.ts`, `whoami.post.ts` |
| TypeScript file | kebab-case | `use-authentication.ts` |

---

### Composable Design Standard

The following is the reference implementation for composables in this project.
All composables MUST follow every rule demonstrated here.

```typescript
import {useMauAuthCookie, useAuthStore} from "@mau-apps/frontend";
import {User} from "@mau-apps/shared/types";

export const useAuthentication = () => {
  const route = useRoute();
  const runtimeConfig = useRuntimeConfig();
  const {token: activeToken, setToken, clearToken} = useMauAuthCookie(); // (1)

  const redirectTo = ref("");                                              // (2)

  const authHeaders = computed<HeadersInit>(() => ({                      // (3)
    ["X-Mau-Secret"]: "Secret",
    ["X-Mau-Authorization"]: `Bearer ${activeToken.value}`,
  }));
  const {data: userData} = useFetch("/api/auth/whoami", {
    method: "post",
    headers: authHeaders,                                                  // (4)
    immediate: true,
    watch: false,
  });
  const authUser = computed(() => (userData.value || null) as User | null);
  const signinUrl = computed(() => `.../${redirectTo.value}`);

  const setAccessToken = (token: string) => {
    const authStore = useAuthStore();                                       // (5)
    setToken(token);                                                        // (6)
    authStore.setAccessToken(token);
  };

  const removeAccessToken = () => {
    const authStore = useAuthStore();                                       // (5)
    clearToken();                                                           // (6)
    authStore.removeAccessToken();
    window.location.href = signinUrl.value;
  };

  onMounted(() => {
    redirectTo.value = `${window.location.origin}${route.fullPath}`;      // (7)
  });

  return {
    activeToken,
    authUser,
    signinUrl,

    setAccessToken,
    removeAccessToken,
  };
};
```

The return object groups reactive state first, then actions, separated by a blank line.
This makes the public API scannable at a glance.

Rules derived from this reference:

**(0) Declare everything before the return** - Never inline functions, computed, or refs
directly inside the return object. Always assign them to named constants first. This keeps
the return statement as a clean, flat manifest of the public API.

```typescript
// Bad - inline functions in return make the public API invisible
export const useMauAuthCookie = () => {
  const cookie = useCookie("token");
  return {
    token: computed(() => cookie.value),
    setToken: (value: string) => { cookie.value = value; },
  };
};

// Good - everything declared first, return is just a manifest
export const useMauAuthCookie = () => {
  const cookie = useCookie("token", {sameSite: "lax", path: "/"});

  const token = computed(() => cookie.value);

  const setToken = (value: string) => { cookie.value = value; };
  const clearToken = () => { cookie.value = null; };

  return {
    token,

    setToken,
    clearToken,
  };
};
```

The composable body follows this order: dependencies -> reactive state -> derived state
(computed / useFetch) -> action functions -> lifecycle hooks -> return.

**(1) Getter/setter destructuring** - Always destructure composable returns to use the
named API. Never hold a raw ref and mutate `.value` from outside the composable.

```typescript
// Bad
const authCookie = useMauAuthCookie();
authCookie.value = token;

// Good
const {token, setToken, clearToken} = useMauAuthCookie();
setToken(token);
```

When designing a composable, always expose setter methods alongside reactive values:

```typescript
// Bad - raw ref leaks internal mutation control
export const useMauAuthCookie = () => useCookie("token");

// Good - controlled public API, everything declared before return
export const useMauAuthCookie = () => {
  const cookie = useCookie("token", {sameSite: "lax", path: "/"});

  const token = computed(() => cookie.value);

  const setToken = (value: string) => { cookie.value = value; };
  const clearToken = () => { cookie.value = null; };

  return {token, setToken, clearToken};
};
```

**(2) Client-only state starts as empty, never undefined** - State that requires browser
context is initialized to a safe default (`""`, `null`, `[]`) and populated in `onMounted`.

**(3) Reactive headers use `computed<HeadersInit>`** - When passing dynamic data to
`useFetch` headers, always use a typed `computed` ref. A plain object expression captures
values once at setup and never updates.

```typescript
// Bad - headers frozen at setup time, token never updates
const {data} = useFetch("/api/whoami", {
  headers: {"Authorization": `Bearer ${activeToken.value}`},
});

// Good - re-evaluated on every fetch
const authHeaders = computed<HeadersInit>(() => ({
  "Authorization": `Bearer ${activeToken.value}`,
}));
const {data} = useFetch("/api/whoami", {headers: authHeaders});
```

**(4) Pass the computed ref, not `.value`** - `headers: authHeaders` not
`headers: authHeaders.value`. Passing `.value` collapses the ref to a plain object again.

**(5) Lazy Pinia store initialization** - Never call `useAuthStore()` (or any Pinia store)
at the top level of a composable. Pinia may not be active during SSR setup. Call it inside
action functions where it is guaranteed to run in a valid context.

```typescript
// Bad - throws "getActivePinia() was called but there was no active Pinia" on SSR
export const useAuthentication = () => {
  const authStore = useAuthStore(); // top-level call
  ...
};

// Good - lazy, only called when the action is triggered (always client context)
const setAccessToken = (token: string) => {
  const authStore = useAuthStore(); // inside function
  ...
};
```

**(6) Use setter methods, not store mutations directly** - Route all state changes through
the composable's public setter. The composable coordinates the full state update (cookie +
store) in one call. Callers never touch individual pieces.

**(7) `onMounted` for all browser APIs** - `window`, `document`, `navigator`, and
`location` are not available during SSR. Any code that reads or writes these must live
inside `onMounted`. Treat the top level of `setup()` as SSR-safe by default.

```typescript
// Bad - crashes on SSR
const origin = window.location.origin;

// Good
onMounted(() => {
  redirectTo.value = `${window.location.origin}${route.fullPath}`;
});
```

### Reusable Component Design

Before writing any Vue component, always reason about reusability first.

**The two-layer rule:**

Every UI concept should be expressed as two layers:

1. **Basic component** - the generic, unstyled-logic or minimally-styled primitive. It owns the behavior (open/close, keyboard, animation, slot contract) but makes no assumptions about content or domain.
2. **Derived component** - wraps the basic component with specific content, copy, or domain logic. It never re-implements the primitive's behavior.

This mirrors the pattern already established in this codebase:

```
BasicModal    <- behavior: overlay, backdrop, ESC key, Teleport, transition
  └── SignoutModal   <- domain: fixed signout copy + Cancel / Sign out buttons
```

**Decision flow when you need a component:**

```
Need a component?
  |
  ├── Does a basic version already exist in libs/frontend/src/components/?
  |     |
  |     ├── YES, and it covers the behavior needed
  |     |     └── Use it. Wrap it into a derived component if domain-specific content is needed.
  |     |
  |     └── NO, or the existing one does not fit
  |           └── Create the Basic component first (generic, slotted),
  |               then create the derived component on top of it.
  |
  └── Is this 100% specific to one screen with no reuse potential?
        └── Still prefer using an existing basic component as the base.
            Only write a one-off if the behavior itself is unique.
```

**Rules:**

- The basic component exposes slots (`<slot />`, `<slot name="header">`, etc.) and emits (`update:modelValue`, `confirm`, etc.), never hard-coded text.
- The derived component imports only from the basic component's path, not from the app's own UI.
- Never copy-paste a basic component's behavior into a new component. Compose it.
- When a new common pattern emerges (e.g., a confirmation modal), the basic component lives in `libs/frontend/src/components/`, the derived components live closest to their use (app-level or lib-level).

**Location convention:**

| Layer | Where |
|---|---|
| Basic (Tailwind) | `libs/frontend/src/components/tailwind/<category>/Basic*.vue` |
| Basic (Vuetify) | `libs/frontend/src/components/<category>/Basic*.vue` |
| Derived (shared) | `libs/frontend/src/components/tailwind/<category>/<Name>.vue` |
| Derived (app-specific) | `apps/<app>/src/components/<Name>.vue` |

**Example:**

```vue
<!-- BasicModal.vue - generic, owns behavior only -->
<script lang="ts" setup>
import {onBeforeUnmount, onMounted} from "vue";
defineProps<{modelValue: boolean}>();
const emit = defineEmits<{(e: "update:modelValue", value: boolean): void}>();
const close = () => emit("update:modelValue", false);
const onKeydown = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 ...">
      <div class="absolute inset-0 bg-black/50" @click="close" />
      <div class="relative z-10 ..."><slot /></div>
    </div>
  </Teleport>
</template>
```

```vue
<!-- SignoutModal.vue - derived, wraps BasicModal with domain content -->
<script lang="ts" setup>
import BasicModal from "./BasicModal.vue";
defineProps<{modelValue: boolean}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
}>();
const onCancel = () => emit("update:modelValue", false);
const onConfirm = () => { emit("update:modelValue", false); emit("confirm"); };
</script>
<template>
  <BasicModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="p-6">
      <h3>Sign out</h3>
      <p>Are you sure you want to sign out?</p>
    </div>
    <div class="flex gap-3 justify-end px-6 pb-6">
      <button @click="onCancel">Cancel</button>
      <button @click="onConfirm">Sign out</button>
    </div>
  </BasicModal>
</template>
```

### Styling in Vue Components

Never use inline `style` attributes in Vue component templates. All component styling must use
the `<style lang="scss">` block at the bottom of the component file.

```vue
<!-- Bad -->
<div style="font-family: system-ui, sans-serif; color: red;">...</div>
<div :style="{ marginTop: offset + 'px' }">...</div>

<!-- Good -->
<div class="content">...</div>

<style lang="scss">
.content {
  font-family: system-ui, sans-serif;
  color: red;
}
</style>
```

Dynamic values that cannot be expressed as static classes should use CSS custom properties
via a scoped style binding on the root element, not inline styles:

```vue
<!-- Acceptable for truly dynamic values -->
<div class="panel" :style="{ '--offset': offset + 'px' }">...</div>

<style lang="scss">
.panel {
  margin-top: var(--offset);
}
</style>
```

Rationale: inline styles bypass scoping, break theme consistency, cannot be overridden by
design tokens, and make visual audits harder. SCSS blocks keep styles co-located, scopeable,
and maintainable.

### No Bare Divs

Every `<div>` must carry at least one class or a meaningful attribute (`v-if`, `v-for`, `role`,
etc.). A bare `<div>` with no class and no attribute is a red flag: it means the element has no
semantic identity and no hook for styling or testing.

```vue
<!-- Bad: bare wrappers with no class -->
<div>
  <div>
    <span>{{ label }}</span>
  </div>
</div>

<!-- Good: every div has a class that names its role -->
<div class="c-card">
  <div class="c-card__body">
    <span class="c-card__label">{{ label }}</span>
  </div>
</div>
```

The only exceptions are Vue `<template>` wrapper tags used purely for `v-if`/`v-for` grouping
(since they render no DOM node) and root elements in components that already receive a class
from the parent via `$attrs`.

Rationale: bare divs make templates hard to read, impossible to target in SCSS, and create
invisible DOM noise. A class-less div is almost always a sign that BEM thinking was skipped.

---

### BEM SCSS Naming Convention

Classes follow a two-tier BEM prefix system that mirrors the file structure:

| Tier | Prefix | Where it lives | Example |
|------|--------|----------------|---------|
| Page layout | `l-` | `libs/frontend/src/assets/scss/core/themes/<theme>/layouts/_l-<name>.scss` | `l-dashboard`, `l-products`, `l-settings` |
| Component | `c-` | `<style lang="scss">` block inside the `.vue` component file | `c-page-header`, `c-content-card`, `c-data-table` |

**Page layouts (`l-`) - strict scope:**
Every page is a layout. Each page gets its **own** dedicated SCSS file. A layout file must only
contain styles that are exclusive to that page. Layout classes only override or position
component-level elements — they do not replicate component internals.

```
libs/frontend/src/assets/scss/core/themes/cms/layouts/
  _l-dashboard.scss   <- only stats grid, activity list
  _l-products.scss    <- only filters area, sync dialog
  _l-settings.scss    <- only form body, preview panel, actions
```

```scss
// _l-products.scss
.l-products {
  padding: 28px;

  &__filters { padding: 12px 20px; border-bottom: ...; }
  &__sync-loading { ... }
}
```

```vue
<!-- pages/products.vue — root class matches the layout file -->
<div class="l-products">
  <c-page-header title="Produk" ...>...</c-page-header>
  <c-content-card title="Daftar Produk">
    <div class="l-products__filters">...</div>
  </c-content-card>
</div>
```

**Components (`c-`) - reusable, self-contained:**
Every reusable UI pattern becomes a Vue component with `c-` prefixed classes in its own
`<style lang="scss">` block. Components live in `libs/frontend/src/components/vuetify/<category>/`.

Shared non-component CSS classes (e.g. table cell helpers used in multiple page templates) go in
a SCSS module under `libs/frontend/src/assets/scss/core/themes/cms/modules/_c-<name>.scss`,
forwarded from `_modules.scss`.

```
libs/frontend/src/components/vuetify/page/
  CPageHeader.vue      <- c-page-header (title + subtitle + actions slot)
  CContentCard.vue     <- c-content-card (card with header divider + body slot)

libs/frontend/src/assets/scss/core/themes/cms/modules/
  _c-table-cells.scss  <- c-code-cell, c-amount-cell, c-user-cell, c-price-old/new ...
  _c-data-table.scss   <- c-data-table (Vuetify table style overrides)
```

```vue
<!-- CContentCard.vue -->
<template>
  <v-card class="c-content-card" rounded="lg" elevation="0">
    <div class="c-content-card__header">
      <span class="c-content-card__title">{{ title }}</span>
      <slot name="header-right" />
    </div>
    <v-divider />
    <slot />
  </v-card>
</template>

<style lang="scss">
.c-content-card {
  background: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  display: flex !important;
  flex-direction: column;

  &__header { display: flex; align-items: center; padding: 16px 20px 12px; }
  &__title { font-size: 14px; font-weight: 600; }
}
</style>
```

**Key rule:** A layout (`l-`) class must never own styles that belong to a reusable pattern.
If the same visual structure appears in more than one page, extract it into a `c-` component.
Layout only positions and overrides — it never re-implements component internals.

Never use bare utility classes or ad-hoc class names outside this system. If a class does not
start with `l-` or `c-`, it must come from Vuetify or a third-party library.

---

### Transparent Wrapper Components (Vue — any UI library)

When a `Basic*` component wraps a third-party component (Vuetify, shadcn, etc.), use
`inheritAttrs: false` with `v-bind="{...$props, ...$attrs}"` so all props, events, and
attributes are forwarded transparently. Never manually redeclare every prop of the underlying
component.

```vue
<!-- Bad - only exposes 4 props, hides everything the underlying component supports -->
<script lang="ts" setup>
const props = defineProps<{headers, items, loading, itemsPerPage}>();
const items = ref(props.items);   // snapshot - never updates when parent changes!
</script>
<template><SomeTable :items="items" /></template>

<!-- Good - transparent, every prop/event/attr passes through -->
<script lang="ts" setup>
defineOptions({inheritAttrs: false});
defineProps<{headers, items, loading?, itemsPerPage?}>();
</script>
<template>
  <SomeTable v-bind="{...$props, ...$attrs}">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData ?? {}" />
    </template>
  </SomeTable>
</template>
```

**Critical anti-pattern:** Never copy a prop into a local `ref()`. The ref captures the
value once at mount and never syncs again. Use `computed(() => props.x)` instead.

```typescript
// Bad - frozen at mount
const items = ref(props.items);

// Good - always in sync with parent
const items = computed(() => props.items);
```

When the wrapper needs to support multiple variants of the underlying component (e.g.
client-side vs server-side), add a mode prop and strip it before forwarding so it does
not leak to the underlying component as an unknown attribute:

```vue
<script lang="ts" setup>
defineOptions({inheritAttrs: false});
const props = defineProps<{
  headers, items, loading?, itemsPerPage?,
  serverSide?: boolean,  // mode switch, not an underlying prop
}>();
const tableProps = computed(() => {
  const {serverSide, ...rest} = props;
  return rest;
});
</script>
<template>
  <ServerTable v-if="serverSide" v-bind="{...tableProps, ...$attrs}">...</ServerTable>
  <ClientTable v-else            v-bind="{...tableProps, ...$attrs}">...</ClientTable>
</template>
```

### Vuetify-Specific Patterns

The following patterns apply **only when building pages or components with Vuetify**.
Do not apply them to Tailwind-based components.

#### Layout: Use v-row / v-col

When building multi-column layouts inside a Vuetify page, use `v-row` + `v-col` instead
of custom flexbox CSS. Vuetify's grid handles breakpoints and gutters automatically.

```vue
<!-- Bad - manual flexbox + custom breakpoint CSS -->
<div class="my-filters">  <!-- needs custom SCSS for responsive -->
  <div style="display:flex; gap:12px; flex-wrap:wrap">...</div>
</div>

<!-- Good - zero custom CSS needed -->
<v-row dense>
  <v-col cols="12">
    <v-text-field ... />
  </v-col>
  <v-col cols="12" sm="6" md="3">
    <v-select ... />
  </v-col>
</v-row>
```

#### Server-Side Pagination: Use v-data-table-server

When data is fetched from the server, use `v-data-table-server` (or `BasicTable` with
`server-side` prop). Let the table manage page state internally via `@update:options`.
Do not manually render `v-pagination` alongside the table.

```vue
<basic-table
  server-side
  :headers="tableHeaders"
  :items="items"
  :items-length="totalItems"
  :items-per-page="limit"
  :loading="pending"
  @update:options="onTableOptions"
/>
```

```typescript
const page  = ref(1);
const limit = ref(10);

const onTableOptions = ({page: p, itemsPerPage}: {page: number; itemsPerPage: number}) => {
  page.value  = p;
  limit.value = itemsPerPage;
};
```

`@update:options` fires on mount with the current values. Assigning the same value to a
ref does not trigger reactivity, so there is no double-fetch on initial load.

### Nuxt useFetch: Reactive Server-Side Queries

Pass a computed ref to the `query` option and add `watch: [query]` so the fetch re-runs
whenever any filter or pagination state changes.

```typescript
const query = computed(() => ({
  page: page.value,
  limit: limit.value,
  ...(search.value ? {search: search.value} : {}),
}));

const {data, pending, refresh} = useFetch("/api/resource", {
  headers: authHeaders,   // computed<HeadersInit> - not .value
  query,
  watch: [query],
});
```

Rules:
- Pass `authHeaders` (the computed ref), never `authHeaders.value`. Passing `.value` collapses
  it to a plain object that never updates.
- Use `watch: [query]` alongside the `query` option. Nuxt may deduplicate requests when only
  the `query` option changes; the explicit watch guarantees a refetch.
- For on-demand fetches (button click, dialog open), use `$fetch` directly — it runs only
  client-side and has no SSR URL resolution issues for `/api/...` routes.
- After a mutation (e.g. sync update), call `refresh()` (destructured from `useFetch`) to
  reload the current query without resetting filters.

### Nuxt Server Routes: Auth-Proxy Pattern

All Nuxt server routes that proxy to the backend follow this pattern:

```typescript
// apps/<app>/src/server/api/<resource>.get.ts
import {axiosInstanceTopup} from "@mau-apps/frontend/services";
import {HttpStatusCode} from "axios";
import {createError, defineEventHandler, getHeaders, getQuery} from "h3";

export default defineEventHandler(async (event) => {
  try {
    const headers = getHeaders(event);
    const query   = getQuery(event);
    const secret  = headers["x-mau-secret"];
    const token   = headers["x-mau-authorization"]?.split(" ")[1];

    if (!secret) throw createError({statusCode: HttpStatusCode.Forbidden, statusMessage: "Access denied."});
    if (!token)  throw createError({statusCode: HttpStatusCode.Unauthorized, statusMessage: "Unauthorized"});

    const axios    = axiosInstanceTopup(token);
    const response = await axios.get("/resource", {params: query});

    return response;   // axios interceptor already returns response.data (backend JSON)
  } catch (error) {
    if (error.response) {
      throw createError({
        statusCode: error.response.status || HttpStatusCode.InternalServerError,
        statusMessage: error.response.data?.message || error.response.statusText,
        ...error.response.data,
      });
    }
    throw createError({statusCode: HttpStatusCode.InternalServerError, statusMessage: error.message});
  }
});
```

Key points:
- `getHeaders` returns lowercase keys — use `"x-mau-secret"`, not `"X-Mau-Secret"`.
- `createAxiosInstance` response interceptor does `return response.data`, so the variable
  named `response` already holds the backend JSON, not the axios AxiosResponse. `return response`
  sends the backend JSON as the HTTP body.
- Forward all query params via `{params: query}` so pagination, search, and filter reach
  the backend unchanged.
- Import only from `@mau-apps/frontend/services` in server routes, never from
  `@mau-apps/frontend` (which includes Vue components that crash the Nitro build).

---

## Technology Decision Framework

When evaluating a new technology or approach, apply this checklist:

1. **Why use it** - What specific problem does it solve that existing tools cannot?
2. **Why not use it** - What are the genuine downsides (operational complexity, learning curve, vendor lock-in)?
3. **Alternatives** - What are the 2-3 most relevant alternatives and how do they compare?
4. **Operational cost** - Who runs it? Who monitors it? What happens when it fails?
5. **Maintenance burden** - Is this library/framework actively maintained? What is the upgrade path?
6. **Team readiness** - Does the team have the skills to operate this? What is the onboarding cost?
7. **Exit strategy** - If this turns out to be a mistake, how do we replace it?

**Bias toward boring technology.** Proven technology with well-understood failure modes is usually
preferable to exciting new tools with unknown operational characteristics.
