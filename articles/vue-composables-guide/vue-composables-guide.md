---
title: "Building Reusable Vue Composables: A Practical Guide"
slug: "vue-composables-guide"
excerpt: "How to extract Vue 3 composables that are actually reusable: state ownership per call, cleanup, naming conventions, and where composables stop being the right tool."
metaTitle: "Vue Composables: A Practical Guide to Reusable Logic"
metaDescription: "Learn how to build reusable Vue 3 composables the right way: per-call state isolation, cleanup on unmount, naming conventions, and when composables aren't the answer."
categories:
  - "Vue.js"
tags:
  - "Vue 3"
  - "Composables"
  - "Frontend"
keywords:
  - "vue composables"
  - "vue 3 custom composables"
  - "vue composable best practices"
  - "reusable logic vue 3"
  - "vue useX pattern"
featuredImage: "./images/hero.png"
imageAlt: "Diagram showing three Vue components, UserProfile, AdminDashboard, and SettingsPanel, all sharing logic from a useAuth composable that manages reactive state and side effects"
status: "draft"
author: "Nurfirliana Muzanella"
date: "2026-09-07"
---

# Building Reusable Vue Composables: A Practical Guide

Three components copy-pasting the same fifteen lines of "fetch data, track loading state, handle errors" is the moment a Vue codebase is ready for a composable. The mechanics of writing one are simple: it's a function that uses `ref`, `computed`, or `watch` and returns some of them. The part that actually determines whether it's reusable, rather than just relocated, is state ownership: does each component that calls it get its own independent state, or do they all end up sharing one?

This article covers how to write composables that behave correctly when used from multiple components at once, the naming convention that makes them recognizable, and (just as importantly) when extracting one isn't actually the right call.

## The Core Rule: State Belongs Inside the Function

A composable is reusable *logic*, not shared *state*, unless you specifically intend the state to be shared. The distinction lives entirely in where you declare the reactive state:

```javascript
// composables/useCounter.js

// CORRECT: state declared inside the function.
// Every call gets its own independent count.
export function useCounter(initial = 0) {
  const count = ref(initial);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  return { count, increment, decrement };
}
```

```javascript
// WRONG: state declared at module scope.
// Every component that calls useCounter shares this one `count`.
const count = ref(0);
export function useCounter() {
  const increment = () => count.value++;
  return { count, increment };
}
```

The second version isn't a bug in the sense that it'll throw an error: it'll run fine, right up until two components use it and one's counter mysteriously changes the other's. This is the single most common mistake when someone extracts their first composable, usually because the working example they copied genuinely wanted shared state (an app-wide theme setting, for instance) and the pattern got applied somewhere it didn't fit.

**When you do want shared state across every consumer** (an authentication state that should be identical no matter which component reads it) declaring the `ref` at module scope is the correct, deliberate choice, not a mistake. The difference is intent: shared state should be shared on purpose, not as a side effect of where a `ref` happened to be declared.

## A Complete, Realistic Example

Here's a composable that fetches data, tracks loading and error state, and cleans up correctly:

```javascript
// composables/useFetch.js
import { ref, watchEffect } from 'vue';

export function useFetch(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(true);

  let controller;

  const execute = async () => {
    loading.value = true;
    error.value = null;
    controller = new AbortController();

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      data.value = await response.json();
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err;
      }
    } finally {
      loading.value = false;
    }
  };

  watchEffect((onCleanup) => {
    execute();
    onCleanup(() => controller?.abort());
  });

  return { data, error, loading, refetch: execute };
}
```

Used from a component:

