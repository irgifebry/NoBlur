import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changelogData } from "./changelog-data.mjs";
import {
    getLatestVersion,
    hasNewVersion,
    initChangelog,
} from "./changelog.mjs";

let mockStorage = {};

const mockLocalStorage = {
    getItem: vi.fn((key) => mockStorage[key] ?? null),
    setItem: vi.fn((key, value) => {
        mockStorage[key] = value;
    }),
    removeItem: vi.fn((key) => {
        delete mockStorage[key];
    }),
    clear: vi.fn(() => {
        mockStorage = {};
    }),
};

beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal("localStorage", mockLocalStorage);
    document.body.innerHTML = "";
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("changelog module", () => {
    describe("getLatestVersion", () => {
        it("returns the first version from changelogData", () => {
            const version = getLatestVersion();
            expect(version).toBe("2.6.0");
        });
    });

    describe("hasNewVersion", () => {
        it("returns true when localStorage has no last-seen-version", () => {
            expect(hasNewVersion()).toBe(true);
        });

        it("returns true when stored version differs from latest", () => {
            mockStorage["noblur-last-seen-version"] = "1.2.0";
            expect(hasNewVersion()).toBe(true);
        });

        it("returns false when stored version matches latest", () => {
            mockStorage["noblur-last-seen-version"] = "2.6.0";
            expect(hasNewVersion()).toBe(false);
        });

        it("returns true when localStorage is unavailable", () => {
            vi.stubGlobal("localStorage", {
                getItem: () => {
                    throw new Error("localStorage disabled");
                },
                setItem: () => {
                    throw new Error("localStorage disabled");
                },
            });
            expect(hasNewVersion()).toBe(true);
        });
    });

    describe("initChangelog", () => {
        it("renders NEW badge when user has not seen current version", () => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            initChangelog(container);

            const badge = container.querySelector(".changelog-badge");
            expect(badge).not.toBeNull();
            expect(badge.textContent).toBe("NEW");
            expect(badge.classList.contains("changelog-badge-new")).toBe(true);
        });

        it("renders version badge when user has seen current version", () => {
            mockStorage["noblur-last-seen-version"] = "2.6.0";

            const container = document.createElement("div");
            document.body.appendChild(container);
            initChangelog(container);

            const badge = container.querySelector(".changelog-badge");
            expect(badge.textContent).toBe("v2.6.0");
            expect(badge.classList.contains("changelog-badge-version")).toBe(
                true,
            );
        });
    });
});
