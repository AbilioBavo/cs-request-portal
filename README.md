# Service Request Portal

A responsive single-page application for browsing, creating and progressing customer service requests. It consumes the supplied OpenAPI 3 contract and authenticates through a standards-compliant OpenID Connect provider.

## Solution overview

Authenticated agents land on a paginated list of service requests. Filters, search, sort and page live in the URL, so a view is shareable and the browser back button undoes each step. Opening a request shows its full description and lifecycle metadata. Status changes are restricted to the transitions the contract allows and carry the last-read `version` so two people cannot overwrite each other unnoticed. Creating a request validates against the same constraints the API enforces; a `422` from the server is merged into the same fields.

No backend ships with the challenge. Mock Service Worker implements the contract in the browser, in unit tests and in Playwright, including `400`, `401`, `403`, `404`, `409` and `422` problem+json responses.

## Technology and library choices

| Choice                                                                                   | Why                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| React 19 + TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | Required by the brief; the extra compiler flags catch the mistakes the contract makes easy (missing page items, optional query params).        |
| Vite 8                                                                                   | Already in the scaffold; fast refresh and native `import.meta.env`.                                                                            |
| React Router 7                                                                           | The routing solution every reviewer already knows. Search params are parsed with Zod instead of relying on a typed-router.                     |
| TanStack Query 5                                                                         | Server cache, `keepPreviousData` while paging, retry only on transport/`5xx`. A global store would re-solve problems Query already solves.     |
| `openapi-typescript` + `openapi-fetch`                                                   | Types generated from the YAML, paths and bodies checked at compile time, 6 kB runtime. `pnpm api:check` fails CI if the generated file drifts. |
| `react-oidc-context` + `oidc-client-ts`                                                  | Authorization code flow with PKCE. No implicit grant, no client secret in the browser.                                                         |
| react-hook-form + Zod                                                                    | Uncontrolled inputs, validation on blur, schemas that copy the OpenAPI min/max lengths.                                                        |
| Tailwind CSS 4                                                                           | Mobile-first layout without a CSS-in-JS runtime. Radix Dialog is used only for the confirm and conflict modals.                                |
| MSW 2                                                                                    | One implementation of the contract shared by dev, Vitest and Playwright.                                                                       |
| Vitest + Testing Library + Playwright                                                    | Unit/integration in jsdom, browser journeys in Chromium desktop and a mobile viewport.                                                         |
| GitHub Actions                                                                           | Lint, typecheck, contract drift, coverage, payload budget, e2e, CodeQL, Pages deploy.                                                          |

## Architecture summary

```
Browser
  React Router  ->  feature pages
                      |  TanStack Query
                      v
                 openapi-fetch client  --Bearer-->  MSW handlers  ->  in-memory store
                      ^
                 oidc-client-ts  --PKCE-->  Keycloak (or any OIDC issuer)
```

The address bar is the source of truth for the list. `useListQuery` reads it, drops anything the API would reject with `400`, and feeds TanStack Query. Mutations write the returned resource into the detail cache and invalidate lists.

Error payloads are RFC 7807 problem documents. The client turns every non-2xx (and transport failures) into an `ApiProblem` so screens handle one type.

### Assumptions where the contract is silent

The YAML has no `servers` block and no `securitySchemes`, even though responses include `401` with `WWW-Authenticate: Bearer` and a `403` that names the scope `service-requests.write`. This application assumes:

- API base URL `/api` (`VITE_API_BASE_URL`)
- Bearer access tokens
- Scopes `service-requests.read` and `service-requests.write`

There is no endpoint to edit title, description, category or priority after creation, and no history of status notes. Those fields are read-only in the UI; the optional transition `note` is accepted by the mock and not displayed, matching the contract.

## Local setup

Requirements: Node 22, pnpm 10, Docker (only for the identity provider).

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The app is at http://localhost:5173. With `VITE_ENABLE_API_MOCKS=true` (the default in `.env.example`) the API is served by MSW.

### OIDC provider configuration

A Keycloak 26 realm is in [`docker/keycloak`](docker/keycloak):

```bash
docker compose -f docker/keycloak/docker-compose.yml up
```

|               |                                                                     |
| ------------- | ------------------------------------------------------------------- |
| Issuer        | `http://localhost:8080/realms/service-requests`                     |
| Client        | `service-request-portal` (public, PKCE S256)                        |
| Redirect URIs | `http://localhost:5173/*`, `http://localhost:4173/*`                |
| Demo user     | `agent` / `agent`                                                   |
| Scopes        | `openid profile email service-requests.read service-requests.write` |

Admin console: http://localhost:8080 (`admin` / `admin`). The issuer is configuration, so Auth0 or Entra work by pointing `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID` at them and registering the same redirect URIs.

Tokens are kept in `sessionStorage`: they survive a reload of the same tab and disappear when it closes. An in-memory store would be stricter against XSS but would force a silent renew through a third-party iframe on every reload, which browsers increasingly block. The CSP below is the compensating control. `monitorSession` is off because it is a common source of redirect loops behind reverse proxies.

### Environment variables

See [`.env.example`](.env.example). Vite inlines `VITE_*` at build time, so a production build must be created with the intended values. Do not put secrets in these variables; a public SPA client id is not a secret.

| Variable                | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | API prefix. Default `/api`.                                             |
| `VITE_ENABLE_API_MOCKS` | Start MSW in the browser.                                               |
| `VITE_OIDC_AUTHORITY`   | OIDC issuer URL.                                                        |
| `VITE_OIDC_CLIENT_ID`   | Public client id.                                                       |
| `VITE_OIDC_SCOPE`       | Space-separated scopes.                                                 |
| `VITE_DEMO_AUTH`        | Replace the provider with a fixed session. Leave `false` in production. |
| `VITE_BASE_PATH`        | Set at CI build time for GitHub Pages (`/repo-name/`).                  |

