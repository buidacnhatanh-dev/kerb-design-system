import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe, forEachTheme, renderWithKerb } from "../../test/utils";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("associates the visible label with the input", () => {
    renderWithKerb(<TextField label="Email" />);

    const input = screen.getByLabelText("Email");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("textbox", { name: "Email" })).toBe(input);
    expect(screen.getByText("Email")).toBeVisible();
  });

  it("generates an id, and uses the one passed in", () => {
    renderWithKerb(
      <>
        <TextField label="Email" />
        <TextField label="Phone" />
        <TextField label="City" id="city" />
      </>,
    );

    const email = screen.getByLabelText("Email");
    const phone = screen.getByLabelText("Phone");
    expect(email.id).not.toBe("");
    expect(email.id).not.toBe(phone.id);
    expect(screen.getByLabelText("City")).toHaveAttribute("id", "city");
  });

  it("forwards its ref and remaining props to the input, and className to the wrapper", () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = renderWithKerb(
      <TextField
        ref={ref}
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        className="grid-cell"
      />,
    );

    expect(ref.current).toBe(screen.getByLabelText("Email"));
    expect(ref.current).toHaveAttribute("type", "email");
    expect(ref.current).toHaveAttribute("name", "email");
    expect(ref.current).toHaveAttribute("autocomplete", "email");
    expect(ref.current).toBeRequired();
    expect(ref.current).not.toHaveClass("grid-cell");
    expect(container.firstElementChild).toHaveClass("grid-cell");
  });

  it("works controlled and uncontrolled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithKerb(
      <>
        <TextField label="Email" defaultValue="nhat" />
        <TextField label="Phone" value="0151" onChange={onChange} />
      </>,
    );

    await user.type(screen.getByLabelText("Email"), "anh");
    await user.type(screen.getByLabelText("Phone"), "2");

    expect(screen.getByLabelText("Email")).toHaveValue("nhatanh");
    expect(screen.getByLabelText("Phone")).toHaveValue("0151");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  describe("description", () => {
    it("has none without a hint or an error", () => {
      renderWithKerb(<TextField label="Email" />);

      expect(screen.getByLabelText("Email")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("is the hint when there is only a hint", () => {
      renderWithKerb(<TextField label="Email" hint="For booking updates" />);

      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "For booking updates",
      );
    });

    it("is the error when there is only an error", () => {
      renderWithKerb(
        <TextField label="Email" error="Enter a full email address" />,
      );

      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "Enter a full email address",
      );
    });

    it("lists the hint, then the error", () => {
      renderWithKerb(
        <TextField
          label="Email"
          hint="For booking updates"
          error="Enter a full email address"
        />,
      );
      const input = screen.getByLabelText("Email");

      expect(input).toHaveAccessibleDescription(
        "For booking updates Enter a full email address",
      );
      const [hintId, errorId] = (
        input.getAttribute("aria-describedby") ?? ""
      ).split(" ");
      expect(document.getElementById(hintId ?? "")).toHaveTextContent(
        "For booking updates",
      );
      expect(document.getElementById(errorId ?? "")).toHaveTextContent(
        "Enter a full email address",
      );
    });

    it("keeps a description id passed by the consumer", () => {
      renderWithKerb(
        <>
          <TextField
            label="Email"
            hint="For booking updates"
            aria-describedby="terms"
          />
          <p id="terms">We never share it.</p>
        </>,
      );

      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "We never share it. For booking updates",
      );
    });
  });

  describe("error", () => {
    it("sets aria-invalid only when there is an error", () => {
      const { rerender } = renderWithKerb(<TextField label="Email" />);
      expect(screen.getByLabelText("Email")).not.toHaveAttribute(
        "aria-invalid",
      );

      rerender(<TextField label="Email" error="Enter a full email address" />);
      expect(screen.getByLabelText("Email")).toHaveAttribute(
        "aria-invalid",
        "true",
      );

      rerender(<TextField label="Email" error="" />);
      expect(screen.getByLabelText("Email")).not.toHaveAttribute(
        "aria-invalid",
      );
    });

    it("shows an icon and text, not only colour", () => {
      renderWithKerb(
        <TextField label="Email" error="Enter a full email address" />,
      );
      const message = screen.getByText("Enter a full email address");

      expect(message).toBeVisible();
      expect(message.parentElement?.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("is not a live region", () => {
      renderWithKerb(
        <TextField label="Email" error="Enter a full email address" />,
      );
      const row = screen.getByText("Enter a full email address").parentElement;

      expect(row).not.toHaveAttribute("aria-live");
      expect(row).not.toHaveAttribute("role");
    });
  });

  describe("label", () => {
    it("never uses the placeholder as the label", () => {
      renderWithKerb(
        <TextField label="Email" placeholder="name@example.com" />,
      );

      const input = screen.getByPlaceholderText("name@example.com");
      expect(input).toHaveAccessibleName("Email");
      expect(screen.getByText("Email").tagName).toBe("LABEL");
    });

    it("makes a field without a label a type error", () => {
      // The assertion is the @ts-expect-error line: `pnpm typecheck` fails if it compiles
      // @ts-expect-error -- label is required, a placeholder does not replace it
      const field = <TextField placeholder="Email" />;
      expect(field).toBeTruthy();
    });

    it('adds "(optional)" after the label', () => {
      renderWithKerb(<TextField label="Phone" optional />);

      expect(screen.getByLabelText("Phone (optional)")).toBeInTheDocument();
    });
  });

  describe("hit area", () => {
    it("treats a press on the padding around the input as a press on the input", async () => {
      const user = userEvent.setup();
      renderWithKerb(<TextField label="Email" />);
      const input = screen.getByLabelText("Email");
      const hitArea = input.parentElement?.parentElement as HTMLElement;

      await user.pointer({ keys: "[MouseLeft>]", target: hitArea });

      expect(input).toHaveFocus();
    });

    it("does not focus a disabled input", async () => {
      const user = userEvent.setup();
      renderWithKerb(<TextField label="Email" disabled />);
      const input = screen.getByLabelText("Email");
      const hitArea = input.parentElement?.parentElement as HTMLElement;

      await user.pointer({ keys: "[MouseLeft>]", target: hitArea });

      expect(input).not.toHaveFocus();
    });
  });

  describe("disabled", () => {
    it("uses the native disabled attribute", () => {
      renderWithKerb(<TextField label="Email" disabled />);

      expect(screen.getByLabelText("Email")).toBeDisabled();
    });
  });

  describe("password", () => {
    it("has a Show password toggle that reveals and hides the value", async () => {
      const user = userEvent.setup();
      renderWithKerb(<TextField label="Password" type="password" />);
      const input = screen.getByLabelText("Password");
      const toggle = screen.getByRole("button", { name: "Show password" });

      expect(input).toHaveAttribute("type", "password");
      expect(toggle).toHaveAttribute("aria-pressed", "false");
      expect(toggle).toHaveAttribute("type", "button");
      expect(toggle).toHaveAttribute("aria-controls", input.id);

      await user.click(toggle);
      expect(input).toHaveAttribute("type", "text");
      expect(toggle).toHaveAttribute("aria-pressed", "true");
      expect(toggle).toHaveAccessibleName("Show password");

      await user.click(toggle);
      expect(input).toHaveAttribute("type", "password");
      expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("reaches the toggle with Tab and toggles with Space and Enter", async () => {
      const user = userEvent.setup();
      renderWithKerb(<TextField label="Password" type="password" />);
      const input = screen.getByLabelText("Password");
      const toggle = screen.getByRole("button", { name: "Show password" });

      await user.tab();
      expect(input).toHaveFocus();
      await user.tab();
      expect(toggle).toHaveFocus();

      await user.keyboard(" ");
      expect(input).toHaveAttribute("type", "text");
      await user.keyboard("{Enter}");
      expect(input).toHaveAttribute("type", "password");
    });

    it("has no toggle on other types", () => {
      renderWithKerb(<TextField label="Email" type="email" />);

      expect(screen.queryByRole("button")).toBeNull();
    });

    it("does not reveal a disabled field", async () => {
      const user = userEvent.setup();
      renderWithKerb(<TextField label="Password" type="password" disabled />);
      const toggle = screen.getByRole("button", { name: "Show password" });

      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "type",
        "password",
      );
    });
  });

  describe("accessibility", () => {
    forEachTheme(() => {
      it("has no axe violations in every state", async () => {
        const { container } = renderWithKerb(
          <>
            <TextField
              label="Email"
              hint="For booking updates"
              placeholder="name@example.com"
            />
            <TextField
              label="Email"
              hint="For booking updates"
              defaultValue="nhatanh@example.com"
            />
            <TextField
              label="Email"
              hint="For booking updates"
              defaultValue="nhatanh@"
              error="Enter a full email address"
            />
            <TextField
              label="Email"
              hint="For booking updates"
              defaultValue="nhatanh@example.com"
              disabled
            />
            <TextField label="Phone" type="tel" optional />
            <TextField label="Password" type="password" />
          </>,
        );

        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
