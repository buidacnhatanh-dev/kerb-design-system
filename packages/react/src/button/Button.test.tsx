import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  axe,
  forEachTheme,
  liveRegion,
  renderWithKerb,
} from "../../test/utils";
import { Icon } from "../internal/Icon";
import { Button } from "./Button";

afterEach(() => {
  vi.useRealTimers();
});

describe("Button", () => {
  it("renders a native button named by its label", () => {
    renderWithKerb(<Button>Save changes</Button>);

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("kerb-focusable");
  });

  it("lets a form use it as the submit button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    renderWithKerb(
      <form onSubmit={onSubmit}>
        <Button type="submit">Send</Button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("forwards its ref and spreads remaining props onto the button", () => {
    const ref = createRef<HTMLButtonElement>();
    renderWithKerb(
      <Button ref={ref} name="intent" value="save" data-track="save">
        Save changes
      </Button>,
    );

    expect(ref.current).toBe(screen.getByRole("button"));
    expect(ref.current).toHaveAttribute("name", "intent");
    expect(ref.current).toHaveAttribute("data-track", "save");
  });

  describe("keyboard", () => {
    it("activates with Enter and with Space", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      renderWithKerb(<Button onClick={onClick}>Save changes</Button>);

      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("disabled", () => {
    it("uses aria-disabled, stays focusable and does not fire onClick", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      renderWithKerb(
        <Button disabled onClick={onClick}>
          Save changes
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Save changes" });

      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toHaveAttribute("disabled");

      await user.tab();
      expect(button).toHaveFocus();

      await user.click(button);
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onClick).not.toHaveBeenCalled();
    });

    it("treats aria-disabled passed directly the same way", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      renderWithKerb(
        <Button aria-disabled="true" onClick={onClick}>
          Save changes
        </Button>,
      );

      await user.click(screen.getByRole("button"));

      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not submit a form or reach handlers further up", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent) =>
        event.preventDefault(),
      );
      const onRowClick = vi.fn();
      renderWithKerb(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- stands in for a clickable ancestor
        <form onSubmit={onSubmit} onClick={onRowClick}>
          <Button type="submit" disabled>
            Send
          </Button>
        </form>,
      );

      await user.click(screen.getByRole("button", { name: "Send" }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it("links the reason as the button's description", () => {
      renderWithKerb(
        <Button disabled disabledReason="Fill in your email address first">
          Save changes
        </Button>,
      );

      const button = screen.getByRole("button", { name: "Save changes" });
      expect(button).toHaveAccessibleDescription(
        "Fill in your email address first",
      );
      expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
        "Fill in your email address first",
      );
    });

    it("shows the reason in a Tooltip on focus, and Esc hides it without moving focus", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <Button disabled disabledReason="Fill in your email address first">
          Save changes
        </Button>,
      );
      const button = screen.getByRole("button");
      const reason = screen.getByRole("tooltip", { hidden: true });

      expect(reason).not.toHaveClass("open");

      await user.tab();
      expect(reason).toHaveClass("open");

      await user.keyboard("{Escape}");
      expect(reason).not.toHaveClass("open");
      expect(button).toHaveFocus();
    });

    it("ignores the reason while the button is enabled", () => {
      renderWithKerb(
        <Button disabledReason="Fill in your email address first">
          Save changes
        </Button>,
      );

      expect(screen.getByRole("button")).not.toHaveAttribute(
        "aria-describedby",
      );
      expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    });
  });

  describe("loading", () => {
    it("keeps the name, sets aria-busy and ignores clicks", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      renderWithKerb(
        <Button loading onClick={onClick}>
          Save changes
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Save changes" });

      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).not.toHaveAttribute("aria-disabled");

      await user.click(button);
      await user.tab();
      await user.keyboard("{Enter}");
      expect(onClick).not.toHaveBeenCalled();
    });

    it("is not busy when not loading", () => {
      renderWithKerb(<Button>Save changes</Button>);

      expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
    });

    it("announces the loading label politely when loading starts", () => {
      vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
      const { rerender } = renderWithKerb(<Button>Save changes</Button>);
      expect(liveRegion("polite")).toBeEmptyDOMElement();

      rerender(
        <Button loading loadingLabel="Saving">
          Save changes
        </Button>,
      );
      act(() => {
        vi.advanceTimersToNextFrame();
      });

      expect(liveRegion("polite")).toHaveTextContent("Saving");
      expect(liveRegion("assertive")).toBeEmptyDOMElement();
    });

    it('announces "Loading" by default', () => {
      vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
      renderWithKerb(<Button loading>Save changes</Button>);
      act(() => {
        vi.advanceTimersToNextFrame();
      });

      expect(liveRegion("polite")).toHaveTextContent("Loading");
    });

    it("shows the spinner in place of the start icon", () => {
      const { container } = renderWithKerb(
        <Button loading iconStart={<Icon name="check" data-icon="check" />}>
          Save changes
        </Button>,
      );

      expect(container.querySelector(".spinner")).toBeInTheDocument();
      expect(container.querySelector('[data-icon="check"]')).toBeNull();
    });
  });

  describe("icons", () => {
    it("keeps icons out of the accessible name", () => {
      renderWithKerb(
        <Button
          iconStart={<Icon name="check" />}
          iconEnd={<Icon name="chevron" />}
        >
          Save changes
        </Button>,
      );

      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument();
    });

    it("names an icon only button with aria-label", () => {
      renderWithKerb(
        <Button aria-label="Copy link" iconStart={<Icon name="link" />} />,
      );

      expect(
        screen.getByRole("button", { name: "Copy link" }),
      ).toBeInTheDocument();
    });

    it("makes an icon only button without a name a type error", () => {
      // The assertions are the @ts-expect-error lines: `pnpm typecheck` fails if they compile
      const cases = [
        // @ts-expect-error -- no children and no aria-label
        <Button key="1" iconStart={<Icon name="link" />} />,
        // @ts-expect-error -- no children and no aria-label
        <Button key="2" variant="ghost" />,
        <Button
          key="3"
          aria-label="Copy link"
          iconStart={<Icon name="link" />}
        />,
        <Button key="4" aria-labelledby="copy-label" />,
        <Button key="5">Copy link</Button>,
      ];
      expect(cases).toHaveLength(5);
    });
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it.each(["primary", "secondary", "ghost", "danger"] as const)(
        "has no axe violations as %s, in every state",
        async (variant) => {
          const { container } = renderWithKerb(
            <>
              <Button variant={variant}>Save changes</Button>
              <Button variant={variant} size="small">
                Save changes
              </Button>
              <Button variant={variant} loading>
                Save changes
              </Button>
              <Button variant={variant} disabled>
                Save changes
              </Button>
              <Button
                variant={variant}
                disabled
                disabledReason="Fill in your email address first"
              >
                Save changes
              </Button>
              <Button
                variant={variant}
                aria-label="Copy link"
                iconStart={<Icon name="link" />}
              />
            </>,
          );

          expect(await axe(container)).toHaveNoViolations();
        },
      );
    });
  });
});
