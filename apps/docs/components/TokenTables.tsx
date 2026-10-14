import tokens from "@kerb/tokens";
import { TableScroll } from "./TableScroll";

type Theme = "light" | "dark" | "comfort";
const themes: Theme[] = ["light", "dark", "comfort"];

/** WCAG relative luminance of a #RRGGBB colour */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

/** Colour tokens per theme, with the contrast against that theme's background worked out at build time */
export function ColorTokens() {
  const names = Object.keys(tokens.light.color) as Array<keyof typeof tokens.light.color>;
  return (
    <TableScroll label="Colour tokens">
      <table className="table">
        <caption>Colour tokens and their contrast against <code>color.bg</code></caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            {themes.map((theme) => (
              <th key={theme} scope="col">
                {theme[0]!.toUpperCase() + theme.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((name) => (
            <tr key={name}>
              <th scope="row">
                <code>--kerb-color-{name}</code>
              </th>
              {themes.map((theme) => {
                const value = String(tokens[theme].color[name]);
                const bg = String(tokens[theme].color.bg);
                return (
                  <td key={theme}>
                    <span className="swatch" style={{ backgroundColor: value }} aria-hidden="true" />
                    <code>{value}</code>
                    {isHex(value) && isHex(bg) && name !== "bg" && (
                      <span className="required">{contrast(value, bg).toFixed(1)} : 1</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

export function TypeTokens() {
  const sizes = tokens.light.font.size;
  const lines = tokens.light.font.lineHeight as Record<string, number>;
  const comfort = tokens.comfort.font.size as Record<string, string>;
  return (
    <TableScroll label="Type scale">
      <table className="table">
        <caption>Type scale</caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Size</th>
            <th scope="col">Line height</th>
            <th scope="col">Comfort size</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(sizes).map(([name, size]) => (
            <tr key={name}>
              <th scope="row">
                <code>--kerb-font-size-{name}</code>
              </th>
              <td>{String(size)}</td>
              <td>{lines[name] ?? "–"}</td>
              <td>{comfort[name] ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

export function ScaleTokens({ scale }: { scale: "space" | "radius" }) {
  const values = tokens.light[scale] as Record<string, string>;
  return (
    <TableScroll label={scale === "space" ? "Spacing tokens" : "Radius tokens"}>
      <table className="table">
        <caption>{scale === "space" ? "Spacing" : "Radius"}</caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(values).map(([name, value]) => (
            <tr key={name}>
              <th scope="row">
                <code>
                  --kerb-{scale}-{name}
                </code>
              </th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
