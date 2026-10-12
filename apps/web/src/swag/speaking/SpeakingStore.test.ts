/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { describe, expect, it, vi } from "vitest";

import { SpeakingStore, SpeakingStoreEvent } from "./SpeakingStore";

const ROOM_ID = "!room:example.org";
const ALICE = "@alice:example.org";
const BOB = "@bob:example.org";

describe("SpeakingStore", () => {
    it("returns a stable empty array for an unknown room", () => {
        const store = new SpeakingStore();
        expect(store.getSpeakingUserIds(ROOM_ID)).toEqual([]);
        expect(store.getSpeakingUserIds(ROOM_ID)).toBe(store.getSpeakingUserIds(ROOM_ID));
    });

    it("returns the ids set for a room", () => {
        const store = new SpeakingStore();
        store.setSpeaking(ROOM_ID, [ALICE, BOB], 1000);
        expect(store.getSpeakingUserIds(ROOM_ID)).toEqual([ALICE, BOB]);
    });

    it("emits Update once when the same set is set twice", () => {
        const store = new SpeakingStore();
        const onUpdate = vi.fn();
        store.on(SpeakingStoreEvent.Update, onUpdate);

        store.setSpeaking(ROOM_ID, [ALICE, BOB], 1000);
        store.setSpeaking(ROOM_ID, [ALICE, BOB], 2000);

        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith(ROOM_ID);
    });

    it("ignores an update with an older ts", () => {
        const store = new SpeakingStore();
        const onUpdate = vi.fn();
        store.on(SpeakingStoreEvent.Update, onUpdate);

        store.setSpeaking(ROOM_ID, [ALICE], 2000);
        store.setSpeaking(ROOM_ID, [BOB], 1000);

        expect(store.getSpeakingUserIds(ROOM_ID)).toEqual([ALICE]);
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("clears a room and emits", () => {
        const store = new SpeakingStore();
        const onUpdate = vi.fn();
        store.on(SpeakingStoreEvent.Update, onUpdate);

        store.setSpeaking(ROOM_ID, [ALICE], 1000);
        store.clear(ROOM_ID);

        expect(store.getSpeakingUserIds(ROOM_ID)).toEqual([]);
        expect(onUpdate).toHaveBeenLastCalledWith(ROOM_ID);
        expect(onUpdate).toHaveBeenCalledTimes(2);
    });
});
