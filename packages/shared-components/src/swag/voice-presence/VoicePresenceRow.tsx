/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import React from "react";
import { Avatar } from "@vector-im/compound-web";

import styles from "./VoicePresenceRow.module.css";

/**
 * A person in a room's ongoing call.
 */
export interface CallParticipant {
    /** The Matrix user ID of the participant. */
    userId: string;
    /** The display name of the participant. */
    name: string;
    /** The HTTP URL of the participant's avatar, if they have one. */
    avatarUrl?: string;
}

/**
 * Summarise the people in a call, in order, as `In call: Alice, Bob`.
 *
 * The room list item's accessible name uses this, because the item's own button replaces the
 * accessible name of everything inside it, and the row's tooltip uses it too, so the two can
 * never drift apart.
 */
export function callParticipantsLabel(participants: CallParticipant[]): string {
    return `In call: ${participants.map((participant) => participant.name).join(", ")}`;
}

/**
 * Props for {@link VoicePresenceRow}.
 */
export interface VoicePresenceRowProps {
    /** The people in the room's ongoing call, in the order they should be shown. */
    participants: CallParticipant[];
    /** Called when the row is clicked. */
    onClick?: () => void;
    /** The number of avatars to show before the rest are collapsed into a `+N` chip. */
    max?: number;
}

/**
 * Shows the avatars of the people in a room's ongoing call, so the room list can
 * say who is in a call without the room being opened. Renders nothing when the
 * call is empty.
 *
 * The row is decorative for the accessible name: it is hidden from the
 * accessibility tree and the room list item announces who is in the call (see
 * `getA11yLabel`), so the names are not duplicated.
 */
export const VoicePresenceRow: React.FC<VoicePresenceRowProps> = ({ participants, onClick, max = 3 }) => {
    if (participants.length === 0) return null;

    const shown = participants.slice(0, max);
    const overflow = participants.length - shown.length;
    const label = callParticipantsLabel(participants);

    return (
        // The row is a mouse-only shortcut into the room list item's own button. It deliberately has
        // no keyboard handler: making it focusable would nest an interactive element inside the
        // item's button, which is invalid, and the item itself is already reachable by keyboard.
        // aria-hidden keeps the row out of the accessibility tree, which is also why
        // jsx-a11y/click-events-have-key-events does not fire on the click below.
        <span
            className={styles.row}
            title={label}
            aria-hidden={true}
            onClick={(e) => {
                // The row sits inside the room list item's own button, so the click must not
                // bubble: the tile would otherwise open the room a second time.
                e.stopPropagation();
                onClick?.();
            }}
        >
            {shown.map((participant) => (
                <Avatar
                    key={participant.userId}
                    className={styles.avatar}
                    id={participant.userId}
                    name={participant.name}
                    src={participant.avatarUrl}
                    size="20px"
                    aria-hidden={true}
                />
            ))}
            {overflow > 0 && <span className={styles.overflow} aria-hidden={true}>+{overflow}</span>}
        </span>
    );
};
