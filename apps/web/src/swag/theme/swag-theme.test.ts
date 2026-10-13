/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

/**
 * Guards the household theme override: the tokens it must define, the scope
 * that keeps the light and high-contrast themes untouched, and the import
 * that puts it in the bundle. Colors themselves are eyeballed, not asserted —
 * a unit test cannot see them.
 */
describe("swag theme override", () => {
    const css = readFileSync(new URL("./swag-theme.css", import.meta.url), "utf-8");
    const entry = readFileSync(
        new URL("../../vector/index.ts", import.meta.url),
        "utf-8",
    );

    it("is imported into the app bundle", () => {
        expect(entry).toContain("../swag/theme/swag-theme.css");
    });

    it("scopes every rule to the dark theme only", () => {
        expect(css).toContain("body.cpd-theme-dark");
        expect(css).not.toContain("cpd-theme-light");
        expect(css).not.toContain("-hc");
    });

    it("gives the app panels and the login page an aura, but leaves popups alone", () => {
        for (const surface of [".mx_LeftPanel", ".mx_RightPanel", ".mx_RoomView", ".mx_SpaceRoomView"]) {
            expect(css).toContain(surface);
        }
        expect(css).toContain(".mx_Dialog_wrapper");
        expect(css).toContain(".mx_AuthPage");
        expect(css).toContain("radial-gradient");
        // Dialogs and menus keep the stock look: the earlier sheen stopped at
        // a hairline border while the surround stayed flat, which read as ugly.
        expect(css).not.toContain('[role="dialog"]');
        expect(css).not.toContain('[role="menu"]');
        // Aura only: the theme's own surface colors must show through, so
        // the override sets background-image, never the background shorthand.
        expect(css).not.toMatch(/^\s*background:/m);
        // The login aura carries !important: the branding code paints the
        // stock photo through an inline style, which beats any normal rule.
        expect(css).toMatch(/\.mx_AuthPage[\s\S]*!important/);
    });

    it("paints primary buttons bright cyan and tints text-entry boxes dark cyan", () => {
        expect(css).toContain("--cpd-color-bg-action-primary-rest");
        expect(css).toContain("cyan-1000");
        for (const box of [".mx_BasicMessageComposer", ".mx_WysiwygComposer", ".mx_SearchBox"]) {
            expect(css).toContain(box);
        }
    });

    it("remaps the accent roles to the cyan scale, never the green palette", () => {
        for (const token of [
            "--cpd-color-text-action-accent",
            "--cpd-color-text-badge-accent",
            "--cpd-color-icon-accent-tertiary",
            "--cpd-color-icon-accent-primary",
            "--cpd-color-bg-accent-rest",
            "--cpd-color-bg-accent-hovered",
            "--cpd-color-bg-accent-pressed",
            "--cpd-color-bg-accent-selected",
            "--cpd-color-bg-badge-accent",
            "--cpd-color-border-accent-subtle",
            "--cpd-color-border-accent-primary",
            "--cpd-color-bg-action-primary-rest",
            "--cpd-color-bg-action-primary-hovered",
            "--cpd-color-bg-action-primary-pressed",
        ]) {
            expect(css).toContain(token);
        }
        // The green palette itself must stay defined by the theme, not here:
        // green still means success and online.
        expect(css).not.toMatch(/--cpd-color-green-\d+:/);
    });
});
