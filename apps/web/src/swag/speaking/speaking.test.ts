/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { describe, expect, it, vi } from "vitest";

import { applySpeakingAction, parseSpeakingAction, SPEAKING_LIMITS } from "./speaking";
import { SpeakingStore, SpeakingStoreEvent } from "./SpeakingStore";

const ROOM_ID = "!room:example.org";
const ALICE = "@alice:example.org";
const BOB = "@bob:example.org";

describe("parseSpeakingAction", () => {
    it("accepts a well-formed payload", () => {
        expect(parseSpeakingAction({ roomId: ROOM_ID, userIds: [ALICE, BOB], ts: 1000 })).toEqual({
            roomId: ROOM_ID,
            userIds: [ALICE, BOB],
            ts: 1000,
        });
    });

    it("rejects payloads that are not objects", () => {
        expect(parseSpeakingAction(null)).toBeNull();
        expect(parseSpeakingAction("io.element.call.speaking")).toBeNull();
        expect(parseSpeakingAction(undefined)).toBeNull();
    });

    it("rejects a payload without a roomId", () => {
        expect(parseSpeakingAction({ userIds: [ALICE], ts: 1000 })).toBeNull();
    });

    it("rejects a roomId that is not a Matrix room id", () => {
        expect(parseSpeakingAction({ roomId: "room", userIds: [ALICE], ts: 1000 })).toBeNull();
        expect(parseSpeakingAction({ roomId: 42, userIds: [ALICE], ts: 1000 })).toBeNull();
    });

    it("rejects userIds that are not an array", () => {
        expect(parseSpeakingAction({ roomId: ROOM_ID, userIds: ALICE, ts: 1000 })).toBeNull();
        expect(parseSpeakingAction({ roomId: ROOM_ID, ts: 1000 })).toBeNull();
    });

    it("rejects an array containing numbers", () => {
        expect(parseSpeakingAction({ roomId: ROOM_ID, userIds: [ALICE, 42], ts: 1000 })).toBeNull();
    });

    it("truncates an array longer than the limit", () => {
        const userIds = Array.from({ length: SPEAKING_LIMITS.maxUserIds + 1 }, (_, i) => `@user${i}:example.org`);
        const parsed = parseSpeakingAction({ roomId: ROOM_ID, userIds, ts: 1000 });
        expect(parsed?.userIds).toEqual(userIds.slice(0, SPEAKING_LIMITS.maxUserIds));
    });

    it("defaults a missing or NaN ts to the current time", () => {
        vi.spyOn(Date, "now").mockReturnValue(1234);
        expect(parseSpeakingAction({ roomId: ROOM_ID, userIds: [ALICE] })?.ts).toBe(1234);
        expect(parseSpeakingAction({ roomId: ROOM_ID, userIds: [ALICE], ts: NaN })?.ts).toBe(1234);
        vi.restoreAllMocks();
    });

    it("dedupes and drops empty strings", () => {
        const parsed = parseSpeakingAction({ roomId: ROOM_ID, userIds: [ALICE, "", ALICE, BOB, ""], ts: 1000 });
        expect(parsed?.userIds).toEqual([ALICE, BOB]);
    });
});

describe("applySpeakingAction", () => {
    it("ignores a payload for a different room", () => {
        const store = new SpeakingStore();
        const onUpdate = vi.fn();
        store.on(SpeakingStoreEvent.Update, onUpdate);

        expect(applySpeakingAction({ roomId: "!other:example.org", userIds: [ALICE], ts: 1000 }, store, ROOM_ID)).toBe(
            false,
        );
        expect(store.getSpeakingUserIds(ROOM_ID)).toEqual([]);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("applies a payload for the expected room", () => {
        const store = new SpeakingStore();
        const onUpdate = vi.fn();
        store.on(SpeakingStoreEvent.Update, onUpdate);

        expect(applySpeakingAction({ roomId: ROOM_ID, userIds: [ALICE, BOB], ts: 1000 }, store, ROOM_ID)).toBe(true);
        expect(store.getSpeakingUserIds(ROOM_ID)).toEqual([ALICE, BOB]);
        expect(onUpdate).toHaveBeenCalledWith(ROOM_ID);
    });

    it("returns false for a malformed payload", () => {
        const store = new SpeakingStore();
        expect(applySpeakingAction(null, store, ROOM_ID)).toBe(false);
        expect(applySpeakingAction({ roomId: ROOM_ID, userIds: [1], ts: 1000 }, store, ROOM_ID)).toBe(false);
    });
});
