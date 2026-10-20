# Campfearless portal: UI rules

`components/dashboard-overview.tsx` is the reference screen. Every new screen must match its spacing, type, colors, badges, toasts and component usage. If a rule below is unclear, copy what that file does. Never use a pattern that file doesn't use.

`components/camp-setup.tsx` is the reference for settings screens: editable cards, the review-before-save dialog, date fields, money fields and link status badges. Copy it for any screen where people change saved settings.

## Components

- Import UI primitives from `@/ui/*` (e.g. `@/ui/button`, `@/ui/card`). There is no `components/ui` folder.
- Use `cn` from `@/lib/utils`.
- `components.json` uses the shadcn **`radix-nova`** style: the nova look (32px / `h-8` controls, `rounded-lg` controls, `rounded-xl` cards with a `ring-1 ring-foreground/10` edge, 16px card spacing) on Radix primitives imported from the unified `radix-ui` package. Add missing components with the shadcn MCP or `pnpm dlx shadcn@latest add <name>`. They install into `ui/` already matching. The project uses **pnpm**, never npm or yarn.
- Exception: `ui/dialog.tsx` is the Base UI (`base-nova`) dialog. It already has the nova look. Never run `shadcn add dialog` or `--overwrite` on it.
- After every `shadcn add`, check the new files before using them:
  - `import { cn } from "cn"` must be `import { cn } from "@/lib/utils"`. If `package.json` gained a `cn` dependency, remove it (`pnpm remove cn`); it is an unrelated npm package.
  - Tailwind v3 CSS-variable classes must be v4 syntax: `h-[--cell-size]` → `h-(--cell-size)`. The v3 form silently produces no styles. Declarations with a colon (`[--cell-size:2rem]`) stay as they are.
  - Re-apply local changes the overwrite removed. The only one today is the success/error toast styles in `ui/sonner.tsx`.
- `TooltipProvider` wraps the app in `app/layout.tsx`. The sidebar's tooltips crash without it.
- If a component comes from another style or registry, restyle it to match before using it: `h-8` controls, `rounded-lg`, `text-sm`, same focus ring as `ui/button.tsx`.

## Colors

- Only use theme tokens (`bg-primary`, `text-muted-foreground`, `border`, `bg-muted/50`, ...). **No hex values or Tailwind palette colors in components.** The exceptions are the toast styles in `ui/sonner.tsx` and the chart palette below.
- Custom tokens live in `app/globals.css`. Defined in `:root`, with dark values in `.dark`, and registered in `@theme inline` as `--color-*`.
  - `brand` / `brand-hover` / `brand-foreground`: `#336699`. Used **only** for the per-row "Check in" action in tables: `className="bg-brand text-brand-foreground hover:bg-brand-hover"`. Every other primary action uses the default near-black `Button`.
  - `status-*` pairs: badge backgrounds and text (see Badges).
- Destructive meaning uses `text-destructive`: menu items, alert icons, inline field errors. Not red palette classes.
- Progress bars (undo overlay, usage bars) use `bg-emerald-500` on a `bg-muted` track, `h-1.5`. This is the only palette class allowed outside the exceptions above.
- Every screen must look right in light **and** dark. Test dark with the header switch, not only with system dark mode. A token without a `.dark` value is a bug.
- New color need: add a token pair to `:root` and `.dark`, register it in `@theme inline`, then use the utility.

## Layout and spacing

- Page shell: `SidebarProvider` + `AppSidebar variant="inset"` + `SidebarInset` + `SiteHeader title="…"`, as in `app/dashboard/page.tsx` and `app/camp-setup/page.tsx`. The header title is the page name in sentence case.
- Each new route gets a `url` on its item in `components/app-sidebar.tsx`. The active item comes from the current path, never a hardcoded `active` flag.
- Each route has a `loading.tsx` that renders the same shell with a skeleton of that page (`components/dashboard-skeleton.tsx`, `components/camp-setup-skeleton.tsx`). Build the skeleton from `Skeleton` in `@/ui/skeleton`, mirroring the real cards, columns and field heights (`h-8` for controls) so nothing jumps when content arrives.
- Page content: `<main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">`.
- Gaps between sections and between cards: `gap-4`. Responsive grids: `grid gap-4 md:grid-cols-2` / `lg:grid-cols-2`. Add `min-w-0` to grid children that hold charts or tables.
- Inside cards: `gap-4` between blocks, `gap-2` between stacked list items, `gap-3` between any buttons placed side by side and between an input and its button.
- Card padding comes from `ui/card.tsx` (`--card-spacing`, 16px). Don't override it.
- Multi-column settings cards: `grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3`, each column a `<section className="flex min-w-0 flex-col gap-4">` headed by `<h3 className="text-sm text-muted-foreground">`. Three columns only from `xl`: with the sidebar open, `lg` columns are too narrow for date fields. A column that would sit alone at `md` spans both (`md:col-span-2 xl:col-span-1`).