```vue
<script setup>
import { useFetch } from '@/composables/useFetch';

const { data: posts, error, loading } = useFetch('/api/posts');
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">{{ error.message }}</p>
  <ul v-else>
    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

Two details here matter beyond the happy path. First, `watchEffect`'s `onCleanup` callback runs before the effect re-runs and when the owning component unmounts: using it to call `controller.abort()` means an in-flight request from a component that's since navigated away doesn't finish and try to update state on a component that no longer exists. Second, `url` as a plain string argument means this composable doesn't react to a *changing* URL; if the composable needs to refetch when its input changes, `url` should be accepted as a `ref` or a getter function, and read reactively inside `watchEffect` instead of captured once as a plain value.

## Naming and Return Shape Conventions

Vue's own composables (`useRouter`, `useAttrs`) established a convention worth following consistently: prefix with `use`, and return either a single ref (for something simple) or a plain object of refs and functions (for anything with more than one piece of state). Returning an object rather than an array, unlike React's `useState` convention, means consumers destructure by name rather than by position: `const { data, loading } = useFetch(...)` reads clearly regardless of order, and adding a new returned property later doesn't break existing call sites the way inserting into an array's middle would.

Consistency here isn't just style: a `useX` name that returns something is instantly recognizable as composable logic rather than a plain utility function, which matters when scanning a file for what's reactive versus what's a plain synchronous helper.

## Where Composables Should Live

For a small project, a flat `composables/` directory is enough. As the number grows, grouping by feature (mirroring the same feature-oriented structure worth using for components) keeps a composable discoverable near the feature that owns it, while anything genuinely cross-cutting (a `useFetch` or `useDebounce` used everywhere) stays in a shared top-level `composables/` directory. The same "does this have feature-specific meaning" question that applies to organizing backend code applies here too: see [How to Structure a NestJS Project with TypeScript](../nestjs-project-structure/nestjs-project-structure.md) for the same principle applied on the backend.

## When Not to Extract a Composable

Not every reusable-looking snippet needs to become one. A composable is the right tool when logic involves **reactive state, side effects, or lifecycle hooks** that need to behave correctly across multiple components. If a function is a pure transformation (formatting a date, calculating a total from an array) it doesn't need `ref` or lifecycle awareness at all, and wrapping it in a composable just adds indirection without benefit. A plain exported function does the job, is easier to unit test without a component context, and doesn't invite someone to (incorrectly) call it outside of `setup()`, where composables that rely on lifecycle hooks will throw or silently no-op.

## Common Mistakes

**Declaring state at module scope by accident.** Covered above: the fix is checking, for every composable, whether shared state was actually intended.

**Calling lifecycle-dependent composables conditionally or outside `setup()`.** `onMounted`, `onUnmounted`, and similar hooks rely on Vue tracking which component instance is currently being set up. Calling them inside an `if` block, inside a `setTimeout` callback, or after an `await` in an async `setup()` breaks that tracking, because by the time the hook call executes, Vue no longer has the right component context active.

**Not cleaning up side effects.** A composable that adds an event listener, opens a WebSocket connection, or starts an interval needs a matching `onUnmounted` (or `watchEffect`'s `onCleanup`): otherwise every component instance that used it leaves something running after it's gone.

**Over-abstracting a single use site.** Extracting a composable used by exactly one component, purely because "it might be reused later," adds a layer of indirection for a benefit that may never materialize. The three-times rule is a reasonable default: extract once genuine duplication shows up, not preemptively.

## Best Practices

- Declare reactive state inside the composable function unless shared state is a deliberate choice.
- Prefix names with `use`, and return an object of named refs/functions rather than an array.
- Clean up every side effect (listeners, timers, subscriptions, in-flight requests) on unmount.
- Accept reactive inputs as refs or getters when the composable needs to react to their changes.
- Keep pure, non-reactive logic as plain functions instead of composables.

## FAQ

**Can a composable call another composable?**
Yes, and it's a normal, encouraged pattern: a `useAuthenticatedFetch` composable might internally call `useFetch` and `useAuth`, composing smaller pieces into a more specific one, as long as the composition still happens inside a `setup()` call chain so lifecycle hooks resolve correctly.

**Do composables work outside of components, like in a Pinia store?**
Many do, since a composable is ultimately just a function using Vue's reactivity primitives, which work independently of components. Composables that rely on lifecycle hooks (`onMounted`, `onUnmounted`) are the exception: those specifically require an active component instance and won't function correctly called from arbitrary code.

**How is a composable different from a Pinia store?**
A composable's state lives and dies with whatever calls it, unless deliberately hoisted to module scope. A Pinia store is explicitly global, singleton state by design, with its own devtools integration and persistence options. Reach for a composable for logic that's naturally scoped to where it's used; reach for a store when state genuinely needs to be shared and centrally managed across the whole app.

## Conclusion

The mechanics of writing a composable are simple enough to learn in five minutes; what separates a genuinely reusable one from a source of hard-to-track bugs is being deliberate about where state is declared, cleaning up every side effect it starts, and resisting the pull to extract one before real duplication exists. Get those three things right and composables become the most effective tool the Composition API offers for keeping component logic both reusable and easy to reason about.

## References

- [Vue.js documentation: Composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue.js documentation: Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue.js documentation: watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect)
