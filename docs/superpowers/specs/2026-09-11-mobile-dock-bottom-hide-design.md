# Mobile Dock Bottom-of-Page Hide Design

## Goal

Hide the mobile quick-order dock when a visitor reaches the bottom of a campaign page, so the dock does not cover footer content or remain redundant beside the checkout/footer area.

## Scope

Apply the behavior to the global mobile navigation dock rendered by `client/src/components/layout.tsx`.

Desktop behavior is out of scope and must remain unchanged. The docks already use a desktop media query that removes them at `min-width: 768px`.

## Behavior

The dock is hidden when the viewport has reached the bottom of the document.

The bottom check uses the document scroll position with a small tolerance so mobile browser rounding and safe-area changes do not prevent the state from activating. The listener is passive and cleaned up on unmount.

## Animation

Wrap the global dock in a Framer Motion `motion.nav`. The visible state sits at `y: 0`; the hidden state translates down by `110%`. The existing `md:hidden` class remains unchanged, so desktop navigation is unaffected. Framer Motion's reduced-motion behavior is enabled so users who request reduced motion do not receive the slide animation.

The dock remains mounted while hidden so navigation state and focus behavior are preserved, while its animated transform is owned by Framer Motion.

## Testing

Add source-level tests for the layout component to verify:

- bottom-of-page detection is present;
- the dock uses Framer Motion and a hidden/visible `y` animation;
- the desktop-only `md:hidden` behavior remains present.
