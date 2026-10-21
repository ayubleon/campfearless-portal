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

- Only use theme tokens (`bg-primary`, `text-muted-foreground`, `border`, `bg-muted/50`, ...). **No hex values or Tailwind palette colors in components.** The exceptions are the toast styles in `ui/sonner.tsx`, the chart palette below, and the fixed light colours in `components/summary-image.tsx` (the saved image must look the same in light and dark).
- Custom tokens live in `app/globals.css`. Defined in `:root`, with dark values in `.dark`, and registered in `@theme inline` as `--color-*`.
  - `brand` / `brand-hover` / `brand-foreground`: `#336699`. Used **only** for the per-row primary action in tables ("Check in" on the roster, "Verify" on Payments): `className="bg-brand text-brand-foreground hover:bg-brand-hover"`. Every other primary action uses the default near-black `Button`.
  - `nav-active` / `nav-active-foreground`: the active sidebar item (near-black in light, black in dark). Not for anything else.
  - `link`: the colour of a text link that must stand out from the surrounding text (blue, underlined, with a lighter blue in dark mode). Use `text-link underline decoration-link/30 underline-offset-4 hover:decoration-link`. Used for the welcome page address in Camp setup.
  - `status-*` pairs: badge backgrounds and text (see Badges).
  - `status-flagged` pair: red badges for things that need follow-up ("Flagged", "Short 100", "Over 100"). Matched and Verified use the green `status-checked-in` pair.
  - `camp-accent` / `camp-accent-hover` / `camp-accent-foreground`: the orange MYF Register button in the welcome page preview. Used only inside a `force-light` box. It is the Mavuno and Camp Fearless brand orange `#f05a22`, with white text, as the brand asks (white on that orange is 3.4:1, below 4.5:1, so keep the text large and bold). The summary image uses the same orange for its logo and title, which are large enough for 3:1.
  - `attention`: orange text for money due and payment details on the registration screen (`text-attention`). Not for badges or buttons.
- Destructive meaning uses `text-destructive`: menu items, alert icons, inline field errors. Not red palette classes.
- Progress bars (undo overlay, usage bars) use `bg-emerald-500` on a `bg-muted` track, `h-1.5`. This is the only palette class allowed outside the exceptions above.
- Every screen must look right in light **and** dark. Test dark with the header switch, not only with system dark mode. A token without a `.dark` value is a bug.
- New color need: add a token pair to `:root` and `.dark`, register it in `@theme inline`, then use the utility.

## Layout and spacing

- Page shell: `SidebarProvider` + `AppSidebar variant="inset"` + `SidebarInset` + `SiteHeader title="…"`, as in `app/dashboard/page.tsx` and `app/camp-setup/page.tsx`. The header title is the page name in sentence case.
- On touch screens (phones and tablets) a swipe right that starts within 48px of the left edge and travels at least 60px opens the sidebar: the slide-over panel on phones, the docked sidebar when collapsed on tablets. It lives in `SidebarProvider` (`ui/sidebar.tsx`), ignores mostly vertical swipes and does nothing while a dialog is open. Don't add a second swipe handler on a page.
- Each new route gets a `url` on its item in `components/app-sidebar.tsx`. The active item comes from the current path, never a hardcoded `active` flag.
- Each route has a `loading.tsx` that renders the same shell with a skeleton of that page (`components/dashboard-skeleton.tsx`, `components/camp-setup-skeleton.tsx`). Build the skeleton from `Skeleton` in `@/ui/skeleton`, mirroring the real cards, columns and field heights (`h-8` for controls) so nothing jumps when content arrives.
- Page content: `<main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">`.
- Gaps between sections and between cards: `gap-4`. Responsive grids: `grid gap-4 md:grid-cols-2` / `lg:grid-cols-2`. Add `min-w-0` to grid children that hold charts or tables.
- Inside cards: `gap-4` between blocks, `gap-2` between stacked list items, `gap-3` between any buttons placed side by side and between an input and its button.
- Card padding comes from `ui/card.tsx` (`--card-spacing`, 16px). Don't override it.
- Multi-column settings cards: `grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3`, each column a `<section className="flex min-w-0 flex-col gap-4">` headed by `<h3 className="text-sm text-muted-foreground">`. Three columns only from `xl`: with the sidebar open, `lg` columns are too narrow for date fields. A column that would sit alone at `md` spans both (`md:col-span-2 xl:col-span-1`).

## Typography

