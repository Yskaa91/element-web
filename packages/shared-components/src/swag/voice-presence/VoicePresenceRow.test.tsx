/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import React from "react";
import { render, screen } from "@test-utils";
import { describe, it, expect, vi } from "vitest";

import { VoicePresenceRow, type CallParticipant } from "./VoicePresenceRow";

function participant(name: string, avatarUrl?: string): CallParticipant {
    return { userId: `@${name.toLowerCase()}:server`, name, avatarUrl };
}

describe("<VoicePresenceRow />", () => {
    it("renders an avatar for each participant", () => {
        const { container } = render(
            <VoicePresenceRow participants={[participant("Alice"), participant("Bob"), participant("Carol")]} />,
        );

        expect(container.querySelectorAll('[role="img"]')).toHaveLength(3);
    });

    it("shows at most three avatars and collapses the rest into a +N chip", () => {
        const participants = [
            participant("Alice"),
            participant("Bob"),
            participant("Carol"),
            participant("Dave"),
            participant("Erin"),
        ];
        const { container } = render(<VoicePresenceRow participants={participants} />);

        expect(container.querySelectorAll('[role="img"]')).toHaveLength(3);
        // The item's own label summarises the people behind the chip, so it is decorative.
        expect(screen.getByText("+2").getAttribute("aria-hidden")).toBe("true");
    });

    it("renders nothing when there is nobody in the call", () => {
        const { container } = render(<VoicePresenceRow participants={[]} />);

        expect(container.childElementCount).toBe(0);
    });

    it("falls back to the initial letter when a participant has no avatar", () => {
        render(<VoicePresenceRow participants={[participant("Alice"), participant("Bob")]} />);

        expect(screen.getByText("A")).toBeTruthy();
        expect(screen.getByText("B")).toBeTruthy();
    });

    it("names every participant, in order, in the tooltip and stays out of the accessibility tree", () => {
        const { container } = render(
            <VoicePresenceRow
                participants={[participant("Alice"), participant("Bob"), participant("Carol"), participant("Dave")]}
            />,
        );

        // The tooltip is the mouse affordance: the item's own label is what assistive tech reads.
        expect(screen.getByTitle("In call: Alice, Bob, Carol, Dave")).toBeTruthy();
        // Announcing the names twice would duplicate them, because the item's button label already
        // replaces the accessible name of everything inside it.
        expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    });

    it("reports a click once", () => {
        const onClick = vi.fn();
        render(<VoicePresenceRow participants={[participant("Alice")]} onClick={onClick} />);

        screen.getByTitle("In call: Alice").click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("keeps the click from reaching an ancestor, so the tile does not also open the room", () => {
        const onAncestorClick = vi.fn();
        render(
            <div onClick={onAncestorClick}>
                <VoicePresenceRow participants={[participant("Alice")]} onClick={vi.fn()} />
            </div>,
        );

        screen.getByTitle("In call: Alice").click();

        expect(onAncestorClick).not.toHaveBeenCalled();
    });
});