### API mocking approach

[`src/mocks`](src/mocks) is a stateful implementation of the three operations in the contract:

- 42 deterministic seed records covering every status and priority
- Search over title **or** requester name, case-insensitive
- Status and priority filters, sort expressions, pagination (`pageSize` 1..100)
- Transition matrix and optimistic concurrency on `version`
- RFC 7807 bodies for every documented error, including `400` on unknown query parameters and undeclared payload properties

The same handlers run under `msw/browser` (dev), `msw/node` (Vitest) and the production build when `VITE_ENABLE_API_MOCKS=true`. Requests to the OIDC issuer are not intercepted (`onUnhandledRequest: 'bypass'`).

To point the UI at a real API later, set `VITE_ENABLE_API_MOCKS=false` and `VITE_API_BASE_URL` to that server. No other code change is required.

## Commands

```bash
pnpm dev            # Vite dev server
pnpm verify         # typecheck, lint, format check, unit tests
pnpm test           # Vitest
pnpm coverage       # Vitest with v8 coverage gates
pnpm test:e2e       # Playwright (Chromium desktop + mobile viewport)
pnpm build          # production bundle
pnpm preview        # serve the bundle
pnpm api:types      # regenerate src/api/schema.d.ts from the YAML
pnpm api:check      # fail if the generated types drifted
pnpm build:budget   # build, then check the initial payload against the budget
pnpm format:write   # Prettier
```

## Performance

Route pages are lazy, so the first load carries the shell and the list only. `pnpm build:budget` sums the gzip size of everything `index.html` pulls in before the first render and fails above 190 kB; the app currently sits at about 156 kB. Raising the ceiling is a deliberate edit to `BUNDLE_BUDGET_KB`, not something a new dependency can do quietly. The demo build additionally loads the MSW worker chunk, which a real deployment does not.

## Testing strategy

- **Unit:** query-string parser (whitelist, defaults), `ApiProblem` for each status, transition matrix, Zod schemas on the contract limits, date labels.
- **Integration (Testing Library + MSW):** list filters write the URL, search is debounced, empty-filtered vs empty-absolute, create validation and `422` mapping, legal status options, `409` conflict dialog, `5xx` retry.
- **Auth wiring:** route guard redirects and remembers the location, callback refuses an off-site `returnTo`, expired token retries a silent renew before sending the agent back to the provider, missing write scope hides the control.
- **E2E (Playwright):** list, filter, create, open, progress, plus the filtered empty state. The session comes from `VITE_DEMO_AUTH` so CI does not depend on Keycloak. Chromium desktop and a Pixel 7 viewport.
- **Coverage gates:** 80% lines, statements and functions globally, 70% branches; 90% on `src/api/**` and `src/features/requests/**`. Currently 86% statements and 81% branches. Presentation-only files can sit below that; the contract-critical logic cannot.

## GitHub Actions

| Workflow                                     | What it does                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`ci.yml`](.github/workflows/ci.yml)         | Types, lint, format, contract drift, coverage gates, payload budget, and Playwright on a real build                     |
| [`deploy.yml`](.github/workflows/deploy.yml) | Build with `VITE_BASE_PATH` and publish to GitHub Pages. `404.html` is a copy of `index.html` so client routes resolve. |
| [`codeql.yml`](.github/workflows/codeql.yml) | JavaScript/TypeScript analysis on pushes, pull requests and weekly                                                      |
| Dependabot                                   | Weekly npm and Actions updates                                                                                          |

Pages has no API and no reachable issuer, so the published artifact is a demo build: MSW answers the API, the session is fixed, and a banner in the UI names what is simulated. Every other environment goes through the real redirect flow.

## Security and accessibility

- Authorization code + PKCE, no implicit flow, no client secret
- Silent renew on `401`, then a redirect that restores the current location
- Callback `state.returnTo` must be an in-app path (`/` but not `//`) so it cannot become an open redirect
- Sign-out clears the TanStack Query cache
- Tokens never logged; `console.log` is an ESLint error
- Suggested production CSP: `default-src 'self'; connect-src 'self' <issuer> <api>; frame-src <issuer>; object-src 'none'; base-uri 'self'`
- Semantic table with `<caption>` and `aria-sort`, skip link, visible focus, `role="status"` for result counts, `role="alert"` for errors, dialogs from Radix (focus trap and restore), `prefers-reduced-motion`, contrast on status/priority badges (colour is never the only signal)

## Known limitations

- No real Service Request API is provided; MSW is the implementation. Swap it out with `VITE_API_BASE_URL`.
- The contract does not expose edit, delete, attachments, bulk actions or a transition history. The UI does not invent them.
- `category` is free text. The form suggests common values but does not restrict them.
- `note` on a status change is stored by the mock and never returned, so it cannot be shown afterwards.
- E2E does not exercise the live Keycloak redirect. That path is covered by a local run with Docker.
- `VITE_DEMO_AUTH` bypasses authentication by design. It belongs to the Playwright suite and the Pages demo; enabling it on a real deployment would publish an unauthenticated app, which is why the banner is not dismissible.
- GitHub Pages inlines configuration at build time; changing it requires a rebuild.

## Branching and commits

Trunk-based on `main`. Branches `feat/*`, `fix/*`, `chore/*`. Conventional Commits, enforced by commitlint. PRs use the checklist in [`.github/pull_request_template.md`](.github/pull_request_template.md).
