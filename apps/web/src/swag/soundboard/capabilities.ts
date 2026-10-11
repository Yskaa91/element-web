/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Direction, EventType, type MatrixClient } from "matrix-js-sdk/src/matrix";
import {
    EventDirection,
    MatrixCapabilities,
    WidgetEventCapability,
    type Capability,
} from "matrix-widget-api";

/**
 * The soundboard's board state event, in the space room, with the empty state
 * key. Mirrors `src/swag/soundboard/board.ts` in the Element Call fork.
 */
export const SOUNDBOARD_EVENT_TYPE = "io.element.call.soundboard";

/**
 * Finds the spaces a room is a child of.
 *
 * A room's `m.space.parent` state events are keyed by the space room id, so the
 * state key is the space room id.
 */
export function spaceParentRoomIds(client: MatrixClient, roomId: string | undefined): string[] {
    if (!roomId) return [];
    const room = client.getRoom(roomId);
    if (!room) return [];
    const state = room.getLiveTimeline().getState(Direction.Forward);
    if (!state) return [];
    return state
        .getStateEvents(EventType.SpaceParent)
        .map((event) => event.getStateKey())
        .filter((stateKey): stateKey is string => typeof stateKey === "string" && stateKey.length > 0);
}

/**
 * The capabilities a call widget needs for the soundboard, beyond its own set.
 *
 * The board lives in the space room, so the widget has to be granted that
 * room's timeline specifically — never `Symbols.AnyRoom`, which would grant it
 * every room the user is in. A room with no space parent gets no timeline
 * capability for any room other than its own.
 *
 * `send.state_event` is included because the widget writes the board itself;
 * without it `ClientWidgetApi` refuses the send and the board would be
 * read-only.
 */
export function soundboardCapabilities(client: MatrixClient, roomId: string | undefined): Capability[] {
    const capabilities: Capability[] = [
        WidgetEventCapability.forStateEvent(EventDirection.Receive, EventType.SpaceParent).raw,
        WidgetEventCapability.forStateEvent(EventDirection.Receive, SOUNDBOARD_EVENT_TYPE).raw,
        WidgetEventCapability.forStateEvent(EventDirection.Send, SOUNDBOARD_EVENT_TYPE).raw,
        MatrixCapabilities.MSC4039UploadFile,
    ];
    for (const spaceRoomId of spaceParentRoomIds(client, roomId)) {
        capabilities.push(`org.matrix.msc2762.timeline:${spaceRoomId}`);
    }
    return capabilities;
}
