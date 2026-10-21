# Cart layout update

The cart now follows the requested checkout hierarchy without changing Finch navigation behavior:

1. Order / Your order details
2. Popular pairings — generated from the first cart restaurant's own menu, excluding items already in the cart
3. Order summary
4. Items subtotal
5. Delivery fee
6. Estimated taxes & fees
7. Promotional discount
8. Estimated Total
9. Continue

Pairing `+` buttons call the existing `addItem` path directly and pairing focus sets that item as the Finch menu context. Navigation client-tool code was not changed.
