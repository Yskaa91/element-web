/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { describe, expect, it, vi } from "vitest";
import { EventType, type MatrixClient } from "matrix-js-sdk/src/matrix";

import { SOUNDBOARD_EVENT_TYPE, soundboardCapabilities, spaceParentRoomIds } from "./capabilities";

const ROOM_ID = "!call:example.org";
const SPACE_ID = "!space:example.org";

function clientWithParents(
    parents: (string | { roomId: string; canonical: boolean })[],
): MatrixClient {
    const events = parents.map((parent) => {
        const { roomId, canonical } = typeof parent === "string" ? { roomId: parent, canonical: undefined } : parent;
        return {
            getStateKey: () => roomId,
            getContent: () => (canonical === undefined ? {} : { canonical }),
        };
    });
    const state = { getStateEvents: vi.fn(() => events) };
    const room = { getLiveTimeline: () => ({ getState: () => state }) };
    return { getRoom: vi.fn(() => room) } as unknown as MatrixClient;
}

function clientWithoutRoom(): MatrixClient {
    return { getRoom: vi.fn(() => null) } as unknown as MatrixClient;
}

describe("spaceParentRoomIds", () => {
    it("reads the space room ids from the m.space.parent state keys", () => {
        expect(spaceParentRoomIds(clientWithParents([SPACE_ID]), ROOM_ID)).toEqual([SPACE_ID]);
    });

    it("returns nothing when the room is unknown", () => {
        expect(spaceParentRoomIds(clientWithoutRoom(), ROOM_ID)).toEqual([]);
        expect(spaceParentRoomIds(clientWithParents([SPACE_ID]), undefined)).toEqual([]);
    });

    it("ignores empty state keys", () => {
        expect(spaceParentRoomIds(clientWithParents(["", SPACE_ID]), ROOM_ID)).toEqual([SPACE_ID]);
    });

    it("lists the canonical parent first", () => {
        const parents = spaceParentRoomIds(
            clientWithParents([
                { roomId: "!other:example.org", canonical: false },
                { roomId: SPACE_ID, canonical: true },
            ]),
            ROOM_ID,
        );
        expect(parents[0]).toBe(SPACE_ID);
    });

    it("keeps the room's own order when none is canonical", () => {
        const parents = spaceParentRoomIds(
            clientWithParents([
                { roomId: "!first:example.org", canonical: false },
                { roomId: SPACE_ID, canonical: false },
            ]),
            ROOM_ID,
        );
        expect(parents).toEqual(["!first:example.org", SPACE_ID]);
    });
});

describe("soundboardCapabilities", () => {
    it("always asks for the space parent, the board's state and the upload", () => {
        const capabilities = soundboardCapabilities(clientWithParents([]), ROOM_ID);
        expect(capabilities).toEqual([
            `org.matrix.msc2762.receive.state_event:${EventType.SpaceParent}`,
            `org.matrix.msc2762.receive.state_event:${SOUNDBOARD_EVENT_TYPE}`,
            `org.matrix.msc2762.send.state_event:${SOUNDBOARD_EVENT_TYPE}`,
            "org.matrix.msc4039.upload_file",
        ]);
    });

    it("adds the space room's timeline, and only that room's", () => {
        const capabilities = soundboardCapabilities(clientWithParents([SPACE_ID]), ROOM_ID);
        expect(capabilities).toContain(`org.matrix.msc2762.timeline:${SPACE_ID}`);
        expect(capabilities.some((capability) => capability.endsWith("timeline:*"))).toBe(false);
        expect(capabilities.some((capability) => capability.endsWith(`timeline:${ROOM_ID}`))).toBe(false);
    });

    it("adds a timeline for every parent space", () => {
        const capabilities = soundboardCapabilities(clientWithParents([SPACE_ID, "!other:example.org"]), ROOM_ID);
        expect(capabilities).toContain(`org.matrix.msc2762.timeline:${SPACE_ID}`);
        expect(capabilities).toContain("org.matrix.msc2762.timeline:!other:example.org");
    });

    it("adds no timeline when the room has no space parent", () => {
        const capabilities = soundboardCapabilities(clientWithParents([]), ROOM_ID);
        expect(capabilities.some((capability) => capability.includes("timeline:"))).toBe(false);
    });
});
