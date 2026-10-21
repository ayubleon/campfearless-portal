# Camp Fearless portal: what each screen needs from the server

A draft from the front end, screen by screen. It says what each screen **shows** (a read) and what it **saves** (a write), the fields involved and the errors it expects. The paths and names are only suggestions: the backend team decides the real ones, and this document should be corrected to match. Tables and columns are in `backend-tables.md`; rules to enforce are there too.

Conventions (suggested): JSON in and out; every call carries the signed-in user's token; lists accept `page` and `pageSize` and return `{ rows, total }`; a failed call returns an error status plus `{ message, fields? }` where `fields` names the invalid inputs. The portal shows the message in a "Failed to ..." toast.

Status codes the screens react to: **400** invalid input (shown under the field), **401** signed out (go to Log in), **403** no permission (shown as "You don't have access"), **404** not found, **409** conflict (a duplicate person, an M-Pesa code already used, a full camp, an edition name taken).

Permissions are the ids in `backend-tables.md` (`register`, `check-in`, `check-out`, `issue-waivers`, `verify-payments`, `view-records`, `print-records`, `export-records`, `view-medical`, `edit-camp-setup`, `manage-campuses`, `manage-users`, `view-audit-log`). The server must enforce them; the screens only hide what a role can't use.

## Sign-in and account

| Screen | Reads | Saves |
|---|---|---|
| Log in | none | `login` (email, password) returns the user, role, permissions and a token. 401 shows "Invalid email or password." |
| Forgot password | none | `forgot-password` (email); always answers the same, so addresses can't be guessed |
| Set up account (from an invite link) | the invite (email, role) | `accept-invite` (token, first name, last name, phone, password) |
| Account | the signed-in user | `update-me` (first name, last name, phone); `change-password` (current, new). The new password must be at least 8 characters and differ from the current one |
| Sidebar user menu | the signed-in user and permissions | Log out |

## Dashboard (permission: signed in; actions need `check-in`, `check-out`, `register`)

| Needs | Detail |
|---|---|
| Read: figures | for the open edition and a camp (All, MYF, MYA): registered, walk-ins, online checked in, departed early, male and female present, baptism requests, facilitators, spots used and left. Worked out by the server from the tables |
| Read: roster | campers and facilitators of the open edition: name, age, gender, role (Camper or Facilitator), team, camp, campus (or Invited), status, medical, special needs, emergency contact, fee waived. Filters: edition, camp, campus, role, status, search (name, phone, M-Pesa code). Sort by a column. **Paged** (the screen pages ten at a time) |
| Read: check-in lookup | search by name, phone, emergency contact phone or M-Pesa code (never medical details); returns matches with their status |
| Write | `check-in` (one or several people); `undo-check-in`; `exit-permit` (marks checked out, with a time); `undo-check-out`; `edit` a camper (first and last name, age, gender, phone, baptism, medical, special needs; age must fit the camp); `cancel-registration` (frees the spot, leaves the payment). Each one is audited |
| Errors | 409 when someone is already checked in or out; 400 for age outside the camp's limits |

## Registration (walk-in) (`register`)

| Needs | Detail |
|---|---|
| Read | for MYF and MYA: label, age limits, walk-in fee, spots used and left, relationship choices (Parent, Legal Guardian, Sibling, Relative, Other, the same for every camp); the campus list (without Invited); whether the edition is open |
| Write | `walk-in registration`: camp, the M-Pesa code, up to 10 campers (first and last name, age, gender, phone, baptism, from Mavuno, campus or church, medical, special needs), and one emergency contact (names, phone, relationship). Creates the registrations (checked in) and one pending payment |
| Errors | 409 duplicate person (returns who they clash with, and a `warning` for look-alikes the staff may confirm), 409 M-Pesa code already used, 409 camp full, 400 invalid fields |

## Waivers (`issue-waivers`, `check-in`)

Read: waivers of the open edition (name, age, gender, phone, camp, campus, baptised, Walk-in or In advance, arrived, issued on, issued by), filtered by camp, campus, arrival, search. Write: `issue-waiver` (same fields as a camper, plus "check in now"); `check-in` an existing waiver; `undo`. Errors: same 409 duplicate rule.

## Payments (`verify-payments`)

