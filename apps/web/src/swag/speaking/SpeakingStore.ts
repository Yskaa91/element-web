/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { TypedEventEmitter } from "matrix-js-sdk/src/matrix";

/**
 * The events emitted by {@link SpeakingStore}.
 */
export const SpeakingStoreEvent = { Update: "speaking_update" } as const;

type SpeakingStoreEventName = (typeof SpeakingStoreEvent)[keyof typeof SpeakingStoreEvent];

/**
 * You must provide one of these if you listen to {@link SpeakingStoreEvent}
 * emitted by {@link SpeakingStore}. It specifies how to handle each type of
 * event.
 */
type SpeakingStoreEventHandlerMap = {
    [SpeakingStoreEvent.Update]: (roomId: string) => void;
};

/**
 * The speaking state for one room: the ids last applied and the `ts` they came
 * with, so out-of-order updates can be ignored.
 */
interface SpeakingEntry {
    userIds: readonly string[];
    ts: number;
}

/** Shared empty result of {@link SpeakingStore.getSpeakingUserIds}, so React sees a stable reference. */
const EMPTY_USER_IDS: readonly string[] = [];

function sameIds(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * Tracks which users are currently speaking in each call room, as reported by
 * the Element Call widget via the `io.element.call.speaking` widget action (see
 * `applySpeakingAction` in `./speaking`).
 */
export class SpeakingStore extends TypedEventEmitter<SpeakingStoreEventName, SpeakingStoreEventHandlerMap> {
    public static readonly instance = new SpeakingStore();

    private entries = new Map<string, SpeakingEntry>();

    /**
     * Get the speaking user ids for a room. The result is a stable reference
     * until the speaking set changes, so React can compare it cheaply.
     *
     * @param roomId The id of the room the call is taking place in.
     * @returns The speaking user ids, or a shared empty array for an unknown room.
     */
    public getSpeakingUserIds(roomId: string): readonly string[] {
        return this.entries.get(roomId)?.userIds ?? EMPTY_USER_IDS;
    }

    /**
     * Record the speaking user ids for a room.
     *
     * `postMessage` ordering is not guaranteed, so an update older than the last
     * applied one for the room is ignored. Emits
     * {@link SpeakingStoreEvent.Update} with the room id only when the id set
     * changes.
     *
     * @param roomId The id of the room the call is taking place in.
     * @param userIds The ids of the users currently speaking.
     * @param ts The time the payload was produced, in ms since epoch.
     */
    public setSpeaking(roomId: string, userIds: readonly string[], ts: number): void {
        const entry = this.entries.get(roomId);
        if (entry && ts < entry.ts) return;
        if (entry && sameIds(entry.userIds, userIds)) {
            // Same set: keep the previous array reference and only refresh ts,
            // so newer heartbeats do not trigger re-renders.
            this.entries.set(roomId, { userIds: entry.userIds, ts });
            return;
        }
        this.entries.set(roomId, { userIds, ts });
        this.emit(SpeakingStoreEvent.Update, roomId);
    }

    /**
     * Clear the speaking state for a room, e.g. when its call ends. Emits
     * {@link SpeakingStoreEvent.Update} if there was anything to clear.
     *
     * @param roomId The id of the room the call was taking place in.
     */
    public clear(roomId: string): void {
        if (this.entries.delete(roomId)) this.emit(SpeakingStoreEvent.Update, roomId);
    }
}
