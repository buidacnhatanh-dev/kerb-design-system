import tokens from "@kerb/tokens";
import { afterEach, describe, expect, it } from "vitest";
import { getKerbHeadScript } from "../head-script";
import { applyPreferences } from "./applyPreferences";
import {
  decodePreferences,
  defaultPreferences,
  encodePreferences,
  presets,
  sanitizePreferences,
} from "./preferences";
import type { KerbPreferences } from "./preferences";
import { mockMatchMedia } from "../../test/utils";

const root = document.documentElement;

afterEach(() => {
  root.removeAttribute("style");
  for (const name of root.getAttributeNames()) {
    if (name.startsWith("data-kerb-")) root.removeAttribute(name);
  }
  window.localStorage.clear();
});

describe("sanitizePreferences", () => {
  it("keeps valid values and drops unknown fields and wrong types", () => {
    expect(
      sanitizePreferences({
        theme: "comfort",
        font: "comic-sans",
        textSize: "20",
        underlineLinks: true,
        somethingNew: 1,
      }),
    ).toEqual({ theme: "comfort", underlineLinks: true });
  });

  it("clamps numbers to their range", () => {
    expect(
      sanitizePreferences({ textSize: 40, lineHeight: 1, wordSpacing: 0.5 }),
    ).toEqual({ textSize: 26, lineHeight: 1.4, wordSpacing: 0.24 });
  });

  it.each([null, undefined, "kerb", 3, []])(
    "returns nothing for %j",
    (input) => {
      expect(sanitizePreferences(input)).toEqual({});
    },
  );
});

describe("export codes", () => {
  it("writes a short versioned string", () => {
    expect(
      encodePreferences({ ...defaultPreferences, ...presets.dyslexia }),
    ).toBe("kerb1.18.185.16.0.C.L.N.Y.S.D.R.u");
  });

  it.each(Object.entries(presets))(
    "round trips the %s preset",
    (_name, preset) => {
      const prefs = { ...defaultPreferences, ...preset };
      expect(decodePreferences(encodePreferences(prefs))).toEqual({
        ok: true,
        prefs,
      });
    },
  );

  it("ignores fields it does not know", () => {
    const code = `${encodePreferences(defaultPreferences)}.k.z.future`;
    expect(decodePreferences(code)).toEqual({
      ok: true,
      prefs: { ...defaultPreferences, focusOnClick: true },
    });
  });

  it.each([
    ["", "Enter a preferences code."],
    ["hello", "This is not a Kerb preferences code."],
    ["kerb2.18.185", "This code is from a different version of Kerb."],
    ["kerb1.18.185", "The code is incomplete."],
    [
      "kerb1.99.160.0.0.S.A.M.Y.S.D.S",
      "The code has an invalid value for textSize.",
    ],
    [
      "kerb1.16.160.0.0.S.Q.M.Y.S.D.S",
      "The code has an invalid value for font.",
    ],
    [null, "Enter a preferences code."],
  ])("returns a reason instead of throwing for %j", (code, reason) => {
    expect(decodePreferences(code)).toEqual({ ok: false, reason });
  });
});