Read: payments of the open edition: code, who is on it (campers or one facilitator), type (Camper or Facilitator), camp (or Both), campus, expected amount, the amount typed, status, registered by. Filters: camp, campus, type, status, search. Write: `set-amount` (digits, up to 7); `verify` (only when the amount equals the expected total); `flag`; `reopen`. Errors: 409 when verifying a payment whose amount does not match.

## Reports (`view-records`; `print-records`, `export-records`, `view-medical`)

Read, three reports, each with the **edition** filter (one or several, so editions combine): campers (camp, campus including Invited, status, payment, registration type, gender, optional church or organisation), facilitators (camp, team, campus, status, payment, gender, M-Pesa code), and age and gender. Each accepts a search, a sort and the columns wanted; the screen builds the printout and the CSV from the result (large reports may need paging or a server-built CSV). Medical and special needs columns are only returned with `view-medical`. Write: `log-event` for "Report printed" and "Report exported" (the audit log needs them).

## Camp setup (`edit-camp-setup`)

| Tab | Reads | Saves |
|---|---|---|
| Editions | all editions: name, open or closed, dates (worked out from their camps) | `create-edition` (name; copies the last edition's settings); `rename`; `close`; `reopen` (closes the other open one, after the screen asks) |
| Camp settings | for the open edition: each camp's dates, limit, fees, registration window, link, paused; the shared facilitator fee; the welcome page content | `save-camp` (dates, limit, online and walk-in fee, registration opens and closes; the limit can't be below spots used); `pause` and `resume` the link; `save-facilitator-fee`; `save-welcome` (per camp: description up to 160 characters, image, three lists); `upload-welcome-image` (an image under 5 MB) |
| Both | the overlap warning: camps of one edition should not run at the same time (a warning, not an error) | |

## Campuses and networks (`manage-campuses`)

Read: networks and campuses (a campus has its network). Write: `add`, `rename`, `delete` a network (409 while it still has campuses); `add`, `rename`, `move to another network`, `delete` a campus. Deleting a campus that has registrations **archives** it (`deleted_at`): it leaves the lists people choose from but stays on every record and shows as "<name> (deleted)". One with none is erased. The system campus **Invited** is never listed, renamed or deleted.

## Users and roles (`manage-users`)

Read: users (name, email, role, camp access, status active, inactive or pending) and roles (name, description, can sign in, permissions, how many users). Write: `invite` (email, role, camp access; 409 if the email has an account); `resend-invite`; `cancel-invite`; `change` a user's role, access or status (a user can't deactivate or remove themselves, and the system must always keep **at least two active Super admins** (409 when a change would leave fewer: removing, deactivating or changing the role of one of two)); `remove` a user; `create-role`, `edit-role` (name, description, can sign in; 409 on a duplicate name), `delete-role` (409 while users have it), `set-permission` (granting a sensitive one is confirmed in the screen).

## Audit log (`view-audit-log`)

Read only: entries filtered by edition, camp, area, when (today, 7 days, 30 days, a date range), search; paged ("Load more"). Entries are written by the server whenever something is changed or sensitive data is opened; nobody can edit or delete them.

## Public pages (the welcome page and registration forms, in `campfearless-welcome`)

| Needs | Detail |
|---|---|
| Read | the open editions' camps: name, dates, fee, age label, registration status (open, scheduled, paused, full, closed), description, image, the three lists |
| Write | the camper registration for MYF and MYA, and the facilitator registration (every field required except medical and special needs; names up to 30 characters, church or organisation up to 60; a phone of 10 digits starting 07 or 01; a camper not from Mavuno gets the campus Invited; facilitators are always from Mavuno, so they pick a real campus and are never Invited). Same 409 rules as walk-ins (duplicate person, M-Pesa code used, camp full) |

**Prices are data, never code.** The online fee, the walk-in fee, the facilitator fee, the limit and the dates are set by a Super admin in Camp setup and saved with `save-camp` / `save-facilitator-fee`. The public welcome page and the registration forms must read them from the server **on every request** (they are rendered per visit, never built into the site), so a change in Camp setup shows on the welcome cards and the registration total straight away, with no code change and no work from the developers. The server also uses the fee that was current when a person registered, so a later change only affects new registrations. Amounts are always shown as `KES 1,000`.

## How the screens should wait (for the API calls above)

Every write shows a loading state on its button ("Saving...") and switches the button off until the call answers, so it can't be sent twice. A failure shows the "Failed to ..." toast and re-enables the button. The portal already has this behaviour: `lib/api.ts` is the one place where a call is made, and `components/loading-button.tsx` is the button.
