/**
 * Runs the consumer's handler first, then Kerb's own, unless the consumer
 * called `preventDefault()`.
 */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
): (event: E) => void {
  return (event) => {
    theirs?.(event);
    if (!event.defaultPrevented) {
      ours(event);
    }
  };
}
