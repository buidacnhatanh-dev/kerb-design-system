import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe, forEachTheme, renderWithKerb } from "../../test/utils";
import { Tabs } from "./Tabs";

function Example(props: {
  activation?: "automatic" | "manual";
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  return (
    <>
      <Tabs
        label="Project details"
        defaultValue={props.value === undefined ? "overview" : undefined}
        value={props.value}
        activation={props.activation}
        onValueChange={props.onValueChange}
      >
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="process">Process</Tabs.Tab>
          <Tabs.Tab value="outcome">Outcome</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview">Overview text</Tabs.Panel>
        <Tabs.Panel value="process">
          <a href="#notes">Process notes</a>
        </Tabs.Panel>
        <Tabs.Panel value="outcome">Outcome text</Tabs.Panel>
      </Tabs>
      <button type="button">After</button>
    </>
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

async function focusSelected(user: ReturnType<typeof userEvent.setup>) {
  await user.tab();
}

describe("Tabs", () => {
  it("has a named tab list, tabs and a panel labelled by its tab", () => {
    renderWithKerb(<Example />);

    expect(
      screen.getByRole("tablist", { name: "Project details" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    const panel = screen.getByRole("tabpanel", { name: "Overview" });
    expect(panel).toHaveTextContent("Overview text");
    expect(tab("Overview")).toHaveAttribute("aria-controls", panel.id);
  });

  it("marks the selected tab and shows only its panel", () => {
    renderWithKerb(<Example />);

    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    expect(tab("Process")).toHaveAttribute("aria-selected", "false");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("uses a roving tabindex: the selected tab is the only Tab stop", async () => {
    const user = userEvent.setup();
    renderWithKerb(<Example />);

    expect(tab("Overview")).toHaveAttribute("tabindex", "0");
    expect(tab("Process")).toHaveAttribute("tabindex", "-1");
    expect(tab("Outcome")).toHaveAttribute("tabindex", "-1");

    await user.click(tab("Outcome"));
    expect(tab("Outcome")).toHaveAttribute("tabindex", "0");
    expect(tab("Overview")).toHaveAttribute("tabindex", "-1");
  });

  describe("keyboard, automatic", () => {
    it("Left and Right move and select, wrapping", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      renderWithKerb(<Example onValueChange={onValueChange} />);
      await focusSelected(user);

      await user.keyboard("{ArrowRight}");
      expect(tab("Process")).toHaveFocus();
      expect(tab("Process")).toHaveAttribute("aria-selected", "true");
      expect(onValueChange).toHaveBeenLastCalledWith("process");

      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(tab("Overview")).toHaveFocus();
      expect(tab("Overview")).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{ArrowLeft}");
      expect(tab("Outcome")).toHaveFocus();
      expect(tab("Outcome")).toHaveAttribute("aria-selected", "true");
    });

    it("Home and End go to the first and last tab", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Example />);
      await focusSelected(user);

      await user.keyboard("{End}");
      expect(tab("Outcome")).toHaveFocus();
      expect(tab("Outcome")).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{Home}");
      expect(tab("Overview")).toHaveFocus();
      expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("keyboard, manual", () => {
    it("arrow keys alone move focus but do not change the panel", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Example activation="manual" />);
      await focusSelected(user);

      await user.keyboard("{ArrowRight}");

      expect(tab("Process")).toHaveFocus();
      expect(tab("Process")).toHaveAttribute("aria-selected", "false");
      expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview text");
    });

    it("Enter and Space select the focused tab", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Example activation="manual" />);
      await focusSelected(user);

      await user.keyboard("{ArrowRight}{Enter}");
      expect(tab("Process")).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{End} ");
      expect(tab("Outcome")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent("Outcome text");
    });
  });

  describe("Tab key", () => {
    it("moves from the tab list into a panel with no focusable content", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Example />);
      await focusSelected(user);

      await user.tab();

      expect(screen.getByRole("tabpanel")).toHaveFocus();
      expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
    });

    it("moves into the panel's own controls when it has some", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Example value="process" />);
      await focusSelected(user);

      await user.tab();

      expect(screen.getByRole("link", { name: "Process notes" })).toHaveFocus();
      expect(screen.getByRole("tabpanel")).not.toHaveAttribute("tabindex");
    });

    it("leaves the tab list in one step", async () => {
      const user = userEvent.setup();
      renderWithKerb(<Example />);
      await focusSelected(user);

      await user.tab();
      await user.tab();

      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });
  });

  it("works controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithKerb(<Example value="overview" onValueChange={onValueChange} />);

    await user.click(tab("Outcome"));

    expect(onValueChange).toHaveBeenCalledWith("outcome");
    expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
  });

  it("skips disabled tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    renderWithKerb(
      <Tabs label="Steps" defaultValue="one">
        <Tabs.List>
          <Tabs.Tab value="one">One</Tabs.Tab>
          <Tabs.Tab value="two" disabled>
            Two
          </Tabs.Tab>
          <Tabs.Tab value="three">Three</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">1</Tabs.Panel>
        <Tabs.Panel value="two">2</Tabs.Panel>
        <Tabs.Panel value="three">3</Tabs.Panel>
      </Tabs>,
    );
    await user.tab();

    await user.keyboard("{ArrowRight}");

    expect(tab("Three")).toHaveFocus();
  });

  it("throws a clear error when a part is used outside Tabs", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderWithKerb(<Tabs.Tab value="x">X</Tabs.Tab>)).toThrow(
      "<Tabs.Tab> must be used inside <Tabs>.",
    );
    vi.restoreAllMocks();
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations", async () => {
        const { container } = renderWithKerb(<Example />);

        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
