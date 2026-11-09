# Modern Sports Studio Refresh — Phase 0 Baseline

Status: inventory and planning only. No poster renderer, AI feature, saved data, or production UI has been changed.

Working branch: `design/modern-studio-phase-0`
Base: `main` (v49, commit `d611f6d`)

## Product direction

Build a premium sports newsroom / creator studio: editorial clarity for news and stats, broadcast-style hierarchy for match updates, high-impact athlete-led graphics for milestones, and a distinct opinion voice for Borhan Rants. Preserve the existing card breadth and recognizable designs where they already work.

## Scope guardrails

- AI features are explicitly out of scope for this refresh.
- Keep existing template keys, field IDs, canvas output sizes, photo library data, and current export workflows compatible unless a later phase proves a migration is necessary.
- Do not replace all cards with one generic visual style.
- Keep the original `main` branch untouched; implement and review on this branch first.
- No changes to user photo data or browser-local storage.

## Existing card inventory

The picker catalogue currently contains 60 named cards across these groups:

- Cricket: `scoreupd`, `innings`, `chase`, `partnership`, `fifty`, `century`, `knock`, `bigknock`, `wicket`, `fifer`, `goodover`, `badover`, `cresult`, `bigresult`, `toss`, `form`
- Test cricket: `testfifty`, `testton`, `testfifer`, `stumps`, `testresult`
- Football: `goal`, `fresult`, `fbigresult`, `matchcard`, `redcard`, `rating`, `transfer`, `tframe`
- News / talk / community: `breaking`, `news`, `statuscard`, `quote`, `hottake`, `trivia`, `poll`, `countdown`, `onthisday`, `record`, `mvp`, `profile`, `debut`, `top`, `frame`, `story`, `versus`, `compare`, `h2h`
- Line-ups / tournament: `playingxi`, `squad`, `lineup`, `pitch`, `fsquad`, `totwc`, `totw`
- Series / tables: `seriesscore`, `preview`, `mostruns`, `mostwkts`, `points`, `topscorers`, `assists`, `fixtures`, `tgroup`, `tstats`
- Brand voice / stylish: `reaction`, `reactionTest`, `gruns`, `gwkts`, `ggoal`, `gresult`, `gnumber`

Note: category totals are based on the catalogue source; some cards intentionally share a renderer/layout. The inventory is not yet a visual pass/fail judgement.

## Preliminary disposition (to confirm with rendered previews)

### Keep the underlying concept; polish execution
- Match result / score update / innings break / chase / partnership
- Batting and bowling milestones
- Football goal / full-time / match card / transfer
- Line-ups, squad, formation, fixtures and stats
- Series score, leaders and points table
- Borhan Rants reaction and stylish big-number family

### Review carefully for visual overlap or unclear hierarchy
- `fifty` vs `century` vs `knock` vs `bigknock`
- `cresult` vs `bigresult`
- Football `fresult` vs `fbigresult` vs `matchcard`
- News / breaking / status / quote / hot-take family
- Compare / versus / head-to-head family
- Tournament-specific frames and generic photo frames

These are review candidates, not recommendations to delete. Each remains available until visual review and a deliberate keep/polish/redesign decision.

## UI baseline observations

Source inspected: `index.html`, `css/styles.css`, `js/app.js`, `js/catalog.js`, `js/templates.js`, `js/layouts.js`, `js/engine.js`, and the cricket, Test, football, tournament and additional-card modules.

- The app already has a useful control-rail / preview / caption structure and a responsive single-column breakpoint.
- The mobile preview is pinned and compressed into a poster-plus-actions arrangement. This protects preview visibility, but it also competes with editing space and can make the actual poster preview small.
- The picker has many categories and card tiles; on phones, dense category pills and four-column tiles need careful spacing and readable labels.
- Form fields use a two-column grid, with wide fields spanning both columns; narrow-screen behavior should be checked for long labels, textareas and file controls.
- Photo library, cutout controls, brand settings, caption tools and multi-size export are powerful, but their visual hierarchy can be simplified without removing capabilities.
- Existing CSS has several mobile rules layered across the file. Before editing, consolidate intent carefully rather than appending conflicting overrides.
- The canvas output uses 1080×1350 by default and platform sizes are defined in configuration. Preserve export dimensions.

## Proposed visual system

1. **Broadcast / Editorial** — match results, score updates, breaking news and statistics. Clear grid, strong typographic hierarchy, high readability.
2. **High-impact Sports** — player milestones, wickets, goals and records. Athlete-first composition, bold condensed display type, controlled energy.
3. **Minimal / Data-led** — player profiles, comparisons, tables, form and match stats. Consistent alignment, restrained decoration, legible data.
4. **Magazine / Newsroom** — transfer stories, quotes, hot takes, history and Borhan Rants. Editorial typography and distinctive brand voice.

Use the four directions as a system of related design families, not four rigid templates. Keep team colours and photo treatments adaptable.

## Mobile quality bar

- No horizontal page overflow at 320, 360, 390 and 430 CSS px.
- No clipped text, hidden actions, overlapping sticky preview, or controls narrower than their content.
- Comfortable touch targets (aim for at least 44 CSS px).
- Search and category navigation should remain usable without excessive horizontal/vertical scrolling.
- Editing fields, photo library and caption tools should be easy to reach.
- Preview should remain large enough to judge the poster; actions must not dominate the available viewport.
- Respect safe areas, keyboard visibility and reduced-motion preferences.

## Phases

- **Phase 0 — Baseline:** this inventory, branch isolation, visual review checklist and reference captures.
- **Phase 1 — Poster system:** render and classify all cards as Keep / Polish / Redesign; propose options for redesign candidates; modernize in small compatible batches.
- **Phase 2 — Studio UI:** refine hierarchy, picker, editing panels, photo controls, caption and export actions.
- **Phase 3 — Mobile-first:** optimize small-screen layout, navigation, preview, controls and keyboard behavior.
- **Phase 4 — Workflow polish:** reduce friction while preserving all existing capabilities.
- **Phase 5 — QA / release:** test poster families, output sizes, mobile and desktop widths, offline behavior and saved data; open a reviewed PR before any merge.

## Next action

Capture and inspect representative rendered posters from every family (including no-photo, full-photo and cutout cases where supported). Then complete the Keep / Polish / Redesign matrix with visual evidence before making poster renderer changes.
