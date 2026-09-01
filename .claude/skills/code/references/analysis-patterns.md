# Analysis Patterns by Change Type

Reference for deep analysis patterns per change type. Load this file when the change being analyzed matches one or more of the categories below.

## Table of Contents

1. [Shared Utility / Base Class Change](#1-shared-utility--base-class-change)
2. [API Contract Change](#2-api-contract-change)
3. [Database Schema Change](#3-database-schema-change)
4. [Auth / Security Logic Change](#4-auth--security-logic-change)
5. [State Management Change](#5-state-management-change)
6. [Pure Refactor](#6-pure-refactor)
7. [Performance-Sensitive Change](#7-performance-sensitive-change)
8. [Cross-service / Integration Change](#8-cross-service--integration-change)

---

## 1. Shared Utility / Base Class Change

**Risk profile:** High scope, potentially high criticality.

### Code exploration checklist
- `Grep` for all import/require statements referencing the utility file
- `Grep` for all class extensions (`extends BaseClass`) if it's a base class
- `Glob` to find all test files covering the utility
- Check if the utility is re-exported from an index barrel — if so, grep for the barrel too

### Key questions
- Is the function signature changing (parameters, return type)?
- Are callers passing arguments that rely on current behavior?
- Are there overloaded or polymorphic usages?

### Risk indicators
- Used in >5 modules → Scope Size: 4–5
- No dedicated unit tests → Test Coverage: 4–5
- Signature change → Change Type: 4–5

---

## 2. API Contract Change

**Risk profile:** High stability risk, potential breaking change for consumers.

### Code exploration checklist
- `Grep` for all route definitions, controller handlers, or GraphQL resolvers affected
- `Grep` for all client-side callers (fetch, axios, SDK calls) using the endpoint
- Search for OpenAPI/Swagger specs or type definitions that document the contract
- Check if the endpoint is versioned — look for `/v1/`, `/v2/` prefixes

### Key questions
- Is the change additive (new optional field) or breaking (removed field, type change)?
- Are there external consumers (mobile apps, third-party clients)?
- Is there a versioning or deprecation policy in place?

### Risk indicators
- External consumers or public API → API Stability: 4–5
- No versioning → API Stability +1
- Required field removed or type changed → Change Type: 5
- No integration tests → Test Coverage: 4

---

## 3. Database Schema Change

**Risk profile:** Irreversible, affects data integrity and backward compatibility.

### Code exploration checklist
- `Glob` for migration files to understand sequence and dependencies
- `Grep` for all ORM model definitions referencing the affected table/entity
- `Grep` for raw SQL queries referencing the column/table by name
- Check if seeds, fixtures, or test factories need updating

### Key questions
- Is this additive (new nullable column) or destructive (drop column, rename)?
- Does the migration require a data backfill?
- Can the app run with old and new schema simultaneously during rolling deploy?

### Risk indicators
- Column rename or removal → Change Type: 5
- No migration → Scope Size: 5 (manual fix required everywhere)
- Missing backfill for non-nullable column → immediate data risk
- Affects high-traffic table → Performance Impact: 3–5

---

## 4. Auth / Security Logic Change

**Risk profile:** High security impact; errors can expose data or break access.

### Code exploration checklist
- `Grep` for all middleware, guards, or decorators using the auth logic
- `Grep` for all protected routes or resource access checks
- `Read` the permission model or role definitions to understand scope
- Search for tests that cover auth edge cases (unauthenticated, insufficient role)

### Key questions
- Is access being broadened (risk: over-permission) or narrowed (risk: breaking legitimate access)?
- Are JWT/session tokens, scopes, or roles being changed?
- Does the change affect admin or privileged paths?

### Risk indicators
- Affects all authenticated routes → Scope Size: 5, Security Impact: 5
- No tests for unauthorized access → Test Coverage: 5
- Privilege escalation possible → Security Impact: 5
- Touches token generation/validation → Security Impact: 4–5

---

## 5. State Management Change

**Risk profile:** High runtime risk; stale or inconsistent state causes subtle bugs.

### Code exploration checklist
- `Grep` for all reads and writes to the affected store/context/atom
- `Glob` for components or hooks that consume the affected state slice
- `Read` reducers, selectors, or derived state to trace data flow
- Look for optimistic updates or cache invalidation logic

### Key questions
- Can state become stale or inconsistent after the change?
- Are there race conditions with async updates?
- Does the change affect undo/redo, persistence, or cross-tab sync?

### Risk indicators
- Global store shared across many components → Scope Size: 4–5
- Async side effects present → Runtime Impact: 3–5
- No integration or E2E tests → Test Coverage: 4

---

## 6. Pure Refactor

**Risk profile:** Lower risk, but behavior preservation must be verified.

### Code exploration checklist
- `Grep` for all usages to confirm complete coverage of the rename/restructure
- Check that all public exports are preserved or updated
- Verify type signatures are identical (no accidental loosening)
- Confirm tests still pass without modification

### Key questions
- Is this truly behavior-preserving, or does it introduce logic changes?
- Are there dynamic usages (string-based method calls, reflection) that Grep might miss?

### Risk indicators
- Dynamic property access or reflection → Scope Size +1, Change Type +1
- Barrel re-exports not updated → Surface Area: 3–4
- No tests → Test Coverage: 4–5

---

## 7. Performance-Sensitive Change

**Risk profile:** May introduce latency or resource exhaustion under load.

### Code exploration checklist
- `Read` the affected query or loop logic to identify complexity
- `Grep` for similar patterns elsewhere to assess prevalence
- Check if the path is on a hot route (called frequently or in a loop)
- Look for existing performance tests or benchmarks

### Key questions
- Is a loop introduced inside another loop (O(n²) risk)?
- Is a new synchronous database call inside an async loop (N+1 risk)?
- Does the change affect caching layers?

### Risk indicators
- N+1 query in a list endpoint → Performance Impact: 4–5
- No indexes on new filter columns → Performance Impact: 4
- Synchronous I/O in a high-throughput path → Performance Impact: 5
- No load tests → Test Coverage: 4

---

## 8. Cross-service / Integration Change

**Risk profile:** Coordination risk; other teams may be unblocked or broken.

### Code exploration checklist
- `Grep` for all SDK or client usages of the changed service contract
- `Glob` for integration test suites covering the interface
- Check API gateway config, service mesh routing, or event bus schemas
- Look for consumer-driven contract tests (Pact, etc.)

### Key questions
- Which other services consume this interface?
- Is there a shared schema or protobuf/OpenAPI spec that needs updating?
- What is the deploy order dependency?

### Risk indicators
- Shared event schema change → API Stability: 4–5, Cross-team Impact: 4–5
- No consumer contract tests → Test Coverage: 4
- Deploy order dependency → Cross-team Impact: 4
- Undocumented consumers → Scope Size: uncertain (flag explicitly)
