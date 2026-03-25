# Starfield Spec

## Current Product Rules

- The starfield starts at the `For You` location on load.
- `For You` is the center of the starfield and should resolve to `50,50`.
- Clicking `For You` returns the viewport to that center location.
- Clicking a friend moves the viewport to that friend's `For You` area.
- Clicking a genre from the feed stats panel does not move the viewport.
- A genre click from the feed stats panel only locks the wheel/feed to that genre until the user scrolls again.
- Random viewport jumps for genre clicks are not allowed.
- Random dot placement and random post assignment are acceptable for demo quality.
- Star dots do not need to map to the same posts between sessions.
- Desktop is the priority.
- The product is intended to be desktop-only; mobile support is not a requirement.
- The target quality bar is good enough to demo, not full production hardening.

## UI Rules

- The genre wheel should sit visually under the `Load Feed` control.
- The wheel may be visually offset for layout purposes, but its data should still reflect the active viewport location.
- The wheel should initialize from the `For You` location on first load.

## Open Product Note

- "Desktop-only" is now a requirement, but this is broader than the starfield component itself and should be enforced at the app/shell level, not only inside the wheel or container.
