# Swag anchors — shared components

The swag rule: every feature lives in its own directory, `apps/web/src/swag/<feature>/` in Element Web
and `src/swag/<feature>/` in Element Call. Upstream files are touched only by *anchors*: a
registration line, a render slot, an item field. No anchor hunk should be larger than about 20 lines.
This file records every anchor and why it exists, and is updated in the same commit as the anchor.

## Where this module lives

The voice presence row lives in `packages/shared-components/src/swag/voice-presence/`, not in
`apps/web/src/swag/voice-presence/`.

That is a deliberate deviation from the layout in `CONTRIBUTING-SWAG.md`. The room list tile that has
to render the row is
`packages/shared-components/src/room-list/VirtualizedRoomListView/RoomListItemWrapper/RoomListItemView/`,
a shared component in the published `@element-hq/web-shared-components` package. A component living
under `apps/web` cannot be rendered by it, so the row has to live in the same package as the tile. The
row still follows the rest of the swag rule: its own directory, its own tests, and upstream files
touched only by anchors.

This is the first swag feature in Element Web, so there is no `swag/registry.ts` yet. In the shared
package the equivalent registration point is the package index, and the row's only entry there is the
single export below.

## Anchors added by phase 1 (voice presence in the room list)

| Upstream file                                                              | Anchor                                                                                                                    | Why                                                                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared-components/src/index.ts`                                   | `export * from "./swag/voice-presence/VoicePresenceRow";`                                                                  | Publishes `CallParticipant` so the app's room list view model can type the participants it puts on the tile item.                                    |
| `.../RoomListItemView/RoomListItemView.tsx`                                | `import { type CallParticipant }` and `callParticipants?: CallParticipant[]` on `RoomListItemViewSnapshot`                 | The tile's view-model shape needs somewhere to carry the people who are in the room's call.                                                          |
| `.../RoomListItemView/RoomListItemView.tsx`                                | `onCallParticipantsClick?: () => void` on `RoomListItemViewActions`                                                        | The row is clickable, and the tile wires its clicks through its actions interface. Optional, so a tile without a call needs no such action.           |
| `.../RoomListItemView/RoomListItemView.tsx`                                | `getA11yLabel` takes the item's `callParticipants` and appends `In call: <names>`                                              | The row sits inside the item's own button, and a button's label replaces the accessible name of its subtree, so the names have to be announced by the item rather than by the row. Rooms without a call keep exactly the label they had before. |
| `.../RoomListItemView/RoomListItemContent.tsx`                             | `import { VoicePresenceRow }` and the one-expression render slot after the message preview                                 | Renders the row. This is the only place the shared package knows the feature exists.                                                                 |
| `apps/web/src/viewmodels/room-list/RoomListItemViewModel.ts`               | `generateItemSync` maps `call.participants` to `callParticipants`                                                          | The tile item is generated here, and `CallStore.instance.getCall` was already read for the call indicator, so no new lookup is introduced.            |
| `apps/web/src/viewmodels/room-list/RoomListItemViewModel.ts`               | `onCallParticipantsChanged` now always rebuilds the item                                                                  | It used to short-circuit while a call already had participants, because only presence or absence mattered. The row shows exactly who is in the call, so every participant change has to rebuild the item. |
| `apps/web/src/viewmodels/room-list/RoomListItemViewModel.ts`               | `onCallParticipantsClick`                                                                                                 | Opens the room and joins the call through the same `placeCall` path as the room header's join button.                                                 |

`apps/web/src/viewmodels/room-list/RoomListItemViewModel.test.ts` and
`.../RoomListItemView/RoomListItemView.test.tsx` are extended by the same change; they are tests, not
anchors.

## The row is decorative, the item announces

The row is hidden from the accessibility tree and has no keyboard handler. It is a mouse-only shortcut
into the item's own button, and a focusable control inside a button would be invalid, so the item is
the control that assistive tech and the keyboard use. `callParticipantsLabel()` in the swag module
builds the string that both the row's `title` tooltip and the item's accessible name use, so the two
cannot drift apart. Because the row is `aria-hidden`, `jsx-a11y/click-events-have-key-events` does not
fire on its click handler and no suppression comment is needed; if that ever stops being true, the
rationale comment on the element says why the handler is mouse-only.

## Rebasing

Conflicts should land in the anchors above and nowhere else. The swag module itself should not
conflict. If upstream refactors the tile content, the render slot is the single place to fix.
