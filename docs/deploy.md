# Deploying the studio (owner action)

The studio is a fully static export (`driver_tree_studio/out/`). Nothing in this repository
deploys automatically; choosing the host account, project name and domain is the owner's call
(ADR-0008 open decision 1, ADR-0010).

## Vercel (config committed: `driver_tree_studio/vercel.json`)

1. Vercel → *Add New Project* → import this repository.
2. **Root Directory:** `driver_tree_studio`. Framework preset: *Other* (the config sets
   `framework: null`, `npm ci`, `npm run build`, output `out`, clean URLs).
3. Environment variable `NEXT_PUBLIC_SITE_URL` = the final URL (used for Open Graph tags).
4. Deploy. Check `/`, `/embed`, and that a *Share link* URL opens with the same numbers.

## Any other static host

```bash
cd driver_tree_studio && npm ci && NEXT_PUBLIC_SITE_URL=https://your.domain npm run build
# upload out/ ; serve *.html without the extension for /embed (clean URLs)
```

## Before a public, name-attached launch

ADR-0004's launch gate requires that no modeled edge rests on an illustrative grade alone.
Two seed edges are still ILLUSTRATIVE (flagged in the UI), so the gate is not met yet.
