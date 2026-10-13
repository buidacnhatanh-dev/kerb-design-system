import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { liveRegion, mockMatchMedia } from "../../test/utils";
import { KerbProvider, useKerbPreferences } from "./KerbProvider";
import type { KerbProviderProps } from "./KerbProvider";
import { defaultPreferences, presets } from "./preferences";

const root = document.documentElement;

function setup(props: Omit<KerbProviderProps, "children"> = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <KerbProvider {...props}>{children}</KerbProvider>
  );
  return renderHook(() => useKerbPreferences(), { wrapper });
}

function saved(key = "kerb"): unknown {
  return JSON.parse(window.localStorage.getItem(key) ?? "null");
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  root.removeAttribute("style");
  for (const name of root.getAttributeNames()) {
    if (name.startsWith("data-kerb-")) root.removeAttribute(name);
  }
});

describe("KerbProvider", () => {
  it("starts from the defaults and writes them to <html>", () => {
    const { result } = setup();

    expect(result.current.prefs).toEqual(defaultPreferences);
    expect(result.current.activePreset).toBe("standard");
    expect(root).toHaveAttribute("data-kerb-theme", "light");
    expect(root).toHaveAttribute("data-kerb-density", "default");
    expect(root).toHaveAttribute("data-kerb-motion", "full");
  });

  it("takes the app's starting values from the theme and defaultPreferences props", () => {
    const { result } = setup({
      theme: "comfort",
      defaultPreferences: { density: "compact" },
    });

    expect(result.current.prefs.theme).toBe("comfort");
    expect(root).toHaveAttribute("data-kerb-theme", "comfort");
    expect(root.style.getPropertyValue("--kerb-pref-control-height")).toBe(
      "var(--kerb-size-target-compact)",
    );
    // The app's own defaults are its "standard", and are not saved as the person's choice
    expect(result.current.activePreset).toBe("standard");
    expect(saved()).toBeNull();
  });

  it("follows a changed theme prop", () => {
    const { rerender } = render(<KerbProvider theme="light" />);
    expect(root).toHaveAttribute("data-kerb-theme", "light");

    rerender(<KerbProvider theme="dark" />);
    expect(root).toHaveAttribute("data-kerb-theme", "dark");
  });

  it("set changes one value, on <html> and in storage", () => {
    const { result } = setup();

    act(() => result.current.set("textSize", 20));

    expect(result.current.prefs.textSize).toBe(20);
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.25rem",
    );
    expect(saved()).toEqual({ v: 1, prefs: { textSize: 20 } });
  });

  it("setMany changes several values and clamps numbers", () => {
    const { result } = setup();

    act(() => result.current.setMany({ theme: "dark", lineHeight: 9 }));

    expect(result.current.prefs.theme).toBe("dark");
    expect(result.current.prefs.lineHeight).toBe(2.2);
    expect(root).toHaveAttribute("data-kerb-theme", "dark");
  });

  it("applies a preset, then reports Custom after any single change", () => {
    const { result } = setup();

    act(() => result.current.applyPreset("dyslexia"));
    expect(result.current.prefs).toEqual({
      ...defaultPreferences,
      ...presets.dyslexia,
    });
    expect(result.current.activePreset).toBe("dyslexia");
    expect(root).toHaveAttribute("data-kerb-motion", "reduced");
    expect(root).toHaveAttribute("data-kerb-theme", "comfort");

    act(() => result.current.set("textSize", 19));
    expect(result.current.activePreset).toBe("custom");
  });

  it("replaces earlier choices when a preset is applied", () => {
    const { result } = setup();

    act(() => result.current.set("focusColor", "blue"));
    act(() => result.current.applyPreset("tiredEyes"));

    expect(result.current.prefs.focusColor).toBe("yellow");
    expect(result.current.activePreset).toBe("tiredEyes");
  });

  it("keeps preferences across a reload", () => {
    const first = setup();
    act(() => first.result.current.applyPreset("lowVision"));
    first.unmount();

    const second = setup();

    expect(second.result.current.prefs.textSize).toBe(22);
    expect(second.result.current.activePreset).toBe("lowVision");
  });

  it("keeps separate preferences per storageKey", () => {
    const first = setup({ storageKey: "app-a" });
    act(() => first.result.current.set("font", "lexend"));
    first.unmount();

    expect(saved("app-a")).toEqual({ v: 1, prefs: { font: "lexend" } });
    expect(setup({ storageKey: "app-b" }).result.current.prefs.font).toBe(
      "atkinson",
    );
  });

  it("works for the visit when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    const { result } = setup();
    act(() => result.current.set("theme", "comfort"));
    act(() => result.current.reset());
    act(() => result.current.applyPreset("keyboard"));

    expect(result.current.prefs.focusColor).toBe("magenta");
    expect(root.style.getPropertyValue("--kerb-focus-color")).toBe("#C026D3");
  });

  it("ignores saved data it cannot read", () => {
    window.localStorage.setItem("kerb", "{not json");
    expect(setup().result.current.prefs).toEqual(defaultPreferences);

    window.localStorage.setItem(
      "kerb",
      JSON.stringify({ v: 1, prefs: { theme: "neon", textSize: 18 } }),
    );
    expect(setup().result.current.prefs).toEqual({
      ...defaultPreferences,
      textSize: 18,
    });
  });

  it("exports a code and imports it again", () => {
    const first = setup({ storageKey: "one" });
    act(() => first.result.current.applyPreset("lowVision"));
    act(() => first.result.current.set("focusColor", "blue"));
    const code = first.result.current.exportCode();

    const second = setup({ storageKey: "two" });
    let outcome: unknown;
    act(() => {
      outcome = second.result.current.importCode(code);
    });

    expect(outcome).toEqual({ ok: true });
    expect(second.result.current.prefs).toEqual(first.result.current.prefs);
  });

  it("returns a reason for a bad code and changes nothing", () => {
    const { result } = setup();
    let outcome: unknown;

    expect(() => {
      act(() => {
        outcome = result.current.importCode("not a code");
      });
    }).not.toThrow();

    expect(outcome).toEqual({
      ok: false,
      reason: "This is not a Kerb preferences code.",
    });
    expect(result.current.prefs).toEqual(defaultPreferences);
  });

  it("reset goes back to the defaults, clears storage and announces it", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    const { result } = setup();
    act(() => result.current.applyPreset("tiredEyes"));

    act(() => result.current.reset());
    act(() => {
      vi.advanceTimersToNextFrame();
    });

    expect(result.current.prefs).toEqual(defaultPreferences);
    expect(saved()).toBeNull();
    expect(root).toHaveAttribute("data-kerb-theme", "light");
    expect(liveRegion("polite")).toHaveTextContent("Preferences reset");
    vi.useRealTimers();
  });

  it("re-renders components that read the preferences", async () => {
    const user = userEvent.setup();
    function Panel() {
      const { prefs, set } = useKerbPreferences();
      return (
        <button
          type="button"
          onClick={() => set("textSize", prefs.textSize + 1)}
        >
          Text size {prefs.textSize}
        </button>
      );
    }
    render(
      <KerbProvider>
        <Panel />
      </KerbProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Text size 16" }));

    expect(
      screen.getByRole("button", { name: "Text size 17" }),
    ).toBeInTheDocument();
  });

  it("throws a clear error when the hook is used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useKerbPreferences())).toThrow(
      "useKerbPreferences must be used inside <KerbProvider>.",
    );
  });

  it("renders on the server without touching the document or storage", () => {
    const html = renderToString(
      <KerbProvider>
        <p>App</p>
      </KerbProvider>,
    );

    expect(html).toContain("<p>App</p>");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-live="assertive"');
  });

  describe("system settings", () => {
    let media: ReturnType<typeof mockMatchMedia>;
    afterEach(() => media.restore());

    it("starts in the dark theme when the system prefers dark", () => {
      media = mockMatchMedia({ "(prefers-color-scheme: dark)": true });
      const { result } = setup();

      expect(root).toHaveAttribute("data-kerb-theme", "dark");
      expect(result.current.prefs.theme).toBe("system");
    });

    it("follows a live system change while the theme is system", () => {
      media = mockMatchMedia();
      setup();
      expect(root).toHaveAttribute("data-kerb-theme", "light");

      act(() => media.set("(prefers-color-scheme: dark)", true));
      expect(root).toHaveAttribute("data-kerb-theme", "dark");

      act(() => media.set("(prefers-reduced-motion: reduce)", true));
      expect(root).toHaveAttribute("data-kerb-motion", "reduced");
    });

    it("does not follow the system once the person has chosen", () => {
      media = mockMatchMedia();
      const { result } = setup();
      act(() => result.current.setMany({ theme: "comfort", motion: "off" }));

      act(() => media.set("(prefers-color-scheme: dark)", true));
      act(() => media.set("(prefers-reduced-motion: reduce)", true));

      expect(root).toHaveAttribute("data-kerb-theme", "comfort");
      expect(root).toHaveAttribute("data-kerb-motion", "off");
    });
  });

  it("picks up preferences saved in another tab", () => {
    const { result } = setup();

    act(() => {
      window.localStorage.setItem(
        "kerb",
        JSON.stringify({ v: 1, prefs: { theme: "dark" } }),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "kerb" }));
    });

    expect(result.current.prefs.theme).toBe("dark");
    expect(root).toHaveAttribute("data-kerb-theme", "dark");
  });
});
