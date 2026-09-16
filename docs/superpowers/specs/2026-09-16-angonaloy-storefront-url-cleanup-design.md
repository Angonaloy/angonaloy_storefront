# Angonaloy Storefront URL Cleanup Design

## Goal

Use `https://angonaloy.shop` as the canonical public URL in the Angonaloy storefront fork.

## Decision

Replace the stale fork-host references in repository documentation and analytics test fixtures. Preserve each fixture's path, query, and hash so the tests continue to validate URL normalization behavior.

## Scope

- Update the storefront guide and README live-site references, including their adjacent Vercel project labels.
- Update the historical responsive-image verification reference.
- Update analytics test fixtures and their expected URLs.
- Do not change DNS, Vercel domain settings, the original merchant's repository, its Vercel account, or unrelated Mango Lover wording.

## Validation

- No tracked file contains the deprecated fork hostname.
- The Google Analytics test suite passes with the new canonical URL.
- Type-check, required storefront tests, and production build pass without generated catalog changes.
