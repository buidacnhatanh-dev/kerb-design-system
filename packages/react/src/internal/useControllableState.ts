import { useCallback, useState } from "react";

/**
 * State that the consumer can own (`value`) or leave to the component
 * (`defaultValue`). `onChange` fires in both modes.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;

  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );

  return [controlled ? value : internal, set];
}
