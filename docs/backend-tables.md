# Camp Fearless portal: backend tables and data flow

Hand-off for the backend team. It lists the tables the front end needs, the columns, how they connect, which screen reads or writes each one, and what is worked out (never stored). The front end already reads every fact from one place (`lib/*.ts`, named per table below), so when the API arrives each file is replaced by a fetch and no screen changes.

Conventions: ids are strings (UUID or ULID); `*_at` are timestamps (UTC, shown in East Africa Time); money is whole KES integers; enums are lowercase snake_case in the database and shown in sentence case. "Edition" is explained next.

## The one idea that shapes everything: editions

An **edition** is one run of the camps (MYF and MYA together), **named by the administrator** ("Easter 2026", "December 2026"). It is not a quarter or a year. Registrations, payments, waivers, facilitators and the camp settings (fees, limit, dates, link) belong to an edition. Campuses, networks, users, roles and the camps' identity (name, age limits) do not.

- Many editions can exist but only **one is open at a time**. Registration, Waivers and Payments only work on open editions. Closed editions are read-only and found in Reports.
- An edition has **no dates of its own**: they are the earliest camp start to the latest camp end of its camps.

## Tables

### Camps and editions

**editions**
| column | notes |
|---|---|
| id | |
| name | unique, set by the administrator |
| status | `open` or `closed` |
| facilitator_fee | KES, one fee for both camps (Camp setup, Shared settings) |
| created_at, created_by | created_by is a `users.id` |

**camps** (static: two rows, `MYF` and `MYA`)
| column | notes |
|---|---|
| id | `MYF`, `MYA` |
| name | as campers see it, e.g. "MYF: Mavuno Young & Fearless" |
| description | |
| age_min, age_max | MYF 14 to 17, MYA 18 and no upper limit (`age_max` null). Registration validates against these and Reports splits "Under 18 / 18 and over" at MYA's `age_min`. The label "MYF (14 - 17)" is built from them, never stored |

**edition_camps** (one row per edition and camp; this is what the MYF and MYA cards in Camp setup edit)
| column | notes |
|---|---|
| edition_id, camp_id | primary key together |
| camp_start, camp_end | dates; the edition's dates are derived from these |
| camper_limit | |
| online_fee, walk_in_fee | KES per camper |
| registration_opens, registration_closes | dates |
| link_slug | the camp's own registration link, e.g. `myf-2026-x7k2` under `register.mavuno.org` |
| paused | registration link paused; campers can't sign up |
| last_saved_by, last_saved_at | shown as "Last saved by" and linked to the audit log |

**welcome_content** (what the public welcome page shows; one row per camp, kept across editions)
| column | notes |
|---|---|
| camp_id | |
| description | max 160 characters |
| image | file reference, or null for the default image |
| bring, expect, know | lists, one item per line (store as rows in a child table or JSON) |

The welcome page address is permanent and shows whichever editions are open.

**Length limits** (enforce them in the API too): first, last and emergency-contact names 30 characters; church or organisation 60; names of campuses, networks, roles and editions 40; medical and special needs 40.

**Required fields.** Every field on a camper or facilitator registration is required (name, age, gender, phone, baptism choice, campus or church, emergency contact name, phone and relationship) **except the medical condition and special needs fields**, which are optional. The facilitator link is the existing facilitator registration; it needs no extra link and follows the same rule. Phone numbers are 10 digits starting with 07 or 01.

**Camps don't overlap.** MYF and MYA of an edition run one after the other. Camp setup warns when their dates overlap (the save is still allowed). Because they never overlap, a facilitator who chose Both really does use a spot in each camp, so **spots used** per camp counts campers plus every facilitator serving that camp (Both included), while people totals count each person once.

**Duplicates.** Reject a second registration of the same person in one edition (camper or facilitator): same full name and phone, or same name, age and campus (case and spacing ignored). The same phone under another name, or the same name and campus with a different age or phone, is allowed but returned as a warning staff must confirm (families share phones). Do this on every path: the camp links, the facilitator link, walk-ins and waivers. The portal checks `mpesa_code` uniqueness before verifying too.

**Facilitators.** They are chosen offline: people who attend training are added to a WhatsApp group, and the facilitator registration link is shared only there. There is no portal action to change a camper into a facilitator.

### Places

**networks** (id, name), **campuses** (id, name, network_id, deleted_at). Names are unique within their table. **A campus is never hard-deleted once a registration refers to it:** set `deleted_at` instead. Deleted campuses are left out of the lists people choose from, kept on every existing registration, and shown in reports as "<name> (deleted)". One with no registrations may be erased. Reports group by the campus's current `network_id`. Campus is chosen from one A to Z list on every form and filter.

