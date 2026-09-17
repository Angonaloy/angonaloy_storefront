# Delivery Charge Selection Design

## Goal

Prevent a customer from placing a paid-delivery order without explicitly selecting a delivery zone.

## Behavior

- Paid-delivery checkout opens with no delivery option selected.
- The customer must select either Inside Dhaka (৳80) or Outside Dhaka (৳120).
- Submitting without a selection is rejected with the existing delivery-charge validation message.
- Orders meeting the existing ৳2600 free-delivery threshold continue to receive ৳0 automatically, as the only available delivery option.
- Delivery pricing sent to the order API, abandoned-cart capture, totals, and analytics remains unchanged after selection.

## Implementation

Update `client/src/components/order-dialog.tsx` so the delivery charge state starts at `null` and resets to `null` whenever a paid-delivery dialog is opened. Preserve the existing free-delivery effect, which changes the state to `0` for qualifying orders. Preserve the existing `placeOrder` guard that rejects `null` delivery charges.

## Testing

- Add a source-level regression test for the null initial/reset state and existing null submit guard.
- Run the storefront test suite and production build.
