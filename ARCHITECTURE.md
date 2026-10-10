# Architecture & UI conventions

## Folder structure
```
src/
  components/
    ui/        design-system primitives (Button, Card, Badge, Modal, Tabs, Field…) - no business logic
    common/    app-level building blocks (Page, PageHeader, Section, StatCard, EmptyState)
    layout/    shell: Sidebar, Navbar, BottomNav, MainLayout
  features/<name>/
    index.js          default-exports the page (what App.jsx imports)
    <Name>Page.jsx    CONTAINER: data, state, handlers; renders only presentational parts
    components/       presentational pieces + compound components for this feature
    hooks/            feature hooks (queries, optimistic mutations)
    lib/              pure helpers/constants for the feature
  hooks/       cross-feature hooks (useReveal, useCountUp, useOptimistic, useFirestore…)
  lib/         utils, motion (GSAP), api/pgstore clients
  content/     static copy
```

## Patterns
- **Container / presentational** - a `*Page` owns data + handlers; children get props and render.
- **Compound components** - `Card.Header/Title/Body`, `Tabs.List/Trigger/Panel`; build feature widgets the same way.
- **Optimistic updates** - mutations call `useOptimisticMutation().run({ optimistic, commit, rollback })`.
- **Motion** - GSAP only, via `lib/motion` + `useReveal` / `useCountUp`. Mark elements `data-reveal` inside `<Page>`. Always respects reduced motion.
- **Styling** - Tailwind tokens (`navy` = maroon, `saffron`, `marigold`, `paper`, `line`, `ink`). Use `cn()` and `cva`. No inline hex.
- Files stay under ~300 lines; split by responsibility.
