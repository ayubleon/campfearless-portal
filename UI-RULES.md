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
  - Re-apply local changes the overwrite removed: the success/error toast styles in `ui/sonner.tsx`, `position = "popper"`, `align = "start"` defaults in `SelectContent` (`ui/select.tsx`), and `has-data-[slot=card-action]:gap-x-6` on `CardHeader` (`ui/card.tsx`).
- `TooltipProvider` wraps the app in `app/layout.tsx`. The sidebar's tooltips crash without it.
- If a component comes from another style or registry, restyle it to match before using it: `h-8` controls, `rounded-lg`, `text-sm`, same focus ring as `ui/button.tsx`.

## Colors

- Only use theme tokens (`bg-primary`, `text-muted-foreground`, `border`, `bg-muted/50`, ...). **No hex values or Tailwind palette colors in components.** The exceptions are the toast styles in `ui/sonner.tsx` and the chart palette below.
- Custom tokens live in `app/globals.css`. Defined in `:root`, with dark values in `.dark`, and registered in `@theme inline` as `--color-*`.
  - `brand` / `brand-hover` / `brand-foreground`: `#336699`. Used **only** for the per-row primary action in tables ("Check in" on the roster, "Verify" on Payments): `className="bg-brand text-brand-foreground hover:bg-brand-hover"`. Every other primary action uses the default near-black `Button`.
  - `nav-active` / `nav-active-foreground`: the active sidebar item (near-black in light, black in dark). Not for anything else.
  - `status-*` pairs: badge backgrounds and text (see Badges).
  - `status-flagged` pair: red badges for things that need follow-up ("Flagged", "Short 100", "Over 100"). Matched and Verified use the green `status-checked-in` pair.
  - `attention`: orange text for money due and payment details on the registration screen (`text-attention`). Not for badges or buttons.
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
- Dates with a time always use `formatDateTime` from `@/lib/format`: "20/10/26, 09:20 AM". Date-only fields use `dd/MM/yyyy`. Never `toLocaleString`, which shows month first on some machines.
- Numbers in stats: `tabular-nums`. Stat value `text-base font-semibold`; chart center value `text-xl`.
- Page title in `SiteHeader`: `text-base font-semibold`.
- Exception: auth pages (`app/login`) keep the shadcn login block heading, `text-2xl font-bold`. They have no `SiteHeader` or sidebar.

## Cards

- Cards have no shadow in nova; the edge is a ring. Existing `shadow-none` classes are harmless and can stay.
- A button in a card header (Edit, export, ...) goes in `CardAction` inside `CardHeader`, never a flex row around the title. `CardHeader` keeps 24px (`gap-x-6`) between the title/description and the action, so long descriptions never run up against the button. Any other text-beside-button row uses at least `gap-6` too.
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
| Checked in / Can sign in / Waived | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Registered | `border-transparent bg-status-registered text-status-registered-foreground` |
| Active link | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Scheduled / Invite pending | `border-transparent bg-status-scheduled text-status-scheduled-foreground` |
| Paused | `border-transparent bg-status-paused text-status-paused-foreground` |
| Checked out / Inactive / No access / Locked / Sensitive / Reversed / neutral | `rounded-full border-2 border-border bg-muted text-muted-foreground` |

- The mapping is `statusClass(status)` in `lib/status.ts`. Import it; never copy it into a component. A new status means a new `status-*` token pair in `globals.css` (light and dark) plus a branch there.
- When a badge's meaning depends on dates, add a one-line `text-sm text-muted-foreground` hint near it that explains it: "Opens in 12 days.", "Closes in 40 days.", "Closed on 30/11/2026.", "Campers can't sign up until you resume the link."
- In tables: `<Badge variant="outline" className={cn("whitespace-nowrap", statusClass(status))}>`.

## Toasts

- Only `toast.success("...")` and `toast.error("...")` from `sonner`. **Never pass `className` or styles.** Green success and red error styling are defined once in `ui/sonner.tsx`.
- Wording:
  - Success: "<Subject> successfully <past tense>", e.g. "Camper details successfully updated", "Camper successfully checked in".
  - Error: "Failed to <action>. Something went wrong on our end. Please try again."
- Actions that need undo and take effect immediately (check-in, pause or resume a registration link, register and check in) use `UndoOverlay` from `components/undo-overlay.tsx`, never a hand-built overlay. It is a standard dialog (same backdrop and animation as every other dialog) with a title, a muted description, an `h-1.5` `bg-emerald-500` progress bar that empties over 5 seconds, and **Undo** (outline) and **Done** (primary) in the confirmation footer. Done, the close button, Escape, a click outside and the timer all count as Done; the caller fires the success toast in `onDone`. Only Undo reverses the action.

## Buttons

