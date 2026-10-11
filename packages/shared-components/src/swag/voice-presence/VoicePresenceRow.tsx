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
 */
export const VoicePresenceRow: React.FC<VoicePresenceRowProps> = ({ participants, onClick, max = 3 }) => {
    if (participants.length === 0) return null;

    const shown = participants.slice(0, max);
    const overflow = participants.length - shown.length;
    // The row is a summary: it names everyone in the call, including the people
    // hidden behind the +N chip, and the avatars themselves are decorative.
    const label = `In call: ${participants.map((participant) => participant.name).join(", ")}`;

    return (
        <span
            className={styles.row}
            aria-label={label}
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
            {overflow > 0 && <span className={styles.overflow}>+{overflow}</span>}
        </span>
    );
};
