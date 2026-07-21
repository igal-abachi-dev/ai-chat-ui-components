# Contributing

1. Use Node 22 LTS or newer.
2. Run `npm ci`.
3. Create a focused branch and include tests for behavior changes.
4. Run `npm run check` before opening a pull request.
5. Keep transport, persistence, and product-specific tool UI outside the core
   unless the API is broadly reusable.

The virtualized transcript must remain a non-live region. Announce coarse status
through the dedicated status element instead of adding `aria-live` to the list.
