import { act, fireEvent, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  axe,
  forEachTheme,
  liveRegion,
  mockMatchMedia,
} from "../../test/utils";
import { Button } from "../button";
import { KerbProvider } from "../provider";
import { useToast } from "./Toast";
import type { ToastOptions } from "./Toast";

function setup() {
  const { result } = renderHook(() => useToast(), {
    wrapper: ({ children }) => (
      <KerbProvider>
        <Button>Somewhere in the app</Button>
        {children}
      </KerbProvider>
    ),
  });
  return {
    show: (options: ToastOptions) => {
      let id = "";
      act(() => {
        id = result.current.show(options);
      });
      return id;
    },
  };
}

const saved: ToastOptions = {
  tone: "success",
  title: "Project saved",
  body: "Your changes are live.",
};

function nextFrame() {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

const root = document.documentElement;

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "Date",
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
  root.removeAttribute("data-kerb-motion");
});

describe("Toast", () => {
  it("shows the title and body in a labelled region", () => {
    const { show } = setup();

    show(saved);

    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveTextContent("Project saved");
    expect(region).toHaveTextContent("Your changes are live.");
  });

  it("has no region while there are no toasts", () => {
    setup();

    expect(screen.queryByRole("region", { name: "Notifications" })).toBeNull();
  });

  describe("announcements", () => {
    it("announces success politely, exactly once", () => {
      const { show } = setup();

      show(saved);
      nextFrame();

      expect(liveRegion("polite")).toHaveTextContent(
        "Project saved. Your changes are live.",
      );
      expect(liveRegion("assertive")).toBeEmptyDOMElement();
      // The toast itself is not a live region, so nothing reads it a second time
      expect(
        screen
          .getByRole("region", { name: "Notifications" })
          .closest("[aria-live]"),
      ).toBeNull();
      expect(
        screen
          .getByRole("region", { name: "Notifications" })
          .querySelector("[aria-live], [role='alert'], [role='status']"),
      ).toBeNull();
    });

    it("announces info politely", () => {
      const { show } = setup();

      show({ tone: "info", title: "Item moved to trash" });
      nextFrame();

      expect(liveRegion("polite")).toHaveTextContent("Item moved to trash.");
    });

    it("announces an error assertively, exactly once", () => {
      const { show } = setup();

      show({ tone: "error", title: "Could not upload image" });
      nextFrame();

      expect(liveRegion("assertive")).toHaveTextContent(
        "Could not upload image.",
      );
      expect(liveRegion("polite")).toBeEmptyDOMElement();
    });

    it("says how to reach the action", () => {
      const { show } = setup();

      show({
        tone: "info",
        title: "Item moved to trash",
        action: { label: "Undo", onAction: () => {} },
      });
      nextFrame();

      expect(liveRegion("polite")).toHaveTextContent(
        "Item moved to trash. Press F6 to reach Undo.",
      );
    });
  });

  it("does not move focus when it shows", () => {
    const { show } = setup();
    const button = screen.getByRole("button", { name: "Somewhere in the app" });
    button.focus();

    show({ ...saved, action: { label: "Undo", onAction: () => {} } });

    expect(button).toHaveFocus();
  });

  it("shows an icon and text for each tone", () => {
    const { show } = setup();

    show(saved);
    show({ tone: "info", title: "Heads up" });
    show({ tone: "error", title: "Failed" });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("shows at most three, newest last, and the next one moves up when one goes", () => {
    const { show } = setup();

    for (const title of ["One", "Two", "Three", "Four"]) {
      show({
        tone: "info",
        title,
        action: { label: "Undo", onAction: () => {} },
      });
    }

    expect(
      screen
        .getAllByRole("listitem")
        .map((item) => item.querySelector("p")?.textContent),
    ).toEqual(["Two", "Three", "Four"]);

    act(() => {
      screen
        .getAllByRole("button", { name: "Dismiss notification" })[2]!
        .click();
    });
    expect(
      screen
        .getAllByRole("listitem")
        .map((item) => item.querySelector("p")?.textContent),
    ).toEqual(["One", "Two", "Three"]);
  });

  describe("dismissing", () => {
    it("has a Dismiss notification button", () => {
      const { show } = setup();
      show(saved);

      act(() => {
        screen.getByRole("button", { name: "Dismiss notification" }).click();
      });

      expect(screen.queryByText("Project saved")).toBeNull();
    });

    it("runs the action and closes", () => {
      const onAction = vi.fn();
      const { show } = setup();
      show({
        tone: "info",
        title: "Item moved to trash",
        action: { label: "Undo", onAction },
      });

      act(() => {
        screen.getByRole("button", { name: "Undo" }).click();
      });

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Item moved to trash")).toBeNull();
    });

    it("closes on its own after 6 seconds by default", () => {
      const { show } = setup();
      show(saved);

      act(() => {
        vi.advanceTimersByTime(5999);
      });
      expect(screen.getByText("Project saved")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByText("Project saved")).toBeNull();
    });

    it("uses the given duration", () => {
      const { show } = setup();
      show({ ...saved, duration: 2000 });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByText("Project saved")).toBeNull();
    });

    it("pauses while hovered and resumes with the time that was left", () => {
      const { show } = setup();
      show(saved);
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      fireEvent.pointerEnter(screen.getByRole("listitem"));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText("Project saved")).toBeInTheDocument();

      fireEvent.pointerLeave(screen.getByRole("listitem"));
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(screen.getByText("Project saved")).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByText("Project saved")).toBeNull();
    });

    it("pauses while something in it has focus", () => {
      const { show } = setup();
      show(saved);

      act(() => {
        screen.getByRole("button", { name: "Dismiss notification" }).focus();
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(screen.getByText("Project saved")).toBeInTheDocument();
    });

    it("keeps error toasts until they are dismissed", () => {
      const { show } = setup();
      show({ tone: "error", title: "Could not upload image", duration: 1000 });

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(screen.getByText("Could not upload image")).toBeInTheDocument();
    });

    it("keeps toasts with an action until dismissed, unless a duration is given", () => {
      const { show } = setup();
      show({
        tone: "info",
        title: "Kept",
        action: { label: "Undo", onAction: () => {} },
      });
      show({
        tone: "info",
        title: "Timed",
        action: { label: "Undo", onAction: () => {} },
        duration: 10_000,
      });

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(screen.getByText("Kept")).toBeInTheDocument();
      expect(screen.queryByText("Timed")).toBeNull();
    });

    it.each(["off", "reduced"])(
      "never closes on its own when motion is %s",
      (level) => {
        const { show } = setup();
        root.setAttribute("data-kerb-motion", level);
        show(saved);

        act(() => {
          vi.advanceTimersByTime(60_000);
        });

        expect(screen.getByText("Project saved")).toBeInTheDocument();
      },
    );

    it("never closes on its own when the system asks for reduced motion", () => {
      const media = mockMatchMedia({
        "(prefers-reduced-motion: reduce)": true,
      });
      const { show } = setup();
      // The person chose full motion, but the system setting still counts here
      root.setAttribute("data-kerb-motion", "full");
      show(saved);

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(screen.getByText("Project saved")).toBeInTheDocument();
      media.restore();
    });
  });

  describe("F6", () => {
    it("moves focus to the newest toast and back", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { show } = setup();
      const button = screen.getByRole("button", {
        name: "Somewhere in the app",
      });
      button.focus();
      show({
        tone: "info",
        title: "Item moved to trash",
        action: { label: "Undo", onAction: () => {} },
      });

      await user.keyboard("{F6}");
      expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();

      await user.keyboard("{F6}");
      expect(button).toHaveFocus();
    });

    it("is left to the browser when there are no toasts", () => {
      setup();
      const event = new KeyboardEvent("keydown", {
        key: "F6",
        cancelable: true,
      });

      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });
  });

  it("does nothing, and warns once, outside KerbProvider", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useToast());

    expect(result.current.show(saved)).toBe("");
    result.current.show(saved);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations with every tone", async () => {
        vi.useRealTimers();
        const { show } = setup();
        show(saved);
        show({
          tone: "info",
          title: "Item moved to trash",
          action: { label: "Undo", onAction: () => {} },
        });
        show({ tone: "error", title: "Could not upload image" });

        expect(await axe(document.body)).toHaveNoViolations();
      });
    });
  });
});
