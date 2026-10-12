# Swag anchors — element web

The swag rule: every feature lives in its own directory, `apps/web/src/swag/<feature>/` in Element Web
and `src/swag/<feature>/` in Element Call. Upstream files are touched only by *anchors*: a
registration line, a render slot, an item field. No anchor hunk should be larger than about 20 lines.
This file records every anchor and why it exists, and is updated in the same commit as the anchor.

## Where the swag code lives

Element Web's swag code lives in two places:

- `apps/web/src/swag/` for host logic (widget actions, stores, view models),
- `packages/shared-components/src/swag/` for rendering (views and their tests).

The rendering half lives in the shared package for the reason recorded in
`packages/shared-components/src/swag/anchors.md`: a shared component cannot import from `apps/web`,
so anything a shared component renders has to live in the same package.

## Anchors added by phase 3 (speaking ring)

| Upstream file                                | Anchor                                                                | Why                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/models/Call.ts` (`ElementCall.start()`) | `widgetApi.on(\`action:${SPEAKING_ACTION}\`, this.onSpeaking);`                  | Registers the handler for the `io.element.call.speaking` widget action, so the widget's updates are handled instead of erroring as an unknown action.           |
| `apps/web/src/models/Call.ts` (`onSpeaking`) | The `onSpeaking` handler                                              | Acks the action so the widget gets no "unknown action" error, and applies the payload to `SpeakingStore` for this call's room via `applySpeakingAction`.        |
| `apps/web/src/models/Call.ts` (`ElementCall.close()`) | `this.widgetApi!.off(\`action:${SPEAKING_ACTION}\`, this.onSpeaking);` and `SpeakingStore.instance.clear(this.roomId);` | Unregisters the handler when the call closes, and clears the speaking store. `close()` also covers client-initiated `disconnect()`. |
| `apps/web/src/models/Call.ts` (`onHangup`)   | `SpeakingStore.instance.clear(this.roomId);`                           | A widget-initiated hangup must leave no speaking ring behind.                                                                                                   |
| `apps/web/src/models/Call.ts` (`destroy()`)  | `SpeakingStore.instance.clear(this.roomId);`                           | Backstop for teardown paths that never hit `close()`, such as a call ending with its MatrixRTC session.                                                          |

| `apps/web/src/vector/index.ts` | `import "../swag/theme/swag-theme.css"` (plus its comment) | Household theme override (dark look, cyan accent). Plain unlayered CSS beats the layered theme bundles at any specificity and any load order; the `body.cpd-theme-dark` scope keeps light and high-contrast themes untouched. |
