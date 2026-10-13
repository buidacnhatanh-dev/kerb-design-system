// Public API of @kerb/react. Everything consumers can import is exported from here,
// except getKerbHeadScript, which has its own entry (head-script.ts) so that
// server components can call it.
import "./styles/base.css";

export { useAnnouncer } from "./announcer";
export type { Announce, AnnounceOptions, AnnounceUrgency } from "./announcer";
export { Button } from "./button";
export type { ButtonProps } from "./button";
export {
  KerbProvider,
  defaultPreferences,
  presets,
  useKerbPreferences,
} from "./provider";
export type {
  ImportResult,
  KerbPreferences,
  KerbPreferencesApi,
  KerbPresetName,
  KerbProviderProps,
} from "./provider";
export { TextField } from "./text-field";
export type { TextFieldProps } from "./text-field";