- Primary: `<Button>` (default variant). Secondary or cancel: `variant="outline"`. Icon-only: `variant="ghost" size="icon"` with an `aria-label`.
- Button pairs are right-aligned, cancel first, always `gap-3`: `<div className="flex justify-end gap-3 pt-2">Cancel (outline), Confirm (default)</div>`. Full forms use `pt-4` above the row.
- Every dialog's buttons go in `DialogFooter`, never a plain `div`. It is a tinted band with a top border and its own `p-4` that runs to the dialog's edges. Never override its top padding (`pt-0`, `sm:pt-0`), or the buttons touch the border.
  - Confirmation dialog: `<DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">`, with equal-width Cancel and Confirm.
  - List or selection dialog (`p-4`): `<DialogFooter className="mt-4 flex-row justify-end gap-3">`.
  - Form dialog (`p-4 sm:p-6`): `<DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">`, so the band still reaches the edges.
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
- Width by purpose: confirmation `sm:max-w-lg`, list or selection `sm:max-w-xl` with `gap-0 p-4`, form `sm:max-w-4xl` with `gap-4 p-4 sm:p-6`.
- Any dialog that can be taller than a phone screen (forms, long lists) must fit the viewport: `DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] …"`, then after the header one `flex min-h-0 flex-col` wrapper holding a scroll area (`-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6`) and the `DialogFooter`. Header and footer stay visible; only the body scrolls. See the edit camper dialog in the dashboard.
- Destructive or irreversible confirmation: the title includes `<AlertCircle className="text-destructive" />` and uses `text-lg`. The description names the subject in `<strong className="text-foreground">` and states the result ("This will transition their status to **Checked out**").

## Forms

- Field: label wraps the control.
  ```tsx
  <label className="flex flex-col gap-2 text-sm font-medium">First name<Input className="bg-muted/40" /></label>
  ```
- Field grid: `grid gap-4 sm:grid-cols-3`. Form sections: `<section className="pt-6"><h3 className="mb-3 text-base font-semibold">…</h3>`.
- Search input: relative wrapper, `<IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`, `Input className="border bg-muted/50 pl-8"`. In-input icons are always `size-4` and vertically centered; the 24px tabler default overflows the 32px input. Placeholder style: "Search by name, phone, M-Pesa code". Filter searches update live as you type. Lookup searches that open a result dialog also run on Enter.
- Expandable option card: `rounded-2xl border bg-muted/30 p-4 text-sm` with `focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20`. Reveal its details with the `grid-rows-[0fr]` → `grid-rows-[1fr]` + opacity transition (`duration-300 ease-out`), helper text indented `pl-6 text-muted-foreground`.
- Native `<input type="checkbox">`, `<input type="radio">` and `<textarea>` are never used: use `Checkbox` (`@/ui/checkbox`) and `Textarea` (`@/ui/textarea`). A tick-to-reveal option card is a `Checkbox`, not a radio.
- Selects open as a dropdown below their trigger. `ui/select.tsx` defaults `SelectContent` to `position="popper"` and `align="start"`; shadcn's item-aligned list covers the trigger and breaks inside the Base UI dialog.
- Filter selects sit next to the search with a fixed width (`SelectTrigger className="w-32"` / `w-36`). The first option is "All …".
- Date field: `Popover` + `Calendar` from `@/ui`. The trigger is `<Button variant="outline" className="w-full min-w-0 justify-between bg-muted/40 px-2.5 font-normal tabular-nums">` with the date in `<span className="min-w-0 truncate">` and `IconCalendar` in `text-muted-foreground` on the right. `PopoverContent className="w-auto overflow-hidden p-0" align="start"` (without `overflow-hidden` the calendar corners stick out). Format `dd/MM/yyyy`. Paired dates block impossible ranges with `disabled={{ before: start }}`.
- Money field: an absolute `KES` prefix (`left-2.5`, `text-muted-foreground`) inside a relative wrapper, `Input className="bg-muted/40 pl-11 tabular-nums" inputMode="numeric"`. Read-only values show as "KES 1,000".
- Number fields format with thousands commas as you type (`toLocaleString("en-US")`).
- Inline field error: `<p className="text-sm text-destructive">` under the field, saying what is wrong and the limit ("The limit can't be below the 320 spots already used."). Errors block saving; warnings (allowed but risky) appear as text too and again in the review dialog.

## Item cards (a header plus a list of chips)

- Used for networks and their campuses. `<section className="flex min-w-0 flex-col overflow-hidden rounded-xl border">` with the header in `flex items-start justify-between gap-3 p-4` (title `text-base font-semibold leading-none`, count `text-sm text-muted-foreground`, row `MoreMenu` on the right) and the chips in a tinted tray: `flex flex-1 flex-wrap content-start gap-2 border-t bg-muted/40 p-4`. Chips are `rounded-md border bg-muted/50 px-2.5 py-1 text-sm`. No separator inset inside the padding.

