import type { ComponentType } from "react";
import type { ComponentSlug } from "../lib/registry";
import announcer from "./announcer";
import button from "./button";
import checkbox from "./checkbox";
import comfortControls from "./comfort-controls";
import datePicker from "./date-picker";
import dialog from "./dialog";
import preferences from "./preferences";
import radioGroup from "./radio-group";
import select from "./select";
import tabs from "./tabs";
import textField from "./text-field";
import toast from "./toast";
import tooltip from "./tooltip";

/** One live example per page. Its source file is the code shown under it */
export const examples: Record<ComponentSlug, ComponentType> = {
  button,
  "text-field": textField,
  select,
  checkbox,
  "radio-group": radioGroup,
  dialog,
  tabs,
  tooltip,
  toast,
  "date-picker": datePicker,
  preferences,
  "comfort-controls": comfortControls,
  announcer,
};
