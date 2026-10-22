# Camp Fearless portal

The staff portal for Mavuno Camp Fearless. Staff use it to set up a camp edition, register walk-ins, issue waivers, verify M-Pesa payments, check campers in and out, and print reports. It is a front end built on sample data: every screen, rule and form is final, and the data and the server calls are placeholders until the backend exists.

The public side (the welcome page and the MYF, MYA and facilitator registration pages) is a separate project, `campfearless-welcome`.

## What is in it

| Screen | What it does |
|---|---|
| Dashboard | Live numbers, check-in lookup, walk-in registration and the camp roster for the open edition |
| Camp setup | Editions, each camp's dates and fees, the registration window, the welcome page content |
| Registration | Walk-in registration, up to ten campers on one M-Pesa code |
| Waivers | Free registrations, issued at the desk or in advance |
| Payments | Verify M-Pesa payments by hand (camper and facilitator fees) |
| Reports | Campers, facilitators, and age and gender, with filters, print and CSV export |
| Users and roles, Campuses and networks | Who can sign in and what they can do; the campus and network lists |
| Audit log | Every change and every sensitive view, filterable |

## Getting started

You need Node 20 or newer and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Until sign-in exists the portal opens as John Doe, a Super admin; any sample staff email with any password signs in from the login page.

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build (what Vercel runs) |
| `pnpm test` | Run the unit tests (Vitest) |

## How it is organised

```
app/          Routes (one folder per screen) and global styles
components/   Screen components and shared building blocks
ui/           shadcn/ui primitives (radix-nova style)
lib/          Data, rules and helpers: records, camp data, editions, validation, permissions
tests/        Unit tests for the rules in lib/
docs/         Backend hand-off and design documents
public/       Images, logo and icons
```

Everything the screens show comes from one place per fact (`lib/records.ts`, `lib/camp-data.ts`, `lib/editions.ts`, `lib/staff.ts`, `lib/campuses.ts`). The backend replaces those files with API calls; the screens do not change.

## Documents

- [`docs/design-rules.md`](docs/design-rules.md): the design system and the rules every screen follows.
- [`docs/backend-tables.md`](docs/backend-tables.md): the tables and rules the server needs, and what is placeholder.
- [`docs/api-endpoints.md`](docs/api-endpoints.md): what each screen reads and saves.

## Deployment

The portal deploys to Vercel from the `master` branch. There are no environment variables yet.
