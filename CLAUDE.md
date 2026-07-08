# MogulGame Client

API client SDK for MogulGame with TanStack Query hooks.

**npm**: `@sudobility/mogulgame_client` (public, BUSL-1.1)

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Build**: TypeScript compiler (ESM)
- **Test**: Vitest
- **Data Fetching**: TanStack Query 5

## Project Structure

```
src/
├── index.ts                          # Main exports
├── types.ts                          # QUERY_KEYS factory, FirebaseIdToken, cache defaults
├── network/
│   ├── index.ts                      # Network exports
│   ├── StarterClient.ts              # HTTP client class (DI-based)
│   └── StarterClient.test.ts
├── hooks/
│   ├── index.ts                      # Hook exports
│   ├── useProperties.ts              # usePropertySearch, useProperty, usePropertyHistory
│   ├── useOffers.ts                  # Offers query + create/update/cancel mutations
│   ├── useUserProfile.ts             # useUserProfile, useTransactions
│   ├── useLeaderboard.ts             # Rankings by balance or wins
│   ├── usePopularProperties.ts       # /views/popular
│   └── useFavorites.ts               # useFavorites (+ mutations), useFavoriteCheck
└── utils/
    ├── index.ts                      # Utility exports
    └── starter-helpers.ts            # createHeaders, createAuthHeaders, buildUrl, handleApiError
```

**The class is named `StarterClient`, not `MogulGameClient`** — template lineage from `starter_client`.
Consumers alias it on import (`import { StarterClient as MogulGameClient }`). Renaming it is a
breaking change for every consumer.

## Commands

```bash
bun run build          # Build ESM
bun run clean          # Remove dist/
bun run test           # Run Vitest tests (colocated *.test.ts files)
bun run typecheck      # TypeScript check
bun run lint           # Run ESLint
bun run verify         # typecheck + test + build (use before commit)
bun run prepublishOnly # Clean + build (runs on publish)
```

## Key Concepts

### StarterClient

HTTP client class constructed with `{ baseUrl, networkClient }`. Uses dependency injection via the
`NetworkClient` interface from `@sudobility/types` — **this package never calls `fetch` directly**.
Every method is the same shape: `buildUrl` → `networkClient.<verb>` → `validateResponse`.

Methods map 1:1 to `mogulgame_api` endpoints: `searchProperties`, `getProperty`,
`getPropertyHistory`, `getOffers`, `getOffer`, `createOffer`, `updateOffer`, `cancelOffer`,
`getUserProfile`, `getTransactions`, `getLeaderboard`, `getPopularProperties`, `favoriteProperty`,
`unfavoriteProperty`, `getFavorites`, `checkFavorites`, `getUser`.

There is **no SDK coverage** for `/api/v1/searches/recent` or `/api/v1/searches/mine`.

### Hooks

Hooks take `networkClient` and `baseUrl` as the first two parameters (parameter-based DI, no
provider/context) and build a memoized `StarterClient` internally. Mutations are folded into
`useOffers` and `useFavorites` rather than exported separately.

### Crawler Requests

`getProperty` / `getPropertyHistory` and their hooks accept `{ crawler?: boolean }`. When true they
append `?crawler=true`, which tells the API to skip its RealtyAPI refresh, `property_views` write,
and offer resolution. `searchProperties(params)` takes a `Record<string, string>`, so callers pass
`crawler: 'true'` as an ordinary param — no signature change was needed.

`QUERY_KEYS` deliberately does **not** include the crawler flag: it is constant for a session, so a
crawler and a human never share a cache within one page load.

### QUERY_KEYS

Cache key factory in `src/types.ts`, all namespaced under `'mogulgame'`. Used internally by hooks and
available for manual invalidation.

### Cache Settings

- `staleTime`: 5 minutes (`DEFAULT_STALE_TIME`)
- `gcTime`: 30 minutes (`DEFAULT_GC_TIME`)

## Dependencies

Peer:

- `react` (>=18)
- `@tanstack/react-query` (>=5)
- `@sudobility/types` — `NetworkClient` interface, `BaseResponse`

`@sudobility/mogulgame_types` is a **devDependency**, not a peer. It is type-only here, so this
compiles — but consumers must install it themselves.

## Related Projects

- **mogulgame_types** — Shared type definitions (`Property`, `PretendOffer`, request/response types) and runtime helpers
- **mogulgame_api** — Backend server this SDK talks to over HTTP
- **mogulgame_lib** — Pure helpers. It does **not** import this package, and this package does not import it
- **mogulgame_app** — Web frontend; imports these hooks **directly**, not via mogulgame_lib
- **mogulgame_app_rn** — React Native app; depends on the published package, not a `file:` link

The consumer supplies `NetworkClient`, allowing different implementations per platform. In the web
app that is `FirebaseAuthNetworkService` (from `@sudobility/auth_lib`) extending `WebNetworkClient`.

## Coding Patterns

- `QUERY_KEYS` factory in `src/types.ts` provides cache keys -- always use it for query keys
- `StarterClient` accepts `{ baseUrl, networkClient }` via constructor -- never use `fetch` directly inside this package
- Hooks receive `networkClient` and `baseUrl` as the first two parameters and memoize a `StarterClient` internally -- no singleton, no context
- `useOffers` and `useFavorites` combine query and mutations in a single hook -- mutations invalidate related queries in `onSuccess`
- Default `staleTime` is 5 minutes and `gcTime` is 30 minutes -- respect these unless there is a specific reason
- Extend the existing `options` object on a method rather than adding a parameter (this is how `crawler` was added alongside `timeout`)

## Gotchas

- `NetworkClient` is dependency-injected -- never import or use `fetch` directly
- **Mutations resolve rather than throw on `{success: false}`.** `useOffers`' `mutationFn` returns the `BaseResponse` and only invalidates when `response.success` is true. A business-logic rejection that arrives as HTTP 200 will look like success to the caller. It works today only because `WebNetworkClient` throws `NetworkError` on non-2xx
- `useFavoriteCheck` calls `propertyIds.sort()` -- an **in-place mutation of the caller's array**
- `QUERY_KEYS.leaderboard()` and `QUERY_KEYS.favorites()` omit `page`/`limit`, so paginating would return the cached first page. Not currently exercised
- `handleApiError` is exported and tested but has **no production call sites**
- `mogulgame_app` bypasses this SDK for favorites, popular properties, transactions, and searches -- it hand-rolls those calls. Prefer wiring pages to the hooks rather than adding more raw calls
- This is a published npm package -- breaking changes require version bumps and coordination with consumers. Editing `src/` has **no effect** on `mogulgame_app` until published and the dep bumped; use `bun link` for local iteration
