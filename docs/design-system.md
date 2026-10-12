# DormLoot design system

The conventions below keep later changes consistent instead of drifting. Tokens
live in `tailwind.config.ts`; shared primitives live in `components/ui.tsx`.

## Design read

A trust-first student marketplace, used mostly on phones, where the job is to
compare items quickly and then talk to a stranger with enough confidence to meet
them. That makes it product UI, not a marketing site: restrained layout,
legible density, and no decoration that competes with item photos.

Applied as a **preserve** redesign. The navy brand, the routes, the nav labels
and the copy voice all stayed; typography, spacing, color temperature,
components and states changed.

## Tokens

**One accent.** Navy `#1E40AF` carries every primary action. Previously a gold
badge and a coral accent were also in play, which made nothing look primary.
Green, amber and red are now reserved for semantic meaning (success, warning,
destructive) and never for decoration.

**Warm neutrals.** The page background was already warm (`#F7F4EF`) while every
border, surface and grey was cool slate. Neutrals are now warm throughout, so
the palette reads as one family. Cool navy against warm paper is the intended
contrast.

**Type.** Geist and Geist Mono, loaded through `next/font`. The stylesheet
previously asked for Inter without ever loading it, so the app silently rendered
in system fonts. Weights run 400/500/600 instead of the former near-uniform 900,
and prices use tabular figures via the `.tabular` class so columns align.

**Shape.** Cards and images `rounded-card` (16px), controls `rounded-ctl` (10px),
status pills and icon buttons fully round. That three-step rule is the whole
system; do not introduce a fourth radius.

**Elevation.** Two shadows only, both tinted warm to match the background:
`shadow-card` at rest and `shadow-pop` on hover or for raised surfaces.

## Components

Use `components/ui.tsx` rather than restyling controls inline:
`Button`/`ButtonLink` (primary, secondary, ghost, danger), `Badge`, `Card`,
`Field` with its `inputClass`/`selectClass`/`textareaClass`, `PageHeader`,
`EmptyState`, `Notice`, `Skeleton`.

Rules worth keeping:

- Listing cards are one link across the whole surface. The save button sits
  above that overlay with `z-10` and carries its own label.
- A Wanted post has no price; a Free item says "Free". Never show `$0`.
- The Sold badge is a solid dark pill so it stays readable over bright and dark
  photos alike.
- Owner controls belong inside the card footer, so rows stay aligned.
- Your own messages are navy and right-aligned; theirs are neutral and
  left-aligned.
- Forms label every field, mark Required or Optional, and put errors below the
  input.

## Navigation

Desktop keeps a single-row top bar. Phones get a fixed bottom tab bar, because
the old single-row top nav clipped the primary action off the right edge at
390px. The footer carries bottom padding so the tab bar never covers content.

## Accessibility baseline

Visible focus ring on every interactive element, `prefers-reduced-motion`
honored globally, icon-only controls labelled, the unread count announced in the
inbox link's accessible name, and status messages in live regions.

## What this does not cover

No dark mode. The app is light-only (`color-scheme: light`); adding dark mode
means defining a second token set, not overriding colors per component.

## Provenance

The visual direction was worked through TasteSkill: repository
`github.com/Leonxlnx/taste-skill` at commit `18dfc92` (2026-10-08), skills
`design-taste-frontend` (taste-skill v2) and `redesign-existing-projects`. Its
installer could not be run in this environment, so the SKILL.md files were read
directly and applied by hand. Dials used: DESIGN_VARIANCE 4, MOTION_INTENSITY 3,
VISUAL_DENSITY 5, chosen from its trust-first preset rather than its
landing-page baseline, since this is product UI.
