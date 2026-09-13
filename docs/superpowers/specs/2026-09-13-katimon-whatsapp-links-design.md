# Katimon WhatsApp Link Design

## Goal

Ensure every WhatsApp action on `/step/katimon-mango` opens a WhatsApp conversation with the message `কাটিমন আম | Katimon Mango অর্ডার করতে চাই`, without changing WhatsApp behavior on other campaign pages.

## Design

- Add a Katimon-specific WhatsApp href constant beside the existing campaign content constants.
- Build the href with `encodeURIComponent` so Bengali text is transferred reliably.
- Use the Katimon href for the Katimon header icon, hero WhatsApp CTA, checkout support action, and footer WhatsApp button.
- Keep the hero gold CTA and package buttons as smooth-scroll links to `#order`.
- Keep the existing Kalojira shared constants and all other campaign messages unchanged.

## Verification

- Add or update source-level tests to assert the exact Bengali message and the Katimon page's WhatsApp CTA href wiring.
- Run the storefront TypeScript check and production build.
- Confirm no other campaign content constants are changed.