### Staff

**permissions** (id, label, group, sensitive): a fixed list the code knows (register, check-in, check-out, issue-waivers, verify-payments, view-records, print-records, export-records, view-medical, edit-camp-setup, manage-campuses, manage-users, view-audit-log).
**roles** (id, name, description, can_sign_in, locked). Roles that can't sign in are the **facilitator teams** (Kitchen crew, Security, ...). `Super admin` is locked.
**role_permissions** (role_id, permission_id).
**users** (id, first_name, last_name, email unique, phone, role_id, camp_access `both|myf|mya`, status `active|inactive|pending`, password_hash, invited_at). A pending invite may have no name yet. Password reset needs a **password_resets** table (user_id, token_hash, expires_at, used_at).

**Sign-in and email.** Only staff have accounts, created by **Invite user**: the person gets an emailed link, sets their own password and confirms their name and phone (nobody else ever sees a password). Facilitators never sign in. Record the result of each email the system sends (sent or failed) if the email provider supports it; there is no screen for it.

### People and registrations

The front end currently flattens a person and their registration into one "camper" object (`lib/records.ts`). In the database split them, so a returning camper is one person across editions:

**people** (campers and facilitators): id, first_name, last_name, gender `male|female`, phone (required), from_mavuno, campus_id, church (required when not from Mavuno). **Anyone not from Mavuno gets the system campus `Invited`** as their `campus_id`, whatever church they type (the typed church stays in `church`), so one campus filter brings up all outside campers. `Invited` is a reserved row in `campuses` that users can't choose, rename or delete.

**registrations** (a camper in one edition)
| column | notes |
|---|---|
| id, edition_id, person_id, camp_id | |
| age | age at registration (the form asks for age, not birth date) |
| channel | `online` (self-service through the camp link) or `walk_in` (captured by staff in the portal) |
| registered_by | `users.id`, null for online self-service |
| payment_id | null for waivers |
| baptism_requested | |
| medical_details, special_needs_details | each max 40 characters (they print on lists); empty when none |
| contact_first_name, contact_last_name, contact_phone, contact_relationship | emergency contact; relationship options differ by camp |
| created_at | |

Status (Registered, Checked in, Checked out) is **not a column**: it comes from `attendance_events`.