## Settings screens (editable cards)

- Cards that change saved settings are **read-only until Edit**: `CardTitle` and `CardDescription` in `CardHeader`, plus `<CardAction><Button variant="outline">Edit</Button></CardAction>`. Hide Edit for roles that may not change settings.
- Read-only values use the same label and height as inputs so the layout doesn't move when editing: `<div className="flex h-8 min-w-0 items-center rounded-lg border bg-muted/20 px-2.5 text-sm font-normal tabular-nums">`. Use a `div` wrapper, not a `label`, in read-only mode.
- In edit mode the card footer shows the note on the left and **Cancel** (outline, discards the draft) and **Save …** (default) on the right. Save is disabled until something changed and every field is valid.
- Save opens a **review dialog** (confirmation width `sm:max-w-lg`): title "Review <card> changes", description "Check these changes before you save them.", then one stat-tile row per *changed* field only, `{old} → <strong className="text-foreground">{new}</strong>`. Consequences follow as `text-sm text-muted-foreground` lines with `AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive"` (for example: new fees only apply to new registrations). Footer buttons: Cancel and **Save changes**. Confirming fires "<Card> successfully saved" and returns the card to read-only.
- Card footer meta: only `text-xs text-muted-foreground` "Last saved by <name>, 18 Oct 2026, 14:02". Don't add standing notes that restate the card title or a consequence the review dialog already shows; put consequences in the review dialog, where they appear only when they apply.
- Explanations that would repeat in several cards (how a number is counted, what a rule means) go behind an info button at the end of the line they explain, not as repeated text: `<Button variant="ghost" size="icon-xs" aria-label="…" className="text-muted-foreground"><IconInfoCircle /></Button>` opening a `Popover` with `PopoverContent className="w-64 text-sm" align="start" collisionPadding={16}`. Use a popover, not a tooltip, so it opens on tap.
- A setting shared by several cards gets its own card ("Shared settings") rather than living inside one of them.
- Unsaved edits are guarded (use `LeaveGuard` from `components/leave-guard.tsx`; Camp setup, Account and Registration all do): internal link clicks open a destructive confirmation ("Leave without saving?", `text-lg` title with `AlertCircle`, buttons **Stay on page** and **Leave page**) naming the unsaved cards in `<strong className="text-foreground">`, and `beforeunload` covers reloads and closing the tab.

## Tables

- Wrapper: `<div className="overflow-x-auto rounded-lg border">`. `TableHeader className="bg-muted/50"`. Rows: `className="hover:bg-muted/50"`.
- Every `TableHead` and `TableCell` has `whitespace-nowrap`.
- Two-line cells: first line `font-medium` (or plain), second line `text-muted-foreground`, e.g. name + "Age: 24 - Female", contact + phone.
- Empty values show `-`.
- A switch that revokes access (deactivate a user) opens a confirmation first. Turning something back on is instant, with a toast.
- Destructive menu items always keep their normal label ("Delete network", "Remove user") and stay clickable. When the action isn't allowed yet, clicking opens the destructive dialog explaining why ("Can't delete Catalyst yet", "It still has 7 campuses…") with a button that helps fix it ("Show its campuses") or "Got it". Never put the reason in the menu label or grey the item out.
- Last column (`w-10`) has no visible title, only `<span className="sr-only">More actions</span>` in its `TableHead`. It holds a row actions `DropdownMenu`. Trigger `buttonVariants({ variant: "ghost", size: "icon" })` with `IconDotsVertical` and `aria-label="More actions"`. Content `align="end" sideOffset={6} className="min-w-44"`. Destructive item last, after a `DropdownMenuSeparator`, styled `text-destructive focus:text-destructive`.
- Setup screens (campuses, roles, camp setup) don't show camper counts or other reporting numbers in their tables. Those depend on which camp and dates you mean, so they belong in Reports with filters. A count may appear in a destructive confirmation when it explains the risk ("53 campers have registered at Madaraka across all camps").
- Long lists that belong to groups (campuses by network, permissions by area) show group header rows: `<TableRow className="bg-muted/30 hover:bg-muted/30">` with one `TableCell colSpan` in `py-2 text-xs font-medium text-muted-foreground`, e.g. "Catalyst · 7 campuses". Rows stay A–Z inside each group.
- Don't put an editable select in every row for a change that affects reports (moving a campus to another network). Show the value as text or as the group, and offer "Move to network…" in the row menu, opening a small dialog with the select ("(current)" marked) and a disabled confirm until the value changes.
- Toolbar above the table: `flex flex-col gap-2 md:flex-row md:items-center md:justify-between`, with search `relative max-w-md flex-1` on the left and filters on the right.

## Tabs