- All headings, labels, buttons, menu items and badges use **sentence case**: "Check in", "Issue exit permit", "Camp roster & status monitor".
- `CardTitle` gets `className="text-base"` (kept explicit so a style change can't silently change titles). Its weight is `font-bold`, set once in `ui/card.tsx`, so every card title, section heading (`<h3 className="text-base font-bold">`) and page title in the header is **16px and bold**, on the portal and on the public registration pages alike; never override it per card.
- `CardDescription`: default (`text-sm text-muted-foreground`). One short sentence that says what the card does, about 100 characters at most and never more than one line on a desktop. How a rule works (what Matched means, who can see the page) goes behind an info button or in the review dialog, not in the description.
- Dialog title: `text-base font-bold leading-none tracking-tight` (16px bold, like every other title). Destructive or irreversible confirmations use the same size with the warning icon (see Dialogs).
- Body text `text-sm`. Secondary text `text-muted-foreground`. Small meta and legends `text-xs text-muted-foreground`.
- Emphasis inside muted text: `<strong className="text-foreground">`.
- Dates with a time always use `formatDateTime` from `@/lib/format`: "20/10/26, 09:20 AM". Date-only fields use `dd/MM/yyyy`. Never `toLocaleString`, which shows month first on some machines.
- Numbers in stats: `tabular-nums`. Stat value `text-base font-semibold`; chart center value `text-xl`.
- Page title in `SiteHeader`: `text-base font-bold`.
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
| Checked in / Can sign in / Waived / Walk-in | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Registered | `border-transparent bg-status-registered text-status-registered-foreground` |
| Active link | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Scheduled / Invite pending / In advance | `border-transparent bg-status-scheduled text-status-scheduled-foreground` |
| Paused | `border-transparent bg-status-paused text-status-paused-foreground` |
| Checked out / Inactive / No access / Locked / Sensitive / neutral | `rounded-full border-2 border-border bg-muted text-muted-foreground` |

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

- Dialog and sheet backdrops are `bg-black/20` with `backdrop-blur-sm`, set once in `ui/dialog.tsx` and `ui/sheet.tsx`. Never restyle them per dialog.
- Import from `@/ui/dialog`. Always pass `showCloseButton={false}` and render the close button inside the header:
  ```tsx
  <DialogHeader className="relative space-y-1 text-left">
    <DialogTitle className="text-base font-bold leading-none tracking-tight">Title</DialogTitle>
    <DialogDescription className="text-sm text-muted-foreground">One sentence.</DialogDescription>
    <Button type="button" variant="ghost" size="icon" aria-label="Close <dialog name>" className="absolute right-0 top-0" onClick={close}><X className="size-4" /></Button>
  </DialogHeader>
  ```
- Width by purpose: confirmation `sm:max-w-lg`, list or selection `sm:max-w-xl` with `gap-0 p-4`, form `sm:max-w-4xl` with `gap-4 p-4 sm:p-6`.
- Any dialog that can be taller than a phone screen (forms, long lists) must fit the viewport: `DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] …"`, then after the header one `flex min-h-0 flex-col` wrapper holding a scroll area (`-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6`) and the `DialogFooter`. Header and footer stay visible; only the body scrolls. See the edit camper dialog in the dashboard.
- Destructive or irreversible confirmation: the title includes `<AlertCircle className="text-destructive" />` and stays 16px bold like every dialog title. The description names the subject in `<strong className="text-foreground">` and states the result ("This will transition their status to **Checked out**").

## Forms

- Field: label wraps the control. Use `Field` from `components/field.tsx` for a label plus control.
- Text links that act like buttons use `Button variant="link"`, never a raw `<button>`.
  ```tsx
  <label className="flex flex-col gap-2 text-sm font-medium">First name<Input className="bg-muted/40" /></label>
  ```
- Field grid: `grid gap-4 sm:grid-cols-3`. Form sections: `<section className="pt-6"><h3 className="mb-3 text-base font-bold">…</h3>`.
- Search input: relative wrapper, `<IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`, `Input className="border bg-muted/50 pl-8"`. In-input icons are always `size-4` and vertically centered; the 24px tabler default overflows the 32px input. Placeholder style: "Search by name, phone, M-Pesa code". Filter searches update live as you type. Lookup searches that open a result dialog also run on Enter.
- Expandable option card: `rounded-2xl border bg-muted/30 p-4 text-sm` with `focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20`. Reveal its details with the `grid-rows-[0fr]` → `grid-rows-[1fr]` + opacity transition (`duration-300 ease-out`), helper text indented `pl-6 text-muted-foreground`.
- Native `<input type="checkbox">`, `<input type="radio">` and `<textarea>` are never used: use `Checkbox` (`@/ui/checkbox`) and `Textarea` (`@/ui/textarea`). A tick-to-reveal option card is a `Checkbox`, not a radio.
- Selects open as a dropdown below their trigger. `ui/select.tsx` defaults `SelectContent` to `position="popper"` and `align="start"`; shadcn's item-aligned list covers the trigger and breaks inside the Base UI dialog.
- **Filter order: broadest first.** Order filters by how much of the result they decide, most to least: **Edition**, then **Camp**, then **Campus** (or Team), then the report's own focus (Age, Status, Payment, Registration, Arrival, When, Action), and **Gender** last. The search sits before all of them. Reports: Edition, Camp, Campus, Status, Payment, Registration, Gender (campers); Edition, Camp, Team, Campus, Status, Payment, Gender (facilitators); Edition, Camp, Age, Campus, Gender (Age and gender). Audit log: Edition, Camp, When, Action. Payments and Waivers: Camp, Campus, then Status or Arrival. A new filter goes where its reach puts it, not at the end.
- The search keeps its full width: with three or more filters the toolbar stays stacked (search on its own line, filters below) and only goes to one row from `lg` (Payments, Waivers) or `xl` (Audit log, which has four filters and a date range). A search input must never shrink to an icon.
- Filter selects sit next to the search with a fixed width (`SelectTrigger className="w-32"` / `w-36`). The first option is "All …".
- Date field: `Popover` + `Calendar` from `@/ui`. The trigger is `<Button variant="outline" className="w-full min-w-0 justify-between bg-muted/40 px-2.5 font-normal tabular-nums">` with the date in `<span className="min-w-0 truncate">` and `IconCalendar` in `text-muted-foreground` on the right. `PopoverContent className="w-auto overflow-hidden p-0" align="start"` (without `overflow-hidden` the calendar corners stick out). Format `dd/MM/yyyy`. Paired dates block impossible ranges with `disabled={{ before: start }}`.
- Money field: an absolute `KES` prefix (`left-2.5`, `text-muted-foreground`) inside a relative wrapper, `Input className="bg-muted/40 pl-11 tabular-nums" inputMode="numeric"`. Read-only values show as "KES 1,000".
- Number fields format with thousands commas as you type (`toLocaleString("en-US")`).
- Inline field error: `<p className="text-sm text-destructive">` under the field, saying what is wrong and the limit ("The limit can't be below the 320 spots already used."). Errors block saving; warnings (allowed but risky) appear as text too and again in the review dialog.

## Item cards (a header plus a list of chips)

- Used for networks and their campuses. `<section className="flex min-w-0 flex-col overflow-hidden rounded-xl border">` with the header in `flex items-start justify-between gap-3 p-4` (title `text-base font-bold leading-none`, count `text-sm text-muted-foreground`, row `MoreMenu` on the right) and the chips in a tinted tray: `flex flex-1 flex-wrap content-start gap-2 border-t bg-muted/40 p-4`. Chips are `rounded-md border bg-muted/50 px-2.5 py-1 text-sm`. No separator inset inside the padding.

## Settings screens (editable cards)

- Cards that change saved settings are **read-only until Edit**: `CardTitle` and `CardDescription` in `CardHeader`, plus `<CardAction><Button variant="outline">Edit</Button></CardAction>`. Hide Edit for roles that may not change settings.
- Read-only values use the same label and height as inputs so the layout doesn't move when editing: `<div className="flex h-8 min-w-0 items-center rounded-lg border bg-muted/20 px-2.5 text-sm font-normal tabular-nums">`. Use a `div` wrapper, not a `label`, in read-only mode.
- In edit mode the card footer shows the note on the left and **Cancel** (outline, discards the draft) and **Save …** (default) on the right. Save is disabled until something changed and every field is valid.
- Save opens a **review dialog** (confirmation width `sm:max-w-lg`): title "Review <card> changes", description "Check these changes before you save them.", then one stat-tile row per *changed* field only, `{old} → <strong className="text-foreground">{new}</strong>`. Consequences follow as `text-sm text-muted-foreground` lines with `AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive"` (for example: new fees only apply to new registrations). Footer buttons: Cancel and **Save changes**. Confirming fires "<Card> successfully saved" and returns the card to read-only.
- Card footer meta: only `text-xs text-muted-foreground` "Last saved by <name>, 18 Oct 2026, 14:02". Don't add standing notes that restate the card title or a consequence the review dialog already shows; put consequences in the review dialog, where they appear only when they apply.
- Explanations that would repeat in several cards (how a number is counted, what a rule means) go behind an info button at the end of the line they explain, not as repeated text: `<Button variant="ghost" size="icon-xs" aria-label="…" className="text-muted-foreground"><IconInfoCircle /></Button>` opening a `Popover` with `PopoverContent className="w-64 text-sm" align="start" collisionPadding={16}`. Use a popover, not a tooltip, so it opens on tap.
- A setting shared by several cards gets its own card ("Shared settings") rather than living inside one of them.
- Unsaved edits are guarded (use `LeaveGuard` from `components/leave-guard.tsx`; Camp setup, Account and Registration all do): internal link clicks open a destructive confirmation ("Leave without saving?", 16px bold title with `AlertCircle`, buttons **Stay on page** and **Leave page**) naming the unsaved cards in `<strong className="text-foreground">`, and `beforeunload` covers reloads and closing the tab.

## Tables

- Wrapper: `<div className="overflow-x-auto rounded-lg border">`. `TableHeader className="bg-muted/50"`. Rows: `className="hover:bg-muted/50"`.
- Every `TableHead` and `TableCell` has `whitespace-nowrap`.
- **Sortable headings.** Any column someone would want in order uses `SortableHead` (`components/sortable-head.tsx`) with `useSortedRows` (`lib/sort.ts`) instead of a plain `TableHead`: a click sorts ascending, the next click descending, and a third click goes back to the table's default order (refreshing the page does too). A faint arrow shows on hover and a solid one on the active column. There is no separate reset control. Not sortable: Actions, More actions, and phone or contact-number columns.
  - Names sort by **first name** (they are stored "First Last"), ties by the rest. Dates sort by time, amounts by number.
  - Statuses sort by **group order**, not A to Z (`byRank`): roster Registered, Checked in, Checked out; Payments Awaiting verification, Flagged, Verified; payment Check Enter amount, Short, Over, Matched; Waiver Walk-in, In advance; facilitator Camp MYF, MYA, Both. "Has a note first" for medical and special needs.
  - Default order per table: Audit log and Waivers newest first; **Payments the work that needs doing first** (awaiting verification, then flagged, then verified, newest first within each); roster, Reports, Users A to Z by first name; Roles A to Z; Campuses A to Z inside each network (its Campus heading flips to Z to A inside the groups, and a second click goes back).
  - Sorting runs after search and filters. The Reports preview, printout and CSV follow the sort that is showing.
- Two-line cells: first line `font-medium` (or plain), second line `text-muted-foreground`, e.g. name + "Age: 24 - Female", contact + phone.
- Empty values show `-`.
- Payments: Verify opens a "Verify payment?" confirmation (code, campers, amount) before it takes effect.
- A switch that revokes access (deactivate a user) opens a confirmation first. Turning something back on is instant, with a toast.
- **Invited is the campus of everyone not from Mavuno.** A camper or facilitator who answers "No" to "Are you from Mavuno?" types a church or organisation; whatever they type, their campus is saved as **Invited** (`invitedCampus` in `lib/campuses.ts`) and the church is kept separately in `church`. The Campus filter (Reports, Payments, Waivers, dashboard) lists Invited last, so one click brings up every outside camper, in tables and in print. Reports has an optional **Church or organisation** column (off by default) to show what they typed. Invited is not a real campus: nobody chooses it, and it can't be renamed or deleted. A report filtered to it is titled "... from outside Mavuno".
- **A deleted campus is archived, not erased** (like a removed user). The dialog says so: "<Campus> will no longer be available for new registrations. The 53 campers already registered keep it across all camps and editions, and reports show it as <Campus> (deleted)." A campus with no registrations is erased completely. A deleted campus disappears from the places people choose one (Registration, walk-ins, waivers) but stays on every record that has it, and everywhere it is shown (Reports, Payments, Waivers, the dashboard roster, and their Campus filters) it reads "Hill City (deleted)". Use `campusLabel` from `lib/campuses.ts` to show a campus name; use `activeCampuses()` for a list to choose from. In network breakdowns a campus stays in its current network; moving a campus regroups its history under the new network.
- Destructive menu items always keep their normal label ("Delete network", "Remove user") and stay clickable. When the action isn't allowed yet, clicking opens the destructive dialog explaining why ("Can't delete Catalyst yet", "It still has 7 campuses…") with a button that helps fix it ("Show its campuses") or "Got it". Never put the reason in the menu label or grey the item out.
- Last column (`w-10`) has no visible title, only `<span className="sr-only">More actions</span>` in its `TableHead`. It holds a row actions `DropdownMenu`. Trigger `buttonVariants({ variant: "ghost", size: "icon" })` with `IconDotsVertical` and `aria-label="More actions"`. Content `align="end" sideOffset={6} className="min-w-44"`. Destructive item last, after a `DropdownMenuSeparator`, styled `text-destructive focus:text-destructive`.
- Setup screens (campuses, roles, camp setup) don't show camper counts or other reporting numbers in their tables. Those depend on which camp and dates you mean, so they belong in Reports with filters. A count may appear in a destructive confirmation when it explains the risk ("53 campers have registered at Madaraka across all camps and editions"). That count always covers every edition and is never filtered.
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
- Filters and layout are separate: the roster card holds the search, the filters and **Reset** (which clears the filters, template and columns); the **Report title** card holds what only affects the printout: the title, **Print report**, the report template and **Columns**.
- **Editions.** A camp edition is one run of the camps, **named by the administrator** ("Easter 2026", "December 2026"), so it follows any rhythm: quarterly, three a year, once a year. Never assume quarters or years in code or copy. It has a name, start and end dates, and is open or closed (`lib/editions.ts`, newest first; the backend will serve it). Every report starts with an **Edition** filter, a multi-select dropdown of checkbox items with "All editions" on top; it opens on the current edition, and the last ticked edition can't be unticked. Picking several combines them (Easter and August together). With more than one edition an **Edition** column appears after the name, in the table, the printout and the CSV. The report title and the print "Filters" line name the editions ("Easter 2026 and August 2026"). Registrations, payments, waivers and facilitators belong to an edition; campuses, networks, users and roles do not. Templates keep the chosen editions.
- **Duplicate check** (`findDuplicates` in `lib/records.ts`, `DuplicateDialog` in `components/duplicate-dialog.tsx`): before a walk-in registration or a waiver is saved, the portal looks for the same person in the open edition, as a camper or a facilitator. Same full name with the same phone, or the same name, age and campus, **blocks** it with an "Already registered" destructive dialog naming the existing record (button **Got it**). The same phone under a different name, or the same name and campus with a different age or phone, only warns: "Possible duplicate", with **Cancel** and **Register anyway**. A batch that lists the same camper twice is blocked too. An M-Pesa code already used in any edition shows "This M-Pesa code has already been used." and blocks Complete. There is no Change role action: facilitators get their registration link in a WhatsApp group of people who came to training, so nobody registers as a facilitator by mistake.
- **Camps must not overlap.** If MYF and MYA camp dates overlap, each camp card shows an inline error under the dates ("MYF and MYA overlap from 01/12/2026 to 06/12/2026. Camps should not run at the same time.") and the review dialog repeats it; saving is still allowed. Sample dates: MYF 01/12 to 06/12, MYA 08/12 to 13/12.
- **Required fields.** Every registration field (camper, facilitator, waiver) is required except the medical condition and special needs fields: phone (10 digits, 07 or 01) and, when not from Mavuno, church or organisation included. There is no "Optional" placeholder on required fields.
- **Camp setup** is one sidebar item (route `/camp-setup`, header "Camp setup") with a tab pair, like Campuses and networks and Users and roles: **Editions** first, then **Camp settings**. Editions come first because a camp can only be set up inside an edition; the page opens on Editions. The Camp settings tab stays mounted while hidden, so unsaved edits survive a look at the editions, and the Leave guard still covers them. The line "Everything below applies to <open edition>, the open edition." sits at the top of the Camp settings tab, just under the tab bar. The Editions tab has a **Year** select (All years, then each year that has an edition, newest first) that opens on the open edition's year, and a count ("3 of 9 editions"). An edition's year is that of its first camp start; one with no dates yet counts as this year.
- **Camp editions card** (first card on Camp setup, `components/camp-editions.tsx`): a table of editions (name, dates, Open or Closed badge) with **New edition** in the `CardAction` and a row menu with **Edit details** and **Close edition** (a confirmation that explains the edition becomes read-only; its records stay in Reports) or **Reopen edition** (instant, with a toast). Names must be unique and the end date can't be before the start. Audit actions: Edition created, renamed, closed, reopened (area Camp setup). An edition has no dates of its own: its dates are the earliest camp start to the latest camp end of its camps (`editionDates`), set in each camp's card.  Only one edition is open at a time: **New edition** and **Reopen edition** ask "Open X and close Y?" first when another is open. Registration, Waivers and Payments work on the open edition only; closed ones are read-only. The Audit log has an **Edition** filter (All editions, then each edition); entries about campers, waivers, payments, sensitive records and camp setup belong to an edition.
- **Registration, Waivers and Payments work on the open edition only** (`EditionScope` in `components/edition-scope.tsx` wraps each screen). A muted line at the top names it ("Edition: December 2026"). With no open edition the screen is replaced by one card, "No edition is open", with a **Go to Camp setup** button. Records of closed editions are read-only and found in Reports.
- Reports has a third tab, **Age and gender** (campers only): Camper, a plain Age column, Gender, Campus and Camp, with filters for edition, camp, age (All ages, Under 18, 18 and over), gender and campus. Default order youngest first, then A to Z by first name.
- Every report has a **Phone number** column, the camper's or facilitator's own number, beside the **Emergency contact** (name and number), so staff can reach the person or, if they can't, their contact. It is on by default, not sortable (phone columns never are), and the medical, not-yet-checked-in, waived and flagged-payments templates include it. Phone numbers are required at registration, so the column is never empty except in old records (shown as `-`). that can't sign in (Users and roles). The Team filter lists them.
- **Print report** opens a print preview dialog (`PrintPreview` in `components/reports.tsx`): title, Camp, Filters (the filters actually applied, or "None, all records"), Records, Generated by, Date, the table and a confidentiality footer. Footer buttons: **Close**, **Export** (CSV) and **Print**. Print opens the device print dialog and prints the same `PrintDocument`, so the preview and the paper always match.
- **Paper size and orientation are the user's choice** in the device print dialog; the portal never forces landscape. The printed table adapts to either: text wraps (`print:whitespace-normal`), print text is `text-xs`, the header row repeats on every page, a row never splits across pages, and the page margin is 12mm (`@page` in `app/globals.css`). When a report has more than six columns the print preview shows "Wide report. Choose Landscape in the print dialog for the best fit."
- On the page, everything except `PrintDocument` is `print:hidden`; `PrintDocument` is shown with `hidden print:block`. Dialogs, toasts, the sidebar and the header never print.

## Payments

- M-Pesa messages are verified by hand. **Amount on SMS** is typed in (digits only, thousands commas added). **Check** shows "Enter amount" until something is typed, then a green **Matched** when the amount equals the expected total for everyone on that code, or a red **Short N** / **Over N**.
- Payments covers **facilitators too**: their fee (one per edition, set in Camp setup, Shared settings) is paid by M-Pesa like a camper's. The table has a **Type** column (Camper or Facilitator) and a **Type** filter (All types, Campers, Facilitators) before Status; a facilitator who serves Both camps appears under each Camp filter. A waived facilitator has no payment. Reports' facilitator tab has the same Payment values (Verified, Awaiting verification, Flagged, Waived), an optional **M-Pesa code** column and a **Flagged payments** template.
- Each open row has one action: **Verify** (brand button) when Matched, otherwise **Flag**. Verified and Flagged rows show **Reopen** instead, which returns the row to open; the amount is locked while a row is Verified or Flagged.
- The toolbar switches to one row only from `lg`: with three filters beside the search it is too tight at `md` with the sidebar open, so the search takes its own full line first.
- Each payment belongs to the campus of whoever registered it (one campus per M-Pesa code). The table has a **Campus** column after Camp, and the filters beside the search are: All camps, All campuses (the campuses in the list, A to Z), All statuses.
- Flagged payments are found in Reports (Payment filter "Flagged", template "Flagged payments") and printed from there.

## Account

- Reached from the user menu at the bottom of the sidebar (Account), not a sidebar item. The menu has only Account and Log out; there is no notifications entry.
- Profile card follows the settings-screen pattern: read-only until Edit, review dialog on Save. Only name and phone are editable; email and role are set by a Super admin in Users and roles.
- Password card opens a form dialog (current, new, confirm). Save stays disabled until the new password is at least 8 characters, differs from the current one and matches the confirmation.
- Login's "Forgot password?" opens a small dialog (email, **Send reset link**) with the toast "Password reset link successfully sent". It is a button, never `href="#"`.
- Audit log: "Profile updated" and "Password changed" (area Users).

## Quick summary image (Dashboard)

- The Quick summary card has an icon-only outline button in its `CardAction` (tooltip and `aria-label` "View as image") that opens `SummaryImageDialog` (`components/summary-image.tsx`). The dialog draws every summary item onto a canvas and shows it as an image: always light, on the textured `public/camp-summary-background.webp` (compressed to about 46 KB, cropped to fit, under a 62% white veil so it reads near the white of the tiles; tiles slightly see-through), an orange logo and an orange **CAMP FEARLESS** title in capitals with "Quick summary" under it, the tiles three to a row (smaller numbers, labels wrap), no separator lines, and one footer line, "Created <date and time> by <name>", which is the only place the timestamp appears. A new image with a new timestamp is made each time it opens.
- **Download image** saves a JPEG (quality 0.88, about 350 KB; a PNG with the textured background would be several MB) named `camp-fearless-quick-summary-<camp>-<edition>-yyyy-MM-dd-HHmm.jpg` (for example `...-myf-december-2026-2026-12-02-0930.jpg`), shows "Summary image successfully downloaded", and is logged in the audit log as "Summary image downloaded" (area Campers).
- The dashboard tabs (All camps, MYF, MYA) scope everything under them: both donut charts, the Quick summary, the saved image (its subtitle reads "Quick summary · MYF" or "· All camps") and the roster. The numbers are worked out from the camper and facilitator records (`lib/dashboard-stats.ts` reads `lib/records.ts`), so the charts, the Quick summary, each camp's spots used and the roster always agree; the backend will serve the same counts as queries. `statsFor(scope)` adds the camps up. Only raw counts are kept: pending arrivals (registered - checked in) and present on site (checked in - departed early) are derived, and male + female must equal present (in a closed edition everyone who attended counts as present and nobody as departed early). Each camp's `spotsUsed` (Camp setup, Registration) is derived the same way. Never type a dashboard number into a component.
- **The dashboard is for the open edition only.** There is no edition switcher: `EditionScope` wraps the screen like Registration, Waivers and Payments, with the muted line "Edition: December 2026" at the top, or the "No edition is open" card. The charts, Quick summary, saved image (subtitle "Quick summary · MYF · December 2026") and roster all read the open edition. Past editions, and any other data, are read in Reports with its Edition filter, which can combine several editions.
- A facilitator chooses MYF, MYA or **Both** when registering. A Both facilitator counts in the MYF tab and in the MYA tab, and once under All camps; in Reports, the facilitator Camp filter's MYF and MYA include them, and "Both" lists only them.
- The summary items are ordered as the camp unfolds: total registered, walk-in registrations, spots left (MYF and MYA under All camps, only the selected camp otherwise; camper limit minus spots used, read from `campRecords`), pending arrivals, present on site, departed early, baptism requests, then total registered facilitators. Keep that order when adding items. The image reads them three to a row; a last odd tile spans what is left of its row.

## Welcome page card (Camp setup)

- The first card on Camp setup. It holds the public welcome page's content, not its facts: per camp (MYF and MYA tabs) a description of up to 160 characters (typing or pasting past the limit keeps what fits; a character limit cannot be dodged by typing without spaces), the camp image, and the lists What to bring, What to expect and Good to know (one item per line). Camp names, dates, fees and links come from each camp's own card.
- Within each camp tab the left column is ordered as the card reads: **Camp image**, then **Description**. The first three "What to bring" items are the ones that show on the card, and the field says so.
- **Preview** (beside Edit, also while editing) opens `WelcomePreviewDialog` (`components/welcome-preview.tsx`): the two camp cards and the requirements dialog drawn from the typed, unsaved values, with names, dates, fees and Register status from each camp's setup (a paused camp shows "Registration paused"). It is a copy of the welcome page's markup, so keep it in step with `campfearless-welcome`. It sits in a `force-light` box because the welcome page is always light, whatever the portal's theme.
- The welcome page link is one small muted line under the card description (`headerExtra` on `SetupCard`): the link opens the page, with icon-only **Copy welcome page link** and **Open welcome page** buttons beside it (tooltips and `aria-label`s). Keep it that small; the card is already full of text, so it gets no heading, section or explanation. The address is permanent: set up once with the website, never generated per edition, never edited in Camp setup, and it always shows the current camps, so other websites can link to it. The MYF and MYA cards keep their own **Copy link** and **Pause link**, with the hint that the link sends campers straight to that camp.
- Every camp always has an image (the explanation sits behind an info icon beside the "Camp image" label, not as text under the button). `/camps/myf.webp` and `/camps/mya.webp` are the defaults and can't be removed: **Replace image** swaps in a custom one (an image under 5 MB) and **Use default image** goes back. The image field is a hidden `Input type="file"` opened by the button; never `sr-only` (it keeps its full width and overflows the page).
- Built with `SetupCard` and the shared setup helpers exported from `components/camp-setup.tsx`; the review dialog lists only changed fields, and saving fires "Welcome page successfully saved" and the audit action "Welcome page saved".

## Waivers

- The **Waiver** column says how a waiver was issued: a green **Walk-in** (issued at the desk and checked in right away) or a blue **In advance** (issued earlier; the camper checks in on arrival). It replaces a Status column that only ever said "Waived". The **Arrival** column still shows Checked in or Not arrived.
- A new waiver is Walk-in when **Check in right away** is on, otherwise In advance.
- Filters beside the search, in this order: All camps, All campuses (the campuses that appear in the list, A to Z), All arrivals (Not arrived, Checked in).

## Medical and special needs

- The Medical and special needs section (registration, waivers, Edit camper) has the subtitle "Only add brief information on what affects the camper during camp." (`medicalSubtitle` in `components/registration.tsx`, one text for every screen) Each details box holds at most 40 characters (`medicalMaxChars`, kept short because these notes print in lists) and shows "12 of 40 characters" beneath it.

## Audit log

- Every action a screen adds that changes data, or opens sensitive records (print, export, medical details), needs an audit log entry. Add its sample row to `components/audit-log.tsx`.
- Action: a short past-tense label from a fixed list, in sentence case ("Permission granted", "Camp setup saved"), grouped under one area (Users, Roles, Camp setup, Campuses and networks, Campers, Waivers and payments, Sensitive access, Sign-in). Shown as `<Badge variant="outline">`.
- Detail: the subject first in `font-medium` (camper, user, role or setup), then ` · ` and the change in `text-muted-foreground`. One change reads "Label old → new". Several changes read "N changes", a button that opens the read-only details dialog listing each old → new.
- Removed users keep their name with "(removed)". Entries never get edit, delete or row menus.
- A screen with a "Last saved by …" line links it to the audit log, pre-filtered with `?camp=`, `?area=` or `?q=`.

## Shared helpers and page metadata

- **At least two Super admins, always** (`minSuperAdmins` in `lib/staff.ts`, `isNeededSuperAdmin`): when only two active Super admins exist, neither can be removed, deactivated or given another role. The row's role select and switch are disabled and Remove user opens the destructive "Can't remove ..." dialog ("Make someone else a Super admin first"). Nobody can remove or deactivate themselves. The server must enforce the same rule.
- **Roles decide what is shown** (`lib/session.ts`, `components/session-provider.tsx`): `can("verify-payments")` asks whether the signed-in role has a permission. The sidebar hides items the role can't use (Camp setup `edit-camp-setup`, Reports `view-records`, Registration `register`, Waivers `issue-waivers`, Payments `verify-payments`, Users and roles `manage-users`, Campuses and networks `manage-campuses`, Audit log `view-audit-log`); a page opened by address without its permission shows `RequirePermission`'s card, "You don't have access to this page" (`403` on the real server). Inside screens: check-in buttons need `check-in`, exit permits and undoing a check-out need `check-out`, Edit and Cancel registration and the walk-in card need `register`, Print report needs `print-records`, Export needs `export-records`, and medical and special needs columns (roster, Reports) need `view-medical`. A row menu with nothing left for the role disappears. The real server must enforce the same permissions.
- **Demo sign-in:** Log in accepts a sample staff email (`john@`, `sharon@`, `dennis@mavuno.org` and so on) with any password; an unknown email shows "Invalid email or password.", an inactive or pending account says so. The user menu has **View as (demo)** to switch role without logging out. Until someone logs in the portal is John Doe, Super admin.
- **Every write waits visibly** (`lib/api.ts`, `lib/use-action.ts`, `components/loading-button.tsx`): the button switches off and shows its own wording ("Saving...", "Verifying...", "Checking in...") while the call runs, a second click does nothing, and a failure shows the standard "Failed to <action>. Something went wrong on our end. Please try again." toast and re-enables the button. All writes go through `callApi`, which today only waits 400 ms and then changes the dummy data; the backend replaces its body with a real request. A new Save, Confirm or Delete button must use `LoadingButton` and `useAction`.
- **Tests** (`pnpm test`, Vitest, files in `tests/`): they check the rules (phone, email and M-Pesa validation, the duplicate check, dashboard counts, what a payment code should add up to and the Matched/Short/Over check, CSV formula safety, role permissions, sorting and paging, edition titles and camp overlap). Each test brings its own small made-up data (`tests/fixtures.ts`), so none depends on the sample data. `tests/sample-data.test.ts` is the one exception: it checks the sample data hangs together and should be deleted when real data replaces it. A new rule in `lib/` gets a test; keep rules in plain `lib/` files (not inside components) so they can be tested.
- **Validation lives in `lib/validation.ts`**: `phoneValid` (10 digits starting 07 or 01) with its message `phoneError`, `isEmail`, `mpesaCodeValid`. Every form uses them (Registration, Waivers, Edit camper, Account, Users, Login), so a number or email is accepted or rejected the same way everywhere. Edit camper also checks the camp's age limits and requires both names; Save stays disabled until they pass.
- **Text length limits** (`lib/validation.ts`): first, last and emergency-contact names `nameMaxChars` (30), church or organisation `churchMaxChars` (60), and the names of campuses, networks, roles and editions `placeNameMaxChars` (40). The input stops at the limit (`maxLength`), so a long value can't break a table, a printout or a CSV. Medical and special needs stay at 40 (`medicalMaxChars`).
- **The check-in lookup** (dashboard) searches names, the camper's phone, the emergency contact's phone and the M-Pesa code, and never medical details. It starts empty, and **Check in** stays disabled until something is typed. In the results only campers still "Registered" can be ticked; anyone already checked in or out is shown greyed out with their status. The row's own **Check in** button uses the same undo overlay and toast as the lookup.
- **A full camp takes nobody more.** Registration blocks Complete when a camp has no spots left ("MYF is full...") and trims the batch when switching to a camp with fewer spots.
- **CSV export neutralizes formulas:** a cell starting with `=`, `+`, `-` or `@` gets a leading apostrophe. The summary image shows an error toast and a message, never a spinner forever, if it can't be drawn.
- **The Camp roster & status monitor is paginated**: ten campers a page, with `TablePagination` (`components/table-pagination.tsx`) under the table: "Showing 1-10 of 30" on the left, "Page 1 of 3" with **Previous** and **Next** on the right. A search, filter, sort or tab change goes back to page 1. Use it for any table that can grow past about thirty rows.
- **The roster lists everyone at camp**: the open edition's campers and its facilitators (30 names in the sample, John Doe among the facilitators). A facilitator's name cell reads "Age: 38 - Male · Facilitator, Media team", their Camp is MYF, MYA or Both (a Both facilitator shows under both camp tabs), and a **Role** filter (All roles, Campers, Facilitators) sits between Campus and Status. The charts and Quick summary still count campers only, and the facilitators total is its own number.
- **Sample data shows every state** so screens can be judged without inventing cases: camper statuses Registered, Checked in and Checked out (with an exit-permit time); online, walk-in and waiver campers (walk-in and in-advance); payments Enter amount, Short, Matched, Over, Flagged and Verified, including a code that covers several campers; medical and special needs; baptism yes and no; campers not from Mavuno (campus Invited, with a church); a deleted campus (Mathare); facilitators in every team, serving MYF, MYA or Both, one fee waived; three editions (one open, two closed); MYF's link active and MYA's paused; users active, inactive and pending. When a new state is added to the system, add a row of it to `lib/records.ts` (or the matching `lib` file).
- **Roster rows are identified by their record id**, never by their position in a list. The dashboard roster lists every camper of the open edition (and the check-in lookup searches all of them). **Edit camper** updates the row. A **walk-in registration** adds its campers (checked in) and one pending payment to the shared records when the overlay is dismissed or its 5 seconds end; only Undo cancels it. Payments and Reports read the records when they open, so they show it.
- **Undo check in and Undo check out** (roster row menu) ask first, in a destructive dialog with two buttons, **Cancel** and the action itself (**Undo check in** or **Undo check out**). Undo check out says who left, when (the exit-permit time), and that they will be marked on site again; Undo check in says they go back to Registered and stop counting as present. Both show a loading button ("Undoing..."), then "Check-out successfully undone" or "Check-in successfully undone". Audit actions: Check-in undone, Check-out undone (area Campers).
- **Cancel registration** (roster row menu, destructive) asks "Cancel registration?" (buttons **Keep registration** and **Cancel registration**), removes the camper from the roster, frees the spot, leaves the payment on record, and toasts "Registration successfully cancelled". Audit action: Registration cancelled (area Campers). **Cancel invite** also asks first.
- Toasts follow the header's light and dark switch (`useAppTheme`). Dependencies are pinned to the installed versions; never use `latest`.

- **One source per fact.** People, payments, waivers and facilitators come from `lib/records.ts`; staff, roles and permissions from `lib/staff.ts`; camp settings (fees, limit, dates, age limits, link) from `lib/camp-data.ts`; editions from `lib/editions.ts`; campuses and networks from `lib/campuses.ts`; dashboard counts from `lib/dashboard-stats.ts`. A screen never types a person, a fee, a campus list, an age limit or a staff name of its own. Records that say "registered by" or "issued by" hold a user id, and screens show `userName(id)`. `docs/backend-tables.md` lists these as the backend tables, so a new field goes in the matching lib file and in that document.

- A camp's name label, dates, fees, camper limit, spots used and link come from `campRecords` in `lib/camp-data.ts` (the backend will serve them). Camp setup, Registration, Waivers, the dashboard tabs and the Welcome page card all read it; never type a camp number, date or label into a screen. Dashboard counts come from `lib/dashboard-stats.ts` in the same way.
- The signed-in user comes from `currentUser` in `lib/session.ts` (name, email, role), never a hard-coded string in a screen.
- Numbers with thousands commas use `formatNumber` from `lib/format.ts`; dates use `formatDateTime`. Never define a local copy.
- Every route's `page.tsx` exports `metadata = { title: "<Page name>" }`; the root layout adds " · Camp Fearless". Never leave the default title.
- The theme (light or dark) is saved in `localStorage` under `theme` and applied by an inline script in `app/layout.tsx` before first paint. Never set the theme class from a `useEffect` alone.
- `SidebarInset` has `min-w-0` so wide tables scroll inside their own wrapper instead of stretching the page. Don't remove it.
- Every search input has an `aria-label` equal to its placeholder, and every `PopoverContent` has an `aria-label` ("Choose camp start", "How camper spots are counted").
- Light-mode text must pass 4.5:1 contrast on its background: use `text-muted-foreground`, the `status-*` pairs and `text-attention` as defined, never a lighter shade.
- Each `loading.tsx` skeleton should be within about 10% of the real page's height (rows and cards included) so nothing jumps when content arrives.

## Logo

- The Camp Fearless logo is always the SVG, never a PNG: black on light backgrounds (`dark:invert` where the theme can be dark), white on a dark picture, orange when the summary image tints it. Portal: `public/camp-fearless-logo.svg`; welcome site: `camp-fearless-logo-dark.svg` (light pages) and `camp-fearless-logo.svg` (registration hero).

## Error pages

- `app/not-found.tsx` and `app/error.tsx` are the only error pages: centred `text-base font-semibold` title, one muted sentence, and a **Go to dashboard** button (plus **Try again** on errors).

## Before finishing a screen

1. Compare it side by side with the dashboard at desktop (1440px), narrow desktop with the sidebar open (about 1000px) and mobile width.
2. Toggle dark mode with the header switch and check every badge, toast and tinted surface.
3. Check the route's `loading.tsx` skeleton matches the finished page.
4. Run `pnpm build` (`npx -y pnpm@10 build`) and fix anything it reports. That is what Vercel runs.
5. Search the new code for hex values, `className` passed to `toast`, `CardTitle` without `text-base`, and any title-case labels. Fix what you find.

## Shared links

- A shared link shows Camp Fearless's own preview image (`app/opengraph-image.jpg` and `app/twitter-image.jpg`, 1200 x 630) and tab icons (`public/apple-icon.png`, `icon-light-32x32.png`, `icon-dark-32x32.png`): the orange Camp Fearless mark, never a template default. Keep the preview images under about 300 KB. `metadataBase` in `app/layout.tsx` points at the Vercel address so the preview image can be found.

## Shared links

- A shared link shows Camp Fearless's own preview image (`app/opengraph-image.jpg` and `app/twitter-image.jpg`, 1200 x 630) and tab icons (`public/apple-icon.png`, `icon-light-32x32.png`, `icon-dark-32x32.png`): the orange Camp Fearless mark, never a template default (the old black "v0" icon is gone). Keep the preview images under about 300 KB. `metadataBase` in `app/layout.tsx` points at https://campfearlessportal.vercel.app so the preview image can be found.
