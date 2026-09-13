# Subtle Homepage Reveal Design

## Goal

Make homepage section reveals feel calmer and more refined by removing the blur effect.

## Design

Keep the existing `useReveal` IntersectionObserver trigger, Framer Motion variants, section timing, and fallback behavior. Change only the shared reveal variants from blur plus a large percentage translation to opacity with a small `translateY(12px)` lift that settles at `translateY(0)`.

## Scope

The yellow heading highlight animation and mobile layout remain unchanged.
