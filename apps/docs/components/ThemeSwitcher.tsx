"use client";

import { RadioGroup, useKerbPreferences } from "@kerb/react";
import type { KerbPreferences } from "@kerb/react";

/** The live theme switcher on /theming: the same store as Preferences */
export function ThemeSwitcher() {
  const { prefs, set } = useKerbPreferences();
  return (
    <RadioGroup
      legend="Theme for this site"
      name="site-theme"
      orientation="horizontal"
      value={prefs.theme}
      onChange={(value) => set("theme", value as KerbPreferences["theme"])}
      options={[
        { value: "system", label: "Follow system" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "comfort", label: "Comfort" },
      ]}
    />
  );
}