**payments** (one M-Pesa code, which can cover several campers, or one facilitator's fee)
| column | notes |
|---|---|
| id, edition_id | |
| mpesa_code | unique; 10 characters, upper case letters and digits |
| amount_on_sms | typed in by hand from the M-Pesa message; null until typed |
| status | `pending`, `verified`, `flagged` |
| verified_by, verified_at, flagged_by, flagged_at | |

Payments are verified by hand against the Paybill (number and account are settings, below). The **expected** amount is worked out, never stored: the sum over the registrations on the code of the camp's `online_fee` or `walk_in_fee` (0 for a waiver), plus the edition's `facilitator_fee` for each facilitator on the code (0 when waived). Payments verifies camper and facilitator payments the same way; the screen shows a Type (Camper or Facilitator). The Check column (Enter amount, Matched, Short N, Over N) is `amount_on_sms` against expected. One campus per code: the camp and campus shown are those of the campers on it.

**waivers** (a registration that pays nothing): registration_id (primary key), source `walk_in|in_advance`, issued_by, issued_at. A walk-in waiver is issued at the desk and checked in right away; an in-advance one is issued before camp.

**attendance_events** (the camper's journey, append only): id, registration_id, type `check_in|check_in_undone|exit_permit|check_out`, at, by_user_id, note. A camper's status is the latest meaningful event (no event: Registered). The dashboard counts and the roster read from here.

**facilitator_registrations** (a facilitator in one edition, with a `payment_id` for their fee; null when the fee is waived): id, edition_id, person_id, team_role_id (a role with `can_sign_in = false`), camp `myf|mya|both` (chosen when registering: Both serves MYF and MYA and counts in each camp's number and once in the total), campus_id, emergency contact columns as above, medical and special-needs details, fee_waived. Their attendance uses the same events table (a `facilitator_registration_id` column, or one shared `attendees` id).

### Audit

**audit_log** (append only; nobody can edit or delete, including the Super admin): id, at, user_id plus a name snapshot (removed users keep their name with "(removed)"), action (a fixed list, e.g. "Checked in", "Edition closed"), area (`users|roles|camp_setup|campuses|campers|waivers_payments|sensitive|sign_in`), edition_id (null for global actions), camp_id (null when it applies to neither), subject_type, subject_id, subject_label snapshot, summary, changes (list of label, from, to). Every action that changes data, or opens sensitive records (print, export, medical details), writes a row. The audit screen filters by camp, edition, area, date and search. Entries about campers, waivers, payments, sensitive records and camp setup carry an `edition_id`; users, roles, campuses and sign-in do not.

### Settings (small key and value table)

`paybill_number`, `paybill_account`, `medical_max_chars` (40), `online_registration_batch_max` (10 campers per code), `undo_window_seconds` (5). Facilitator fee lives on `editions`.

## What is worked out (do not store)

| shown on screen | how |
|---|---|
| Registered, walk-in, online checked in, pending arrivals, present on site, departed early, male and female on site, baptism requests, total facilitators | counts over `registrations`, `attendance_events` and `facilitator_registrations` for the chosen edition and camp. `lib/dashboard-stats.ts` already works them out from the sample records, as a model of these queries |
| Spots used and spots left | registered campers plus every facilitator serving the camp (including "Both"), against `camper_limit` |
| Edition dates | min `camp_start`, max `camp_end` of its camps |
| Payment expected, Check, Matched, Short, Over | see payments |
| Camp label "MYF (14 - 17)" | from `camps.age_min` and `age_max` |
| Link status (Active, Scheduled, Closed, Paused) | from the registration dates, today and `paused` |
| Campus camper counts in the delete warning | count of registrations by campus |

## One source per fact (which screens read which table)

| fact | table | read by |
|---|---|---|
| Person: name, age, gender, phone, campus, medical, special needs, emergency contact | people, registrations | Dashboard roster, Reports (all three tabs), Waivers, Payments, Edit camper, Registration |
| Status and check-in times | attendance_events | Dashboard, Reports, Waivers (Arrival) |
| M-Pesa code, amount, verification | payments | Payments, Reports (Payment column and filter), Dashboard check-in lookup |
| Fees, limit, dates, link, paused | edition_camps | Camp setup, Registration (fee and spots), Waivers, Welcome page, Dashboard (spots left) |
| Age limits and camp names | camps | Registration validation, Reports age groups, tabs everywhere |
| Edition list and open or closed | editions | Reports and Dashboard filters, Camp setup, the Registration, Waivers and Payments guard |
| Campus and network lists | campuses, networks | Registration, Reports, Payments, Waivers, Campuses and networks |
| Staff names ("Registered by", "Issued by", audit user, current user) | users | Payments, Waivers, Audit log, Account, sidebar |
| Roles, permissions, facilitator teams | roles, role_permissions | Users and roles, Reports Team filter, route guards |
| Welcome page text and image | welcome_content | Camp setup, public welcome page, Preview |

## Main flows (what the screens do)

1. **Set up a camp run.** Camp setup, Camp editions: create an edition (name only). Set each camp's dates, fees, limit and registration window in its card, then the welcome page content. The camp's link goes live between its opening and closing dates unless paused.
2. **Camper registers (online).** From the camp link: camper details, emergency contact, M-Pesa code for the Paybill payment (one code can cover up to 10 campers). A registration is created with channel `online`, payment `pending`, status Registered.
3. **Verify payment.** A staff member reads the amount from the M-Pesa message and types it in. Matched: **Verify** (confirmation shows the code, campers and amount). Otherwise **Flag**. Verified and Flagged can be reopened. Flagged payments are followed up from Reports.
4. **Arrival.** Dashboard: look up by name, M-Pesa code or phone and check in (undoable for 5 seconds). Walk-ins are checked in as soon as their payment is verified. An exit permit marks an early departure; check-out follows.
5. **Walk-in and waivers.** Registration (staff) captures a walk-in with a higher fee. Waivers issues a free registration: **Walk-in** (checked in now) or **In advance**.
6. **Reports.** Pick edition (one or several to combine), camp, campus and the other filters; choose a template and columns; edit the title; print or export. Every print and export is audited.
7. **Close the edition.** Close it in Camp setup: Registration, Waivers, Payments and check-in stop for it, the link stops taking sign-ups, records remain in Reports. It can be reopened.

## What is placeholder, and what to replace when you join the backend

The front end is a working prototype on dummy data. Everything below is fake on purpose and is the spot to replace. Everything else (layout, validation rules, sorting and filtering, derived numbers, print layout, wording, toasts) is final and should stay.

### Data files: replace each with API calls (the screens above them do not change)

| File | What it holds today | Replace with |
|---|---|---|
| `lib/records.ts` | Sample campers, payments, waivers, facilitators; the fee, expected-amount and duplicate-check helpers | `registrations`, `people`, `payments`, `waivers`, `facilitator_registrations`. Keep the duplicate rules, but enforce them in the API as well |
| `lib/staff.ts` | Sample roles and users; the permission list | `roles`, `users`, `role_permissions`. The permission list itself is fixed and stays in code |
| `lib/camp-data.ts` | The two camps' settings for the open edition, sample dates of closed editions, the overlap and edition-date helpers | `camps`, `edition_camps`. Keep the helpers (derived values) |
| `lib/editions.ts` | The three sample editions and their open or closed state | `editions` |
| `lib/campuses.ts` | Networks and campuses, the one A to Z list, and an in-memory "deleted" set | `networks`, `campuses` (`deleted_at` replaces the in-memory set) |
| `lib/dashboard-stats.ts` | Counts worked out from the sample records | The same counts as queries (see "What is worked out") |
| `lib/session.ts` | A sample signed-in user and a permission check (`can`), switchable with the demo login | The real signed-in user and permissions from the sign-in response |
| `lib/api.ts` | `callApi`: waits 400 ms, then runs the local change on the dummy data | The real request. Keep the signature; every Save, Verify and Confirm button already shows its loading and error states |
| `components/audit-log.tsx` (the `entries` list) | Static sample rows | `audit_log` |
| `components/camp-setup-welcome.tsx` (`initialWelcome`) | Sample welcome page text | `welcome_content` |

### Actions that only change the screen they happen on (no data is stored)

Each of these shows the real success toast and updates only its own screen's local state, so a refresh resets it. Replace the handler with the API call, show the toast on success, and the "Failed to ..." toast on error:

- **Dashboard:** check in (and its 5-second undo), exit permit, check out, undo check-in and check-out, **Edit camper** (Save updates the roster row on screen only), **Cancel registration** (removes the row on screen only).
- **Registration:** the walk-in "Complete & auto check-in" adds the campers (checked in) and one pending payment to the sample arrays in `lib/records.ts` when the overlay is dismissed or its 5 seconds end (Undo cancels it), so Dashboard, Payments and Reports show them until the page is refreshed. The API should create the registrations and the payment, check the campers in, and count the spots.
- **Waivers:** issue a waiver, check in.
- **Payments:** the amount typed, Verify, Flag, Reopen.
- **Camp setup:** every card's Save (camp settings, Welcome page, Shared settings), Pause and Resume link, the editions card (create, rename, close, reopen), Copy link.
- **Campuses and networks:** add, rename, move to another network, delete.
- **Users and roles:** invite, resend and cancel invite, activate, deactivate, remove, create and edit roles and permissions.
- **Account:** profile save and password change.
- **Login:** a demo: a sample staff email with any password signs in (and an unknown email shows an error). Forgot password only shows a toast. Real sign-in, a session, and a redirect to Log in for signed-out visitors are still to build.
- **Reports:** the data is sample records. The filters, sorting, print and CSV export (built in the browser) are final.

### Not enforced yet

- **Permissions:** the screens already hide pages, buttons and columns by the signed-in role (`lib/session.ts`, `can(permission)`), with a demo login and a "View as" menu. The server must still enforce every permission (403) and own real sign-in (password check, session, 401).
- **Open-edition rule:** Registration, Waivers and Payments only guard on the sample open edition. The API must refuse writes to a closed edition.
- **Audit log:** nothing writes to it yet. Every change in "Actions" above needs an audit row (see the audit section).
- **Emails:** invites and password resets are not sent.

## Decisions (confirmed)

1. Welcome page content is stored **per camp** and carries across editions. It can be edited at any time.
2. A **person** is one record. In an edition they are registered either as a camper or as a facilitator, never both, so they are counted once. A facilitator who was a camper before is the same person (same `people` row) with a facilitator registration in the new edition.
3. **One edition is open at a time.** Opening or creating an edition while another is open closes the other (the portal asks for confirmation). Enforce it in the API too.
4. M-Pesa codes are generated by Safaricom and never repeat, so `mpesa_code` is **unique across all editions**. Reject a code that was already used.
5. Records are kept **indefinitely**. No deletion job; keep access to medical details and exports under the permissions in Users and roles, and log it in the audit log.
6. The facilitator fee is **per edition** (a column on `editions`).
