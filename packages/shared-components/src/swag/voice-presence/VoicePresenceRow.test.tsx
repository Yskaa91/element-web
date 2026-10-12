/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import React from "react";
import { render, screen } from "@test-utils";
import { describe, it, expect, vi } from "vitest";

import { VoicePresenceRow, type CallParticipant } from "./VoicePresenceRow";
import styles from "./VoicePresenceRow.module.css";

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

    it("renders an avatar for every participant, with no overflow chip", () => {
        const participants = [
            participant("Alice"),
            participant("Bob"),
            participant("Carol"),
            participant("Dave"),
            participant("Erin"),
        ];
        const { container } = render(<VoicePresenceRow participants={participants} />);

        expect(container.querySelectorAll('[role="img"]')).toHaveLength(5);
        // Everyone is shown, so there is nothing to collapse: no chip.
        expect(screen.queryByText(/^\+\d+$/)).toBeNull();
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

    it("draws the speaking ring only on speaking participants", () => {
        const { container } = render(
            <VoicePresenceRow
                participants={[
                    { ...participant("Alice"), speaking: true },
                    { ...participant("Bob"), speaking: false },
                    participant("Carol"),
                ]}
            />,
        );

        const avatars = container.querySelectorAll('[role="img"]');
        expect(avatars).toHaveLength(3);
        expect(avatars[0].classList.contains(styles.speaking)).toBe(true);
        // Neither `false` nor `undefined` draws the ring.
        expect(avatars[1].classList.contains(styles.speaking)).toBe(false);
        expect(avatars[2].classList.contains(styles.speaking)).toBe(false);
    });

    it("draws the speaking ring on the initials fallback when the speaker has no avatar", () => {
        const { container } = render(<VoicePresenceRow participants={[{ ...participant("Alice"), speaking: true }]} />);

        const avatar = container.querySelector('[role="img"]')!;
        expect(avatar.classList.contains(styles.speaking)).toBe(true);
        // The ring must be on the element that shows the initials fallback, not on an image wrapper.
        expect(avatar.textContent).toBe("A");
    });

    it("the speaking ring adds nothing to the row's label", () => {
        const { container } = render(
            <VoicePresenceRow participants={[{ ...participant("Alice"), speaking: true }, participant("Bob")]} />,
        );

        // Exactly what phase 1 produced: the tooltip names the call members, the row stays out of
        // the accessibility tree and has no label of its own, so the decorative ring cannot be
        // announced by assistive tech.
        expect(screen.getByTitle("In call: Alice, Bob")).toBeTruthy();
        const row = container.firstElementChild!;
        expect(row.getAttribute("aria-hidden")).toBe("true");
        expect(row.getAttribute("aria-label")).toBeNull();
    });
});
