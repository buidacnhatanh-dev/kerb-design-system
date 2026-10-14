import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { AnnouncerProvider, useAnnouncer } from "../announcer";
import { ToastProvider, useToast } from "../toast";
import { useIsomorphicLayoutEffect } from "../internal/useIsomorphicLayoutEffect";
import { applyPreferences, systemQueries } from "./applyPreferences";
import type { KerbPreferences, KerbPresetName } from "./preferences";
import { createPreferencesStore } from "./store";
import type { ImportResult, PreferencesStore } from "./store";

export type KerbProviderProps = {
  /** localStorage key the person's choices are saved under. Default `kerb` */
  storageKey?: string;
  /** The app's own starting values. The person's choices win over these */
  defaultPreferences?: Partial<KerbPreferences>;
  /** Shorthand for `defaultPreferences.theme`. Default `system` */
  theme?: KerbPreferences["theme"];
  children?: ReactNode;
};

/** How long the Undo action after a reset stays offered */
const RESET_UNDO_MS = 10_000;

const PreferencesContext = createContext<PreferencesStore | null>(null);

/**
 * Owns the preferences store, writes it to `<html>` and hosts the Announcer's
 * live regions. Wrap the app in it once.
 */
export function KerbProvider({
  storageKey = "kerb",
  defaultPreferences,
  theme,
  children,
}: KerbProviderProps) {
  // A stable key, so a new object with the same values is not a change
  const defaultsKey = JSON.stringify({
    ...defaultPreferences,
    ...(theme ? { theme } : null),
  });

  const store = useMemo(
    () =>
      createPreferencesStore({
        storageKey,
        defaults: JSON.parse(defaultsKey) as Partial<KerbPreferences>,
      }),
    // Later changes to the defaults go through setDefaults below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey],
  );

  useEffect(() => {
    store.setDefaults(JSON.parse(defaultsKey) as Partial<KerbPreferences>);
  }, [store, defaultsKey]);

  useIsomorphicLayoutEffect(() => {
    const apply = () =>
      applyPreferences(document.documentElement, store.getSnapshot().explicit);
    apply();
    const unsubscribe = store.subscribe(apply);

    // Follow the device live. applyPreferences only uses it where nothing was chosen
    const queries =
      typeof window.matchMedia === "function"
        ? systemQueries.map((query) => window.matchMedia(query))
        : [];
    queries.forEach((query) => query.addEventListener("change", apply));

    // Another tab saved new preferences
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) store.reload();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      unsubscribe();
      queries.forEach((query) => query.removeEventListener("change", apply));
      window.removeEventListener("storage", onStorage);
    };
  }, [store, storageKey]);

  return (
    <PreferencesContext.Provider value={store}>
      <AnnouncerProvider>
        <ToastProvider>
          {/* What a modal dialog makes inert. display: contents keeps it out of layout */}
          <div data-kerb-app-root="" style={{ display: "contents" }}>
            {children}
          </div>
        </ToastProvider>
      </AnnouncerProvider>
    </PreferencesContext.Provider>
  );
}

export type KerbPreferencesApi = {
  prefs: KerbPreferences;
  set: <K extends keyof KerbPreferences>(
    key: K,
    value: KerbPreferences[K],
  ) => void;
  setMany: (values: Partial<KerbPreferences>) => void;
  applyPreset: (name: KerbPresetName) => void;
  reset: () => void;
  exportCode: () => string;
  importCode: (code: string) => ImportResult;
  activePreset: KerbPresetName | "custom";
};

/** Reads and changes the person's preferences. Must be used inside `KerbProvider`. */
export function useKerbPreferences(): KerbPreferencesApi {
  const store = useContext(PreferencesContext);
  if (!store) {
    throw new Error("useKerbPreferences must be used inside <KerbProvider>.");
  }
  const { announce } = useAnnouncer();
  const toast = useToast();
  const { prefs, activePreset } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  return useMemo(
    () => ({
      prefs,
      activePreset,
      set: store.set,
      setMany: store.setMany,
      applyPreset: store.applyPreset,
      reset: () => {
        store.reset();
        toast.show({
          tone: "info",
          title: "Preferences reset",
          action: {
            label: "Undo",
            onAction: () => {
              if (store.undoReset()) announce("Preferences restored");
            },
          },
          duration: RESET_UNDO_MS,
        });
      },
      exportCode: store.exportCode,
      importCode: store.importCode,
    }),
    [store, prefs, activePreset, announce, toast],
  );
}