describe("applyPreferences", () => {
  it("writes the documented attributes and variables", () => {
    applyPreferences(root, {
      ...defaultPreferences,
      ...presets.lowVision,
      theme: "comfort",
      letterSpacing: 0.05,
      font: "lexend",
    });

    expect(root).toHaveAttribute("data-kerb-theme", "comfort");
    expect(root).toHaveAttribute("data-kerb-density", "spacious");
    expect(root).toHaveAttribute("data-kerb-motion", "full");
    expect(root).toHaveAttribute("data-kerb-underline-links");
    expect(root).toHaveAttribute("data-kerb-focus-on-click");
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.375rem",
    );
    expect(root.style.getPropertyValue("--kerb-pref-line-height")).toBe("1.7");
    expect(root.style.getPropertyValue("--kerb-pref-word-spacing")).toBe(
      "0.04em",
    );
    expect(root.style.getPropertyValue("--kerb-pref-letter-spacing")).toBe(
      "0.05em",
    );
    expect(root.style.getPropertyValue("--kerb-pref-font")).toBe(
      "var(--kerb-font-family-dyslexia)",
    );
    expect(root.style.getPropertyValue("--kerb-pref-measure")).toBe("84ch");
    expect(root.style.getPropertyValue("--kerb-focus-width")).toBe(
      "var(--kerb-focus-width-thick)",
    );
    expect(root.style.getPropertyValue("--kerb-pref-control-height")).toBe(
      "var(--kerb-size-target-spacious)",
    );
  });

  it("leaves a variable unset when nothing was chosen, so theme tokens apply", () => {
    applyPreferences(root, { textSize: 20 });
    applyPreferences(root, { theme: "comfort" });

    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe("");
    expect(root.style.getPropertyValue("--kerb-pref-line-height")).toBe("");
    expect(root.style.getPropertyValue("--kerb-focus-color")).toBe("");
    expect(root).not.toHaveAttribute("data-kerb-underline-links");
    expect(root).not.toHaveAttribute("data-kerb-focus-on-click");
  });

  it("takes the focus colours from the palette, lighter on dark", () => {
    const { palette } = tokens.light;
    const expected = {
      yellow: [palette.yellow[400], palette.yellow[400]],
      blue: [palette.blue[600], palette.blue[300]],
      magenta: [palette.magenta[600], palette.magenta[300]],
    } as const;

    for (const focusColor of ["yellow", "blue", "magenta"] as const) {
      applyPreferences(root, { theme: "light", focusColor });
      expect(root.style.getPropertyValue("--kerb-focus-color")).toBe(
        expected[focusColor][0],
      );
      applyPreferences(root, { theme: "comfort", focusColor });
      expect(root.style.getPropertyValue("--kerb-focus-color")).toBe(
        expected[focusColor][0],
      );
      applyPreferences(root, { theme: "dark", focusColor });
      expect(root.style.getPropertyValue("--kerb-focus-color")).toBe(
        expected[focusColor][1],
      );
    }
  });

  describe("device settings", () => {
    let media: ReturnType<typeof mockMatchMedia>;
    afterEach(() => media.restore());

    it("starts in dark, with reduced motion and a thick ring, when the system asks", () => {
      media = mockMatchMedia({
        "(prefers-color-scheme: dark)": true,
        "(prefers-reduced-motion: reduce)": true,
        "(prefers-contrast: more)": true,
      });
      applyPreferences(root, {});

      expect(root).toHaveAttribute("data-kerb-theme", "dark");
      expect(root).toHaveAttribute("data-kerb-motion", "reduced");
      expect(root.style.getPropertyValue("--kerb-focus-width")).toBe(
        "var(--kerb-focus-width-thick)",
      );
    });

    it("lets an explicit choice win over the system", () => {
      media = mockMatchMedia({
        "(prefers-color-scheme: dark)": true,
        "(prefers-contrast: more)": true,
      });
      applyPreferences(root, {
        theme: "light",
        motion: "off",
        focusWidth: "standard",
      });

      expect(root).toHaveAttribute("data-kerb-theme", "light");
      expect(root).toHaveAttribute("data-kerb-motion", "off");
      expect(root.style.getPropertyValue("--kerb-focus-width")).toBe(
        "var(--kerb-focus-width-standard)",
      );
    });
  });

  it("ignores values it does not recognise", () => {
    applyPreferences(root, {
      theme: "constructor",
      font: "toString",
      textSize: "big",
    } as unknown as Partial<KerbPreferences>);

    expect(root).toHaveAttribute("data-kerb-theme", "light");
    expect(root.style.getPropertyValue("--kerb-pref-font")).toBe("");
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe("");
  });
});

describe("getKerbHeadScript", () => {
  const run = (script: string) => new Function(script)();

  it("applies saved preferences before React runs", () => {
    window.localStorage.setItem(
      "kerb",
      JSON.stringify({ v: 1, prefs: { theme: "dark", textSize: 20 } }),
    );

    run(getKerbHeadScript("kerb"));

    expect(root).toHaveAttribute("data-kerb-theme", "dark");
    expect(root.style.getPropertyValue("--kerb-pref-text-size")).toBe(
      "1.25rem",
    );
  });

  it("uses the given storage key and defaults", () => {
    window.localStorage.setItem(
      "my-app",
      JSON.stringify({ v: 1, prefs: { density: "compact" } }),
    );

    run(getKerbHeadScript("my-app", { theme: "comfort" }));

    expect(root).toHaveAttribute("data-kerb-theme", "comfort");
    expect(root).toHaveAttribute("data-kerb-density", "compact");
  });

  it("still applies the defaults when storage holds something unreadable", () => {
    window.localStorage.setItem("kerb", "{not json");

    expect(() => run(getKerbHeadScript("kerb"))).not.toThrow();
    expect(root).toHaveAttribute("data-kerb-theme", "light");
  });

  it("cannot be closed early by a storage key", () => {
    expect(getKerbHeadScript("</script><script>alert(1)")).not.toContain(
      "</script>",
    );
  });
});