Choosing the camp is always a tab pair (`Tabs` with `camps.MYF.label` and `camps.MYA.label`), never two buttons, including inside dialogs. Wherever MYF and MYA are both offered (tabs, filters, selects, choice buttons, lists, copy), MYF comes first, then MYA. "All camps" or "Both", when present, comes before them.


`<Tabs className="w-fit"><TabsList className="grid w-full max-w-md grid-cols-N">`, each `TabsTrigger className="w-full"`.

Actions inside a tab (Invite user, Add role) go in the `CardAction` of the card they act on, never next to the tabs.

## Charts

- Donut (recharts): `innerRadius="52%" outerRadius="78%" strokeWidth={0}` in a `relative mx-auto h-56 w-full max-w-xs` box. Center: `<strong className="text-xl">` value + `text-xs text-muted-foreground` label.
- Legend: `flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground`, dots `size-2.5 rounded-full`.
- Series palette, in order: `#336699`, `#55C4AE`, `#FFD400` (`COLORS` in the dashboard). Reuse it; don't invent new series colors.

## Icons

- `lucide-react` for dialog icons (`X` close, `AlertCircle` warnings). `@tabler/icons-react` for in-page icons (`IconSearch`, `IconDotsVertical`, `IconChevronDown`).
- Same purpose, same icon. Icon size inside buttons comes from the button (`size-4`).

## Reports

- Reports has a **Campers** / **Facilitators** tab pair. Each view has its own filters, report templates and columns, an editable report title built from the filters, and Print report. Both reuse `TitleCard` in `components/reports.tsx`.
- Facilitator teams are the roles that can't sign in (Users and roles). The Team filter lists them.
- **Print report** opens a print preview dialog (`PrintPreview` in `components/reports.tsx`): title, Camp, Filters (the filters actually applied, or "None, all records"), Records, Generated by, Date, the table and a confidentiality footer. Footer buttons: **Close**, **Export** (CSV) and **Print**. Print opens the device print dialog and prints the same `PrintDocument`, so the preview and the paper always match.
- On the page, everything except `PrintDocument` is `print:hidden`; `PrintDocument` is shown with `hidden print:block`. Dialogs, toasts, the sidebar and the header never print.

## Payments

- M-Pesa messages are verified by hand. **Amount on SMS** is typed in (digits only, thousands commas added). **Check** shows "Enter amount" until something is typed, then a green **Matched** when the amount equals the expected total for everyone on that code, or a red **Short N** / **Over N**.
- Each open row has one action: **Verify** (brand button) when Matched, otherwise **Flag**. Verified and Flagged rows show **Reopen** instead, which returns the row to open; the amount is locked while a row is Verified or Flagged.
- Flagged payments are found in Reports (Payment filter "Flagged", template "Flagged payments") and printed from there.

## Account

- Reached from the user menu at the bottom of the sidebar (Account), not a sidebar item. The menu has only Account and Log out; there is no notifications entry.
- Profile card follows the settings-screen pattern: read-only until Edit, review dialog on Save. Only name and phone are editable; email and role are set by a Super admin in Users and roles.
- Password card opens a form dialog (current, new, confirm). Save stays disabled until the new password is at least 8 characters, differs from the current one and matches the confirmation.
- Login's "Forgot password?" opens a small dialog (email, **Send reset link**) with the toast "Password reset link successfully sent". It is a button, never `href="#"`.
- Audit log: "Profile updated" and "Password changed" (area Users).

## Audit log

- Every action a screen adds that changes data, or opens sensitive records (print, export, medical details), needs an audit log entry. Add its sample row to `components/audit-log.tsx`.
- Action: a short past-tense label from a fixed list, in sentence case ("Permission granted", "Camp setup saved"), grouped under one area (Users, Roles, Camp setup, Campuses and networks, Campers, Waivers and payments, Sensitive access, Sign-in). Shown as `<Badge variant="outline">`.
- Detail: the subject first in `font-medium` (camper, user, role or setup), then ` · ` and the change in `text-muted-foreground`. One change reads "Label old → new". Several changes read "N changes", a button that opens the read-only details dialog listing each old → new.
- Removed users keep their name with "(removed)". Entries never get edit, delete or row menus.
- A screen with a "Last saved by …" line links it to the audit log, pre-filtered with `?camp=`, `?area=` or `?q=`.

## Before finishing a screen

1. Compare it side by side with the dashboard at desktop (1440px), narrow desktop with the sidebar open (about 1000px) and mobile width.
2. Toggle dark mode with the header switch and check every badge, toast and tinted surface.
3. Check the route's `loading.tsx` skeleton matches the finished page.
4. Run `pnpm build` (`npx -y pnpm@10 build`) and fix anything it reports. That is what Vercel runs.
5. Search the new code for hex values, `className` passed to `toast`, `CardTitle` without `text-base`, and any title-case labels. Fix what you find.
