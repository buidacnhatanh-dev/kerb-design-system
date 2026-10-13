import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeColumns, forced, storyStyles } from "../internal/stories/helpers";
import { TextField } from "./TextField";

const meta: Meta<typeof TextField> = {
  title: "Components/TextField",
  component: TextField,
  args: {
    label: "Email",
    hint: "For booking updates",
    type: "email",
    autoComplete: "email",
  },
  decorators: [
    // One field in a narrow column, unless the story asks for the full width
    (Story, { parameters }) =>
      parameters.wide ? (
        <Story />
      ) : (
        <div className={storyStyles.narrow}>
          <Story />
        </div>
      ),
  ],
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Empty: Story = {
  args: { placeholder: "name@example.com" },
};

/** The border turns to the text colour inside the Kerb focus ring. */
export const Focus: Story = {
  render: (args) => (
    <TextField
      {...args}
      defaultValue="nhat"
      {...forced("focus", "focus-visible")}
    />
  ),
};

export const Filled: Story = {
  args: { defaultValue: "nhatanh@example.com" },
};

/** Red border, icon and text. The message is part of the field's description. */
export const Error: Story = {
  args: { defaultValue: "nhatanh@", error: "Enter a full email address" },
};

export const Disabled: Story = {
  args: { defaultValue: "nhatanh@example.com", disabled: true },
};

export const Optional: Story = {
  args: {
    label: "Phone",
    hint: "Only used if there is a problem with your booking",
    type: "tel",
    autoComplete: "tel",
    optional: true,
  },
};

/** The button inside the field shows or hides the password. */
export const Password: Story = {
  args: {
    label: "Password",
    hint: "At least 12 characters",
    type: "password",
    autoComplete: "new-password",
    defaultValue: "correct horse battery",
  },
};

export const WithoutHint: Story = {
  args: {
    label: "Full name",
    hint: undefined,
    type: "text",
    autoComplete: "name",
  },
};

/** Every state side by side, as on the design board. */
export const AllStates: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className={storyStyles.card}>
      <div className={storyStyles.fields}>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Empty</p>
          <TextField {...args} placeholder="name@example.com" />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Focus</p>
          <TextField
            {...args}
            defaultValue="nhat"
            {...forced("focus", "focus-visible")}
          />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Filled</p>
          <TextField {...args} defaultValue="nhatanh@example.com" />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Error</p>
          <TextField
            {...args}
            defaultValue="nhatanh@"
            error="Enter a full email address"
          />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Disabled</p>
          <TextField {...args} defaultValue="nhatanh@example.com" disabled />
        </div>
      </div>
    </div>
  ),
};

export const Themes: Story = {
  parameters: { wide: true },
  render: (args) => (
    <ThemeColumns>
      <TextField {...args} placeholder="name@example.com" />
    </ThemeColumns>
  ),
};
