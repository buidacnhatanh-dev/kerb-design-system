import type { ReactNode } from "react";
import styles from "./stories.module.css";

export { styles as storyStyles };

const themes = [
  { value: "light", name: "Light" },
  { value: "dark", name: "Dark" },
  { value: "comfort", name: "Comfort" },
];

/** Renders the same content in light, dark and comfort side by side. */
export function ThemeColumns({ children }: { children: ReactNode }) {
  return (
    <div className={styles.themes}>
      {themes.map((theme) => (
        <div
          key={theme.value}
          className={styles.theme}
          data-kerb-theme={theme.value}
        >
          <p className={styles.themeName}>{theme.name}</p>
          {children}
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
