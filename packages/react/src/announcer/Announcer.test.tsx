import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KerbProvider } from "../provider";
import { liveRegion } from "../../test/utils";
import { useAnnouncer } from "./Announcer";
import type { Announce } from "./Announcer";

function setup() {
  let announce: Announce = () => {};
  function Capture() {
    announce = useAnnouncer().announce;
    return null;
  }
  render(
    <KerbProvider>
      <Capture />
    </KerbProvider>,
  );
  return {
    announce: (...args: Parameters<Announce>) => act(() => announce(...args)),
  };
}

/** The text lands one animation frame after the region is cleared */
function nextFrame() {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

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
});

describe("Announcer", () => {
  it("has both regions in the document, empty, before the first announcement", () => {
    setup();

    for (const urgency of ["polite", "assertive"] as const) {
      const region = liveRegion(urgency);
      expect(region).toBeInTheDocument();
      expect(region).toBeEmptyDOMElement();
      expect(region).toHaveAttribute("aria-atomic", "true");
    }
  });

  it("sends a message to the polite region by default", () => {
    const { announce } = setup();

    announce("12 results for “dialog”");
    nextFrame();

    expect(liveRegion("polite")).toHaveTextContent("12 results for “dialog”");
    expect(liveRegion("assertive")).toBeEmptyDOMElement();
  });

  it("sends an assertive message to the assertive region", () => {
    const { announce } = setup();

    announce("Upload failed. The file is over 5 MB.", { urgency: "assertive" });
    nextFrame();

    expect(liveRegion("assertive")).toHaveTextContent(
      "Upload failed. The file is over 5 MB.",
    );
    expect(liveRegion("polite")).toBeEmptyDOMElement();
  });

  it("clears the region first and sets the text on the next frame", () => {
    const { announce } = setup();
    announce("Draft saved");
    nextFrame();

    vi.advanceTimersByTime(2000);
    announce("Draft saved");

    expect(liveRegion("polite")).toBeEmptyDOMElement();
    nextFrame();
    expect(liveRegion("polite")).toHaveTextContent("Draft saved");
  });

  it("drops an identical message announced less than a second ago", () => {
    const { announce } = setup();
    announce("Draft saved");
    nextFrame();

    vi.advanceTimersByTime(900);
    announce("Draft saved");

    // Not cleared and re-set: the screen reader hears it once
    expect(liveRegion("polite")).toHaveTextContent("Draft saved");
  });

  it("announces the same text again once a second has passed", () => {
    const { announce } = setup();
    announce("Draft saved");
    nextFrame();

    vi.advanceTimersByTime(1000);
    announce("Draft saved");

    expect(liveRegion("polite")).toBeEmptyDOMElement();
    nextFrame();
    expect(liveRegion("polite")).toHaveTextContent("Draft saved");
  });

  it("does not drop a different message inside the one second window", () => {
    const { announce } = setup();
    announce("Draft saved");
    nextFrame();

    vi.advanceTimersByTime(100);
    announce("Draft deleted");
    nextFrame();

    expect(liveRegion("polite")).toHaveTextContent("Draft deleted");
  });

  it("empties the region after 7 seconds", () => {
    const { announce } = setup();
    announce("Draft saved");
    nextFrame();

    act(() => {
      vi.advanceTimersByTime(6999);
    });
    expect(liveRegion("polite")).toHaveTextContent("Draft saved");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(liveRegion("polite")).toBeEmptyDOMElement();
  });

  it("hides the regions visually but not from screen readers", () => {
    setup();

    expect(liveRegion("polite")).not.toHaveAttribute("aria-hidden");
    expect(liveRegion("polite")).not.toHaveAttribute("hidden");
  });

  it("does nothing, and warns once, when used outside KerbProvider", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    function Outside() {
      const { announce } = useAnnouncer();
      return (
        <button type="button" onClick={() => announce("Hello")}>
          Announce
        </button>
      );
    }
    render(<Outside />);

    act(() => screen.getByRole("button", { name: "Announce" }).click());
    act(() => screen.getByRole("button", { name: "Announce" }).click());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("outside <KerbProvider>");
    warn.mockRestore();
  });

  it("warns once in development when something else sets aria-live", async () => {
    vi.useRealTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <KerbProvider>
        <p>App</p>
      </KerbProvider>,
    );
    expect(warn).not.toHaveBeenCalled();

    const foreign = document.createElement("div");
    foreign.setAttribute("aria-live", "polite");
    document.body.append(foreign);
    const second = foreign.cloneNode() as HTMLElement;
    document.body.append(second);

    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(warn.mock.calls[0]?.[0]).toContain("useAnnouncer");

    foreign.remove();
    second.remove();
    warn.mockRestore();
  });
});
