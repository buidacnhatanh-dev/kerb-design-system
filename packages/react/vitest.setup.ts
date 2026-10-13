import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

/* eslint-disable @typescript-eslint/no-unused-vars -- type parameters must match Vitest's declaration */
declare module "vitest" {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > {
    toHaveNoViolations(): R;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
