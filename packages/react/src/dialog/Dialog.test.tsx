import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  axe,
  forEachTheme,
  liveRegion,
  renderWithKerb,
} from "../../test/utils";
import { Button } from "../button";
import { KerbProvider } from "../provider";
import { TextField } from "../text-field";
import { Dialog } from "./Dialog";

function Rename(props: Partial<React.ComponentProps<typeof Dialog>>) {
  return (
    <>
      <Button>Before</Button>
      <Dialog
        title="Rename project"
        description="The new name shows everywhere this project is shared."
        trigger={<Button variant="secondary">Rename project</Button>}
        {...props}
      >
        <TextField label="Project name" defaultValue="Kerb case study" />
        <Dialog.Cancel>Cancel</Dialog.Cancel>
        <Dialog.Confirm>Save name</Dialog.Confirm>
      </Dialog>
    </>
  );
}

function Delete(props: Partial<React.ComponentProps<typeof Dialog>>) {
  return (
    <Dialog
      tone="danger"
      title="Delete “Portfolio 2026”?"
      description="This removes the project and its 12 pages."
      trigger={<Button variant="danger">Delete project</Button>}
      {...props}
    >
      <Dialog.Body>You can’t undo this.</Dialog.Body>
      <Dialog.Confirm variant="danger">Delete</Dialog.Confirm>
      <Dialog.Cancel>Keep project</Dialog.Cancel>
    </Dialog>
  );
}

const dialog = () => screen.getByRole("dialog");
const appRoot = () => document.querySelector("[data-kerb-app-root]");

async function openWithKeyboard(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  screen.getByRole("button", { name }).focus();
  await user.keyboard("{Enter}");
}

