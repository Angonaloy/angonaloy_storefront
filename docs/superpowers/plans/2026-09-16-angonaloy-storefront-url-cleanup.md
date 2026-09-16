# Angonaloy Storefront URL Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale fork URL with `https://angonaloy.shop` in every tracked Angonaloy storefront reference.

**Architecture:** This is a repository-content cleanup, not a runtime routing or deployment change. Documentation points to the canonical public domain, and analytics fixtures retain their existing paths and URL-normalization assertions.

**Tech Stack:** Markdown, TypeScript, Node.js `node:test`, npm.

## Global Constraints

- Modify only the Angonaloy fork; do not change the original merchant's project, Vercel account, DNS, or domain settings.
- Retain fixture path, query, and hash coverage.
- Do not introduce a new source of truth for URLs or change runtime behavior.
- Run the storefront's prescribed type-check, tests, and build before completion.

---

### Task 1: Replace the stale fork URL and verify its absence

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-08-29-storefront-responsive-image-pipeline.md`
- Modify: `client/src/lib/google-analytics.test.ts`
- Test: `client/src/lib/google-analytics.test.ts`

**Interfaces:**
- Consumes: the approved canonical URL `https://angonaloy.shop`.
- Produces: documentation and analytics fixtures that use the canonical public URL exclusively.

- [ ] **Step 1: Run the red repository-hygiene check**

Run a tracked-file search for the deprecated fork hostname and invert the result so it fails while references remain.

```bash
legacy_host="$(printf '%s.%s' mangoloverbd vercel.app)"
if git grep -n -I -F "$legacy_host"; then
  echo "Deprecated fork hostname is still tracked"
  exit 1
fi
```

Expected: the check fails and reports the ten existing references.

- [ ] **Step 2: Replace only the approved references**

Change the two live-site documentation links, their adjacent Vercel project labels, the historical verification link, and the seven analytics fixture/expectation URLs to `https://angonaloy.shop`. Keep their path, query, and hash portions unchanged.

| Files | Exact replacement |
|---|---|
| `README.md`, `CLAUDE.md` | Canonical public URL: `https://angonaloy.shop`; Vercel project: `angonaloy-storefront` |
| Historical plan | Canonical public URL: `https://angonaloy.shop` |
| `client/src/lib/google-analytics.test.ts` | Canonical public URL plus the existing fixture path, query, or hash |

- [ ] **Step 3: Run the green targeted checks**

Run:

```bash
node --test client/src/lib/google-analytics.test.ts
legacy_host="$(printf '%s.%s' mangoloverbd vercel.app)"
! git grep -n -I -F "$legacy_host"
```

Expected: the analytics suite passes and the search returns no matches.

- [ ] **Step 4: Run the required storefront verification**

Run:

```bash
npm run check
node --test client/src/pages/home.test.ts
node --test client/src/lib/storefront-products.test.ts
npm run build
git status --short
```

Expected: all checks pass and the build does not leave an unexpected generated-catalog change.

- [ ] **Step 5: Commit the reviewed cleanup**

```bash
git add README.md CLAUDE.md docs/superpowers client/src/lib/google-analytics.test.ts
git commit -m "chore: replace stale storefront URL references"
```
