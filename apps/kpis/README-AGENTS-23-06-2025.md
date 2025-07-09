# README for AI Agents – Monday.com Integration Guidelines

**Date:** June 24, 2025

This document describes the patterns and conventions for interacting with the Monday.com API within this codebase. AI agents should follow these guidelines when adding, modifying, or reviewing Monday.com integration code.

---

## 1. Overview

* The Monday.com integration uses GraphQL over HTTP.
* A shared, typed client function (`mondayRequest`) handles all requests.
* GraphQL operations are defined in dedicated `.query.ts` files.
* High‑level business logic lives in corresponding `.service.ts` modules.
* Next.js API routes and React server components/pages consume those service functions.

---

## 2. Core GraphQL Client

* **File**: `src/lib/auth.ts`
* **Function**: `mondayRequest<TData>(session, query, variables?)`

  * Sends a POST request to `https://api.monday.com/v2` with `{ query, variables }`.
  * Injects the user's `session.accessToken` into the `Authorization` header.
  * **Always** include the header `API-Version: "2024-01"` (or a newer version) so that features like `items_page`, larger `limit` values, and cursor‑based pagination work reliably. Skipping this header can trigger `400 Bad Request` responses.
  * Throws on non‑2xx responses and propagates any GraphQL `errors` array.
  * Returns `payload.data` typed as `<TData>`.

---

## 3. Queries

* **Location**: `src/lib/monday/*.query.ts`
* **Naming**:

  * Export named constants that match the operation name, e.g. `GET_BOARDS`, `GET_CURRENT_USER`, `GET_PA_ACTIVITIES_PAGE`.
* **Variable types**:

  * Use `[ID!]` for board IDs instead of `[Int!]` to match the Monday schema.
* **Pagination**:

  * Prefer `limit` (Int) and `cursor` (String) arguments on `items_page`.
  * Do **not** request the deprecated field `has_more`; when the API has no further pages it simply returns `cursor: null`.
* **Example**:

  ```graphql
  query GetPAActivities($boardId: [ID!], $limit: Int!, $cursor: String) {
    boards(ids: $boardId) {
      items_page(limit: $limit, cursor: $cursor) {
        cursor           # null => no more pages
        items {
          id
          name
        }
      }
    }
  }
  ```

---

## 4. Services

* **Location**: `src/lib/monday/*.service.ts`
* Each service:

  1. Imports its query from `.query.ts`.
  2. Calls `mondayRequest<T>(session, QUERY, variables)`.
  3. Implements cursor‑based pagination when necessary: loop while `cursor` is not `null`; never send `cursor: null` in the variables payload.
  4. Returns **only** the typed data (e.g. `Board[]`, `BoardItem[]`). No inline queries or manual `fetch` calls here.

---

## 5. Next.js API Routes

* **Location**: `src/app/api/monday/**/route.ts`
* Responsibilities:

  1. Validate the session via `validateSession(request)`.
  2. Extract path or query parameters.
  3. Call the appropriate service function.
  4. Return JSON shaped as `{ data: { ... } }` or `{ error: msg }`.
  5. Do **not** re‑implement GraphQL queries or token logic.

---

## 6. React Pages / Server Components

* Consume service functions directly (e.g. `fetchBoardDetails(session, id)`).
* Do not duplicate validation or query logic.

---

## 7. Pagination Pattern (limit/cursor)

1. Set `limit` to an integer (max 500 with API 2024‑01).
2. Omit the `cursor` variable on the very first request.
3. Read the returned `cursor` string. If it is `null`, there are no more pages.
4. On subsequent requests, include the `cursor` value exactly as received.
5. Merge arrays client‑side until the cursor comes back `null`.

> **Tip:** Cursors expire after roughly one hour. If you receive a `CursorExpiredError`, restart pagination from page 1.

---

## 8. Adding a New Monday.com Endpoint

1. Create `src/lib/monday/<resource>.query.ts` with the GraphQL operation following the conventions above.
2. Create `src/lib/monday/<resource>.service.ts` that imports the query and exposes typed helper functions.
3. Update `src/types/monday.ts` or `src/types/auth.ts` with any new types.
4. Add or update a Next.js API route under `src/app/api/monday/...` to call your service.
5. Update the UI layer (hooks, pages, or components) to consume the new API route or service.

---

## 9. Conventions

* **No step‑by‑step comments**: Add comments only when clarifying business intent or non‑obvious code structure.
* **Naming**: PascalCase for types, UPPER\_SNAKE\_CASE for query constants, camelCase for functions.
* **Typing**: Always type GraphQL responses (`mondayRequest<T>`).
* **Modularity**: Keep queries, services, routes, and UI layers decoupled.

Refer to existing modules for concrete examples. Following these guidelines ensures a consistent, maintainable Monday.com integration throughout the project.
