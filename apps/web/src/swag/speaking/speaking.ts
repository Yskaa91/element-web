/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { type SpeakingStore } from "./SpeakingStore";

/**
 * The widget action Element Call sends to report which users are currently
 * speaking in a call. Mirrors `src/speaking/speaking.ts` in the Element Call
 * fork.
 */
export const SPEAKING_ACTION = "io.element.call.speaking";

/**
 * Bounds for a parsed {@link SPEAKING_ACTION} payload. The payload arrives over
 * `postMessage` from a widget, so it is never trusted.
 */
export const SPEAKING_LIMITS = { maxUserIds: 256 };

/**
 * The payload of {@link SPEAKING_ACTION}.
 */
export interface SpeakingActionData {
    roomId: string;
    userIds: string[];
    ts: number;
}

/**
 * Validates a {@link SPEAKING_ACTION} payload.
 *
 * The payload arrives over `postMessage` from a widget, so every field is
 * checked: the room id must be a Matrix room id, every speaking id must be a
 * non-empty string, duplicates and empty strings are dropped and the id list is
 * bounded by {@link SPEAKING_LIMITS}. A missing or NaN `ts` defaults to the
 * current time. Never throws; a malformed payload gives `null`.
 *
 * @param data The raw widget action payload.
 * @returns The validated payload, or `null` if it is malformed.
 */
export function parseSpeakingAction(data: unknown): SpeakingActionData | null {
    if (typeof data !== "object" || data === null) return null;
    const { roomId, userIds, ts } = data as Partial<Record<keyof SpeakingActionData, unknown>>;

    // Matrix room ids look like `!opaque` or `!localpart:domain`.
    if (typeof roomId !== "string" || !roomId.startsWith("!") || roomId.length < 2) return null;

    if (!Array.isArray(userIds)) return null;
    const seen = new Set<string>();
    for (const userId of userIds) {
        if (typeof userId !== "string") return null;
        if (userId.length > 0) seen.add(userId);
    }

    return {
        roomId,
        userIds: [...seen].slice(0, SPEAKING_LIMITS.maxUserIds),
        ts: typeof ts === "number" && Number.isFinite(ts) ? ts : Date.now(),
    };
}

/**
 * Validates a {@link SPEAKING_ACTION} payload and applies it to the store.
 *
 * A payload for a different room than `expectedRoomId` is ignored, so a widget
 * cannot report speaking state for a room it is not in.
 *
 * @param data The raw widget action payload.
 * @param store The store to apply the payload to.
 * @param expectedRoomId The room id the widget belongs to.
 * @returns Whether the payload was well-formed and for the expected room.
 */
export function applySpeakingAction(data: unknown, store: SpeakingStore, expectedRoomId: string): boolean {
    const parsed = parseSpeakingAction(data);
    if (!parsed || parsed.roomId !== expectedRoomId) return false;
    store.setSpeaking(parsed.roomId, parsed.userIds, parsed.ts);
    return true;
}
