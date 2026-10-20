# Campfearless portal: UI rules

`components/dashboard-overview.tsx` is the reference screen. Every new screen must match its spacing, type, colors, badges, toasts and component usage. If a rule below is unclear, copy what that file does. Never use a pattern that file doesn't use.

## Components

- Import UI primitives from `@/ui/*` (e.g. `@/ui/button`, `@/ui/card`). There is no `components/ui` folder.
- Use `cn` from `@/lib/utils`.
- `components.json` uses the shadcn **`default`** style (Radix-based, 40px / `h-10` controls). Add missing components with the shadcn MCP or `pnpm dlx shadcn@latest add <name>`. They install into `ui/` already matching. The project uses **pnpm**, never npm or yarn.
- Exception: `ui/dialog.tsx` is the Base UI (`base-nova`) dialog the dashboard is tuned to. Never run `shadcn add dialog` or `--overwrite` on it.
- If a component comes from another style or registry, restyle it to match before using it: `h-10` controls, `rounded-md`, `text-sm`, same focus ring as `ui/button.tsx`.

## Colors

- Only use theme tokens (`bg-primary`, `text-muted-foreground`, `border`, `bg-muted/50`, ...). **No hex values or Tailwind palette colors in components.** The exceptions are the toast styles in `ui/sonner.tsx` and the chart palette below.
- Custom tokens live in `app/globals.css`. Defined in `:root`, with dark values in `.dark`, and registered in `@theme inline` as `--color-*`.
  - `brand` / `brand-hover` / `brand-foreground`: `#336699`. Used **only** for the per-row "Check in" action in tables: `className="bg-brand text-brand-foreground hover:bg-brand-hover"`. Every other primary action uses the default near-black `Button`.
  - `status-*` pairs: badge backgrounds and text (see Badges).
- Destructive meaning uses `text-destructive`: menu items, alert icons. Not red palette classes.
- Every screen must look right in light **and** dark. Test dark with the header switch, not only with system dark mode. A token without a `.dark` value is a bug.
- New color need: add a token pair to `:root` and `.dark`, register it in `@theme inline`, then use the utility.

## Layout and spacing

- Page shell: `SidebarProvider` + `AppSidebar variant="inset"` + `SidebarInset` + `SiteHeader`, as in `app/dashboard/page.tsx`.
- Page content: `<main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">`.
- Gaps between sections and between cards: `gap-4`. Responsive grids: `grid gap-4 md:grid-cols-2` / `lg:grid-cols-2`. Add `min-w-0` to grid children that hold charts or tables.
- Inside cards: `gap-4` between blocks, `gap-2` between stacked list items, `gap-3` between any buttons placed side by side and between an input and its button.
- Card padding comes from `ui/card.tsx` (`p-6`). Don't override it.

## Typography

- All headings, labels, buttons, menu items and badges use **sentence case**: "Check in", "Issue exit permit", "Camp roster & status monitor".
- `CardTitle` must always get `className="text-base"`. Its default is `text-2xl`, which the design never uses.
- `CardDescription`: default (`text-sm text-muted-foreground`). One sentence that says what the card does.
- Dialog title: `text-base font-semibold leading-none tracking-tight`. Exception: destructive or irreversible confirmations use `text-lg` with an icon (see Dialogs).
- Body text `text-sm`. Secondary text `text-muted-foreground`. Small meta and legends `text-xs text-muted-foreground`.
- Emphasis inside muted text: `<strong className="text-foreground">`.
- Numbers in stats: `tabular-nums`. Stat value `text-base font-semibold`; chart center value `text-xl`.
- Page title in `SiteHeader`: `text-base font-semibold`.

## Cards

- Charts and summaries use the default card shadow. Action, form and table cards use `className="shadow-none"`.
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

`Badge` base: `rounded-full px-2.5 py-0.5 text-xs font-semibold`. Status colors come from one mapping function, never inline:

| Status | Classes |
|---|---|
| Checked in | `border-transparent bg-status-checked-in text-status-checked-in-foreground` |
| Registered | `border-transparent bg-status-registered text-status-registered-foreground` |
| Checked out / neutral | `rounded-full border-2 border-border bg-muted text-muted-foreground` |

- Use the existing `statusClass(status)` pattern. A new status means a new `status-*` token pair in `globals.css` (light and dark) plus a branch in the mapping.
- In tables: `<Badge variant="outline" className={cn("whitespace-nowrap", statusClass(status))}>`.

## Toasts

- Only `toast.success("...")` and `toast.error("...")` from `sonner`. **Never pass `className` or styles.** Green success and red error styling are defined once in `ui/sonner.tsx`.
- Wording:
  - Success: "<Subject> successfully <past tense>", e.g. "Camper details successfully updated", "Camper successfully checked in".
  - Error: "Failed to <action>. Something went wrong on our end. Please try again."
- Actions that need undo (e.g. check-in) use the dashboard's confirmation overlay instead of a toast. A centered card with `bg-black/20 backdrop-blur-sm` backdrop, a title, a muted description and an `h-1.5` `bg-emerald-500` progress bar that empties over 5 seconds. Buttons: **Undo** (outline) and **Done** (primary). Done fires the success toast.

## Buttons

- Primary: `<Button>` (default variant). Secondary or cancel: `variant="outline"`. Icon-only: `variant="ghost" size="icon"` with an `aria-label`.
- Button pairs are right-aligned, cancel first, always `gap-3`: `<div className="flex justify-end gap-3 pt-2">Cancel (outline), Confirm (default)</div>`. Full forms use `pt-4` above the row.
- Confirmation dialog footer: `<DialogFooter className="grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">`, with equal-width Cancel and Confirm.
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
- Search input: relative wrapper, `IconSearch` at `absolute left-3` in `text-muted-foreground`, `Input className="border bg-muted/50 pl-10"`. Placeholder style: "Search by name, phone, M-Pesa code". Filter searches update live as you type. Lookup searches that open a result dialog also run on Enter.
- Expandable option card: `rounded-2xl border bg-muted/30 p-4 text-sm` with `focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20`. Reveal its details with the `grid-rows-[0fr]` → `grid-rows-[1fr]` + opacity transition (`duration-300 ease-out`), helper text indented `pl-6 text-muted-foreground`.
- Filter selects sit next to the search with a fixed width (`SelectTrigger className="w-32"` / `w-36`). The first option is "All …".

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

1. Compare it side by side with the dashboard at desktop and mobile width.
2. Toggle dark mode with the header switch and check every badge, toast and tinted surface.
3. Search the new code for hex values, `className` passed to `toast`, `CardTitle` without `text-base`, and any title-case labels. Fix what you find.
