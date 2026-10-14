import { useEffect } from "react";
import type { ReactNode } from "react";
import { useKerbPreferences } from "../../provider";
import type { KerbPreferences, KerbPresetName } from "../../provider";
import styles from "./stories.module.css";

export { styles as storyStyles };

const themes = [
  { value: "light", name: "Light" },
  { value: "dark", name: "Dark" },
  { value: "comfort", name: "Comfort" },
];

/**
 * Renders the same content in light, dark and comfort side by side. Pass a
 * function when each copy needs something of its own, such as a radio group name.
 */
export function ThemeColumns({
  children,
}: {
  children: ReactNode | ((theme: string) => ReactNode);
}) {
  return (
    <div className={styles.themes}>
      {themes.map((theme) => (
        <div
          key={theme.value}
          className={styles.theme}
          data-kerb-theme={theme.value}
        >
          <p className={styles.themeName}>{theme.name}</p>
          {typeof children === "function" ? children(theme.value) : children}
        </div>
      ))}
    </div>
  );
}

type PseudoState = "hover" | "focus" | "focus-visible" | "active";

/**
 * Props that show an element in a pseudo state without real interaction.
 * Storybook's preview copies every `:hover`, `:focus`, `:focus-visible` and
 * `:active` rule to match this attribute (see apps/storybook/.storybook/pseudo-states.ts).
 */
export function forced(...states: PseudoState[]) {
  return { "data-sb-pseudo": states.join(" ") };
}

/**
 * Applies a preset (and any extra values) while the story is shown, and goes
 * back to Standard when it unmounts, so nothing carries over to the next story.
 */
export function WithPreferences({
  preset = "standard",
  values,
  children,
}: {
  preset?: KerbPresetName;
  values?: Partial<KerbPreferences>;
  children: ReactNode;
}) {
  const { applyPreset, setMany } = useKerbPreferences();
  const key = JSON.stringify({ preset, values });
  useEffect(() => {
    applyPreset(preset);
    if (values) setMany(values);
    // Also when the page goes away, which skips the unmount: the store saves
    const restore = () => applyPreset("standard");
    window.addEventListener("pagehide", restore);
    return () => {
      window.removeEventListener("pagehide", restore);
      restore();
    };
    // Once per preset and values, not on every new function from the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <>{children}</>;
}