function pressEscape() {
  // jsdom has no native dialog behaviour: Escape on a modal dialog fires "cancel"
  act(() => {
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Dialog", () => {
  it("is closed until the trigger is pressed", () => {
    renderWithKerb(<Rename />);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Rename project" }),
    ).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens on the trigger, named by its title and described by its description", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Rename />);

    await openWithKeyboard(user, "Rename project");

    expect(dialog().tagName).toBe("DIALOG");
    expect(dialog()).toHaveAccessibleName("Rename project");
    expect(dialog()).toHaveAccessibleDescription(
      "The new name shows everywhere this project is shared.",
    );
    expect(
      screen.getByRole("heading", { name: "Rename project" }),
    ).toBeInTheDocument();
  });

  it("moves focus to the first field, not the close button", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Rename />);

    await openWithKeyboard(user, "Rename project");

    expect(screen.getByLabelText("Project name")).toHaveFocus();
  });

  it("puts focus on Cancel for a danger dialog, never on the destructive button", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Delete />);

    await openWithKeyboard(user, "Delete project");

    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus();
  });

  it("does not start on the destructive button even when asked to", async () => {
    const user = userEvent.setup();
    function Pointed() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <Dialog
          tone="danger"
          title="Delete?"
          initialFocus={ref}
          trigger={<Button>Delete project</Button>}
        >
          <Dialog.Cancel>Keep</Dialog.Cancel>
          <Dialog.Confirm ref={ref} variant="danger">
            Delete
          </Dialog.Confirm>
        </Dialog>
      );
    }
    renderWithKerb(<Pointed />);

    await openWithKeyboard(user, "Delete project");

    expect(screen.getByRole("button", { name: "Keep" })).toHaveFocus();
  });

  it("puts focus where initialFocus points", async () => {
    const user = userEvent.setup();
    function Pointed() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <Dialog
          title="Rename"
          initialFocus={ref}
          trigger={<Button>Open</Button>}
        >
          <TextField label="Name" />
          <Dialog.Cancel>Cancel</Dialog.Cancel>
          <Dialog.Confirm ref={ref}>Save</Dialog.Confirm>
        </Dialog>
      );
    }
    renderWithKerb(<Pointed />);

    await openWithKeyboard(user, "Open");

    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });

  it("orders the actions with the primary action last", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Delete />);
    await openWithKeyboard(user, "Delete project");

    const buttons = Array.from(dialog().querySelectorAll("button")).map(
      (button) => button.textContent || button.getAttribute("aria-label"),
    );
    expect(buttons).toEqual(["Close", "Keep project", "Delete"]);
  });

  describe("keyboard", () => {
    it("Tab moves through the dialog and wraps from last to first", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);
      await openWithKeyboard(user, "Rename project");

      await user.tab();
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Save name" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
      await user.tab();
      expect(screen.getByLabelText("Project name")).toHaveFocus();
    });

    it("Shift+Tab wraps from first to last", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);
      await openWithKeyboard(user, "Rename project");

      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "Save name" })).toHaveFocus();
    });

    it("Esc closes and focus returns to the trigger", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderWithKerb(<Rename onOpenChange={onOpenChange} />);
      await openWithKeyboard(user, "Rename project");

      pressEscape();

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Rename project" }),
      ).toHaveFocus();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    });

    it("Enter activates the focused button", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderWithKerb(
        <Dialog title="Rename" trigger={<Button>Open</Button>}>
          <Dialog.Cancel>Cancel</Dialog.Cancel>
          <Dialog.Confirm onClick={onSave}>Save</Dialog.Confirm>
        </Dialog>,
      );
      await openWithKeyboard(user, "Open");
      screen.getByRole("button", { name: "Save" }).focus();

      await user.keyboard("{Enter}");

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
    });
  });

  describe("closing", () => {
    it("Cancel and the close button close it", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);

      await user.click(screen.getByRole("button", { name: "Rename project" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      await user.click(screen.getByRole("button", { name: "Rename project" }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("Confirm stays open when its onClick prevents the default", async () => {
      const user = userEvent.setup();
      renderWithKerb(
        <Dialog title="Rename" trigger={<Button>Open</Button>}>
          <Dialog.Confirm onClick={(event) => event.preventDefault()}>
            Save
          </Dialog.Confirm>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(dialog()).toBeInTheDocument();
    });

    it("closes on a backdrop click by default", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);
      await user.click(screen.getByRole("button", { name: "Rename project" }));

      // A click on the <dialog> element itself, outside the panel, is the backdrop
      fireEvent.click(dialog());

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("ignores a backdrop click for danger dialogs", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Delete />);
      await user.click(screen.getByRole("button", { name: "Delete project" }));

      fireEvent.click(dialog());

      expect(dialog()).toBeInTheDocument();
    });

    it("ignores a click inside the panel", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);
      await user.click(screen.getByRole("button", { name: "Rename project" }));

      await user.click(
        screen.getByText(
          "The new name shows everywhere this project is shared.",
        ),
      );

      expect(dialog()).toBeInTheDocument();
    });
  });

  describe("focus return", () => {
    it("returns to the element that had focus, even when it is not the trigger", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <Button onClick={() => setOpen(true)}>Opener</Button>
            <Dialog title="Rename" open={open} onOpenChange={setOpen}>
              <Dialog.Cancel>Cancel</Dialog.Cancel>
            </Dialog>
          </>
        );
      }
      renderWithKerb(<Controlled />);

      await openWithKeyboard(user, "Opener");
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
      pressEscape();

      expect(screen.getByRole("button", { name: "Opener" })).toHaveFocus();
    });

    it("falls back to the trigger when the remembered element is gone", async () => {
      const user = userEvent.setup();
      function Moving() {
        const [show, setShow] = useState(true);
        const [open, setOpen] = useState(false);
        return (
          <>
            {show && (
              <Button
                onClick={() => {
                  setOpen(true);
                }}
              >
                Opener
              </Button>
            )}
            <Dialog
              title="Rename"
              open={open}
              onOpenChange={setOpen}
              trigger={<Button>Trigger</Button>}
            >
              <Dialog.Confirm onClick={() => setShow(false)}>
                Save
              </Dialog.Confirm>
            </Dialog>
          </>
        );
      }
      renderWithKerb(<Moving />);

      await openWithKeyboard(user, "Opener");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.queryByRole("button", { name: "Opener" })).toBeNull();
      expect(screen.getByRole("button", { name: "Trigger" })).toHaveFocus();
    });

    it("goes to the top of the page with an announcement when the trigger was removed", async () => {
      const user = userEvent.setup();
      function Removes() {
        const [deleted, setDeleted] = useState(false);
        return deleted ? (
          <p>Deleted</p>
        ) : (
          <Dialog
            tone="danger"
            title="Delete “Portfolio 2026”?"
            trigger={<Button variant="danger">Delete project</Button>}
          >
            <Dialog.Cancel>Keep project</Dialog.Cancel>
            <Dialog.Confirm variant="danger" onClick={() => setDeleted(true)}>
              Delete
            </Dialog.Confirm>
          </Dialog>
        );
      }
      renderWithKerb(<Removes />);
      await openWithKeyboard(user, "Delete project");
      vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });

      await act(async () => {
        screen.getByRole("button", { name: "Delete" }).click();
        await Promise.resolve();
      });
      act(() => {
        vi.advanceTimersToNextFrame();
      });

      expect(screen.getByText("Deleted")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.body).toHaveFocus();
      expect(liveRegion("polite")).toHaveTextContent("Dialog closed");
    });
  });

  describe("while open", () => {
    it("makes the app root inert, and gives it back on close", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);

      await openWithKeyboard(user, "Rename project");
      expect(appRoot()).toHaveAttribute("inert");
      // The dialog itself is outside the inert app root
      expect(appRoot()?.contains(dialog())).toBe(false);

      pressEscape();
      expect(appRoot()).not.toHaveAttribute("inert");
    });

    it("locks page scrolling and keeps the scrollbar gutter", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);

      await openWithKeyboard(user, "Rename project");
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.documentElement.style.scrollbarGutter).toBe("stable");

      pressEscape();
      expect(document.documentElement.style.overflow).toBe("");
    });

    it("unlocks the page when it unmounts while open", async () => {
      const user = userEvent.setup();
      const { unmount } = renderWithKerb(<Rename />);
      await openWithKeyboard(user, "Rename project");

      unmount();

      expect(document.documentElement.style.overflow).toBe("");
      expect(document.querySelector("dialog")).toBeNull();
    });
  });

  it("works controlled, and can start open", () => {
    render(
      <KerbProvider>
        <Dialog title="Rename" defaultOpen>
          <Dialog.Cancel>Cancel</Dialog.Cancel>
        </Dialog>
      </KerbProvider>,
    );

    expect(dialog()).toHaveAccessibleName("Rename");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("throws a clear error when an action is used outside a dialog", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Dialog.Cancel>Cancel</Dialog.Cancel>)).toThrow(
      "<Dialog.Cancel> must be used inside <Dialog>.",
    );
    vi.restoreAllMocks();
  });

  describe("sheet", () => {
    it("sits along the bottom edge with a decorative handle", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename placement="bottom" />);
      await openWithKeyboard(user, "Rename project");

      expect(dialog()).toHaveAttribute("data-placement", "bottom");
      const handle = dialog().querySelector('[aria-hidden="true"]');
      expect(handle).toBeInTheDocument();
      expect(handle).toBeEmptyDOMElement();
      pressEscape();
    });

    it("has no handle when centred", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename />);
      await openWithKeyboard(user, "Rename project");

      expect(dialog()).toHaveAttribute("data-placement", "center");
      pressEscape();
    });

    it('starts on the close button with initialFocus="close"', async () => {
      const user = userEvent.setup();
      renderWithKerb(<Rename placement="bottom" initialFocus="close" />);
      await openWithKeyboard(user, "Rename project");

      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
      pressEscape();
      expect(
        screen.getByRole("button", { name: "Rename project" }),
      ).toHaveFocus();
    });
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations while open", async () => {
        const user = userEvent.setup();
        renderWithKerb(<Delete />);
        await openWithKeyboard(user, "Delete project");

        expect(await axe(document.body)).toHaveNoViolations();
        pressEscape();
      });
    });
  });
});