## Typography

- All headings, labels, buttons, menu items and badges use **sentence case**: "Check in", "Issue exit permit", "Camp roster & status monitor".
- `CardTitle` gets `className="text-base"` (the nova default, kept explicit so a style change can't silently enlarge titles).
- `CardDescription`: default (`text-sm text-muted-foreground`). One sentence that says what the card does.
- Dialog title: `text-base font-semibold leading-none tracking-tight`. Exception: destructive or irreversible confirmations use `text-lg` with an icon (see Dialogs).
- Body text `text-sm`. Secondary text `text-muted-foreground`. Small meta and legends `text-xs text-muted-foreground`.
- Emphasis inside muted text: `<strong className="text-foreground">`.
- Numbers in stats: `tabular-nums`. Stat value `text-base font-semibold`; chart center value `text-xl`.
- Page title in `SiteHeader`: `text-base font-semibold`.
- Exception: auth pages (`app/login`) keep the shadcn login block heading, `text-2xl font-bold`. They have no `SiteHeader` or sidebar.

## Cards

- Cards have no shadow in nova; the edge is a ring. Existing `shadow-none` classes are harmless and can stay.
- A button in a card header (Edit, export, ...) goes in `CardAction` inside `CardHeader`, never a flex row around the title.
- Action card layout: `Card className="flex flex-col shadow-none"`, with the action row in `CardContent className="mt-auto ..."` so side-by-side cards align.
- Stat tile inside a card:
  ```tsx
  <div className="rounded-lg border bg-muted/20 px-4 py-3">
    <div className="text-base font-semibold tabular-nums">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
  ```
  Stack tiles with `flex flex-col gap-2`. Scroll long stacks with `max-h-72 overflow-y-auto`.

## Badges (status)

`Badge` base comes from `ui/badge.tsx` (nova: `h-5 rounded-4xl px-2 text-xs font-medium`). Status colors come from one mapping function, never inline:

| Status | Classes |
|---|---|
| Checked in | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Registered | `border-transparent bg-status-registered text-status-registered-foreground` |
| Active link | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Scheduled | `border-transparent bg-status-scheduled text-status-scheduled-foreground` |
| Paused | `border-status-paused-foreground/30 bg-status-paused text-status-paused-foreground` |
| Checked out / Inactive / neutral | `rounded-full border-2 border-border bg-muted text-muted-foreground` |

- The mapping is `statusClass(status)` in `lib/status.ts`. Import it; never copy it into a component. A new status means a new `status-*` token pair in `globals.css` (light and dark) plus a branch there.
- When a badge's meaning depends on dates, add a one-line `text-sm text-muted-foreground` hint near it that explains it: "Opens in 12 days.", "Closes in 40 days.", "Closed on 30/11/2026.", "Campers can't sign up until you resume the link."
- In tables: `<Badge variant="outline" className={cn("whitespace-nowrap", statusClass(status))}>`.

## Toasts

- Only `toast.success("...")` and `toast.error("...")` from `sonner`. **Never pass `className` or styles.** Green success and red error styling are defined once in `ui/sonner.tsx`.
- Wording:
  - Success: "<Subject> successfully <past tense>", e.g. "Camper details successfully updated", "Camper successfully checked in".
  - Error: "Failed to <action>. Something went wrong on our end. Please try again."
- Actions that need undo and take effect immediately (check-in, pause or resume a registration link) use the dashboard's confirmation overlay instead of a toast. A centered card with `bg-black/20 backdrop-blur-sm` backdrop, a title, a muted description and an `h-1.5` `bg-emerald-500` progress bar that empties over 5 seconds. Buttons: **Undo** (outline) and **Done** (primary). Done fires the success toast.

## Buttons

- Primary: `<Button>` (default variant). Secondary or cancel: `variant="outline"`. Icon-only: `variant="ghost" size="icon"` with an `aria-label`.
- Button pairs are right-aligned, cancel first, always `gap-3`: `<div className="flex justify-end gap-3 pt-2">Cancel (outline), Confirm (default)</div>`. Full forms use `pt-4` above the row.
- Every dialog's buttons go in `DialogFooter`, never a plain `div`. It is a tinted band with a top border and its own `p-4` that runs to the dialog's edges. Never override its top padding (`pt-0`, `sm:pt-0`), or the buttons touch the border.
  - Confirmation dialog: `<DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">`, with equal-width Cancel and Confirm.
  - List or selection dialog (`p-4`): `<DialogFooter className="mt-4 flex-row justify-end gap-3">`.
  - Form dialog (`p-6`): `<DialogFooter className="-mx-6 -mb-6 mt-2 flex-row justify-end gap-3 px-6 py-4">`, so the band still reaches the edges.
- Two-option choices (gender, yes/no) are two `Button`s in `flex gap-3`: the selected one is `variant="default"`, the other `variant="outline"`.
- Disable the confirm button until it is valid (`disabled={selected.size === 0}`).

## Dialogs

- Import from `@/ui/dialog`. Always pass `showCloseButton={false}` and render the close button inside the header:
  ```tsx
  <DialogHeader className="relative space-y-1 text-left">
    <DialogTitle className="text-base font-semibold leading-none tracking-tight">Title</DialogTitle>
    <DialogDescription className="text-sm text-muted-foreground">One sentence.</DialogDescription>
    <Button type="button" variant="ghost" size="icon" aria-label="Close <dialog name>" className="absolute right-0 top-0" onClick={close}><X className="size-4" /></Button>
  </DialogHeader>
  ```
- Width by purpose: confirmation `sm:max-w-lg`, list or selection `sm:max-w-xl` with `gap-0 p-4`, form `sm:max-w-4xl` with `gap-4 p-6`.
- Destructive or irreversible confirmation: the title includes `<AlertCircle className="text-destructive" />` and uses `text-lg`. The description names the subject in `<strong className="text-foreground">` and states the result ("This will transition their status to **Checked out**").

## Forms

- Field: label wraps the control.
  ```tsx
  <label className="flex flex-col gap-2 text-sm font-medium">First name<Input className="bg-muted/40" /></label>
  ```
- Field grid: `grid gap-4 sm:grid-cols-3`. Form sections: `<section className="pt-6"><h3 className="mb-3 text-base font-semibold">…</h3>`.
- Search input: relative wrapper, `<IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`, `Input className="border bg-muted/50 pl-8"`. In-input icons are always `size-4` and vertically centered; the 24px tabler default overflows the 32px input. Placeholder style: "Search by name, phone, M-Pesa code". Filter searches update live as you type. Lookup searches that open a result dialog also run on Enter.
- Expandable option card: `rounded-2xl border bg-muted/30 p-4 text-sm` with `focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20`. Reveal its details with the `grid-rows-[0fr]` → `grid-rows-[1fr]` + opacity transition (`duration-300 ease-out`), helper text indented `pl-6 text-muted-foreground`.
- Filter selects sit next to the search with a fixed width (`SelectTrigger className="w-32"` / `w-36`). The first option is "All …".
- Date field: `Popover` + `Calendar` from `@/ui`. The trigger is `<Button variant="outline" className="w-full min-w-0 justify-between bg-muted/40 px-2.5 font-normal tabular-nums">` with the date in `<span className="min-w-0 truncate">` and `IconCalendar` in `text-muted-foreground` on the right. `PopoverContent className="w-auto overflow-hidden p-0" align="start"` (without `overflow-hidden` the calendar corners stick out). Format `dd/MM/yyyy`. Paired dates block impossible ranges with `disabled={{ before: start }}`.
- Money field: an absolute `KES` prefix (`left-2.5`, `text-muted-foreground`) inside a relative wrapper, `Input className="bg-muted/40 pl-11 tabular-nums" inputMode="numeric"`. Read-only values show as "KES 1,000".
- Number fields format with thousands commas as you type (`toLocaleString("en-US")`).
- Inline field error: `<p className="text-sm text-destructive">` under the field, saying what is wrong and the limit ("The limit can't be below the 320 spots already used."). Errors block saving; warnings (allowed but risky) appear as text too and again in the review dialog.

## Settings screens (editable cards)

- Cards that change saved settings are **read-only until Edit**: `CardTitle` and `CardDescription` in `CardHeader`, plus `<CardAction><Button variant="outline">Edit</Button></CardAction>`. Hide Edit for roles that may not change settings.
- Read-only values use the same label and height as inputs so the layout doesn't move when editing: `<div className="flex h-8 min-w-0 items-center rounded-lg border bg-muted/20 px-2.5 text-sm font-normal tabular-nums">`. Use a `div` wrapper, not a `label`, in read-only mode.
- In edit mode the card footer shows the note on the left and **Cancel** (outline, discards the draft) and **Save …** (default) on the right. Save is disabled until something changed and every field is valid.
- Save opens a **review dialog** (confirmation width `sm:max-w-lg`): title "Review <card> changes", description "Check these changes before you save them.", then one stat-tile row per *changed* field only, `{old} → <strong className="text-foreground">{new}</strong>`. Consequences follow as `text-sm text-muted-foreground` lines with `AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive"` (for example: new fees only apply to new registrations). Footer buttons: Cancel and **Save changes**. Confirming fires "<Card> successfully saved" and returns the card to read-only.
- Card footer meta: the note (`text-sm text-muted-foreground`) and below it `text-xs text-muted-foreground` "Last saved by <name>, 18 Oct 2026, 14:02".
- A setting shared by several cards gets its own card ("Shared settings") rather than living inside one of them.
- Unsaved edits are guarded: internal link clicks open a destructive confirmation ("Leave without saving?", `text-lg` title with `AlertCircle`, buttons **Stay on page** and **Leave page**) naming the unsaved cards in `<strong className="text-foreground">`, and `beforeunload` covers reloads and closing the tab.

## Tables

- Wrapper: `<div className="overflow-x-auto rounded-lg border">`. `TableHeader className="bg-muted/50"`. Rows: `className="hover:bg-muted/50"`.
- Every `TableHead` and `TableCell` has `whitespace-nowrap`.
- Two-line cells: first line `font-medium` (or plain), second line `text-muted-foreground`, e.g. name + "Age: 24 - Female", contact + phone.
- Empty values show `-`.
- Last column "More" (`w-10`): a row actions `DropdownMenu`. Trigger `buttonVariants({ variant: "ghost", size: "icon" })` with `IconDotsVertical` and `aria-label="More actions"`. Content `align="end" sideOffset={6} className="min-w-44"`. Destructive item last, after a `DropdownMenuSeparator`, styled `text-destructive focus:text-destructive`.
- Toolbar above the table: `flex flex-col gap-2 md:flex-row md:items-center md:justify-between`, with search `relative max-w-md flex-1` on the left and filters on the right.

## Tabs

`<Tabs className="w-fit"><TabsList className="grid w-full max-w-md grid-cols-N">`, each `TabsTrigger className="w-full"`.

## Charts

- Donut (recharts): `innerRadius="52%" outerRadius="78%" strokeWidth={0}` in a `relative mx-auto h-56 w-full max-w-xs` box. Center: `<strong className="text-xl">` value + `text-xs text-muted-foreground` label.
- Legend: `flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground`, dots `size-2.5 rounded-full`.
- Series palette, in order: `#336699`, `#55C4AE`, `#FFD400` (`COLORS` in the dashboard). Reuse it; don't invent new series colors.

## Icons

- `lucide-react` for dialog icons (`X` close, `AlertCircle` warnings). `@tabler/icons-react` for in-page icons (`IconSearch`, `IconDotsVertical`, `IconChevronDown`).
- Same purpose, same icon. Icon size inside buttons comes from the button (`size-4`).

## Before finishing a screen

1. Compare it side by side with the dashboard at desktop (1440px), narrow desktop with the sidebar open (about 1000px) and mobile width.
2. Toggle dark mode with the header switch and check every badge, toast and tinted surface.
3. Check the route's `loading.tsx` skeleton matches the finished page.
4. Run `pnpm build` (`npx -y pnpm@10 build`) and fix anything it reports. That is what Vercel runs.
5. Search the new code for hex values, `className` passed to `toast`, `CardTitle` without `text-base`, and any title-case labels. Fix what you find.
