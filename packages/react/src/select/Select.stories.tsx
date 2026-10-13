import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeColumns, forced, storyStyles } from "../internal/stories/helpers";
import { Select } from "./Select";

const countries = [
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "nl", label: "Netherlands" },
  { value: "pl", label: "Poland" },
];

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  args: {
    label: "Country",
    options: countries,
    defaultValue: "de",
    autoComplete: "country",
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
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

/** A disabled first option, shown until the person chooses. */
export const Placeholder: Story = {
  args: { defaultValue: undefined, placeholder: "Choose a country" },
};

export const WithHint: Story = {
  args: { hint: "Where we send your order" },
};

/** The border turns to the text colour inside the Kerb focus ring. */
export const Focus: Story = {
  render: (args) => (
    <Select
      {...args}
      label="Language"
      autoComplete="language"
      options={[
        { value: "de", label: "Deutsch" },
        { value: "en", label: "English" },
      ]}
      {...forced("focus", "focus-visible")}
    />
  ),
};

export const Error: Story = {
  args: {
    defaultValue: undefined,
    placeholder: "Choose a country",
    error: "Choose a country",
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Options can be passed as children, for groups or anything else the native element allows. */
export const OptionChildren: Story = {
  args: { options: undefined, defaultValue: "nl" },
  render: (args) => (
    <Select {...args}>
      <optgroup label="Central Europe">
        <option value="de">Germany</option>
        <option value="pl">Poland</option>
      </optgroup>
      <optgroup label="Western Europe">
        <option value="fr">France</option>
        <option value="nl">Netherlands</option>
      </optgroup>
    </Select>
  ),
};

/** Every state side by side. */
export const AllStates: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className={storyStyles.card}>
      <div className={storyStyles.fields}>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Default</p>
          <Select {...args} />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Focus</p>
          <Select {...args} {...forced("focus", "focus-visible")} />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Placeholder</p>
          <Select
            {...args}
            defaultValue={undefined}
            placeholder="Choose a country"
          />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Error</p>
          <Select
            {...args}
            defaultValue={undefined}
            placeholder="Choose a country"
            error="Choose a country"
          />
        </div>
        <div className={storyStyles.fieldState}>
          <p className={storyStyles.caption}>Disabled</p>
          <Select {...args} disabled />
        </div>
      </div>
    </div>
  ),
};

export const Themes: Story = {
  parameters: { wide: true },
  render: (args) => (
    <ThemeColumns>
      <Select {...args} />
    </ThemeColumns>
  ),
};
