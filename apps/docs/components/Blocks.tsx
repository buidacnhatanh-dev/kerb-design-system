import type { PropsTableData } from "../lib/props";
import { CheckIcon, CrossIcon } from "./Icons";
import { TableScroll } from "./TableScroll";

export function UseAvoid({ use, avoid }: { use: string[]; avoid: string[] }) {
  return (
    <div className="use-avoid">
      <section className="use-card" aria-labelledby="use-for">
        <h3 id="use-for">
          <CheckIcon /> Use for
        </h3>
        <ul>
          {use.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="avoid-card" aria-labelledby="avoid-for">
        <h3 id="avoid-for">
          <CrossIcon /> Avoid for
        </h3>
        <ul>
          {avoid.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export type KeyboardRow = { keys: string[]; action: string };

export function KeyboardTable({ rows }: { rows: KeyboardRow[] }) {
  if (rows.length === 0) {
    return <p>No keyboard interaction of its own.</p>;
  }
  return (
    <TableScroll label="Keyboard">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Keys</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.keys.join("+") + row.action}>
              <td>
                {row.keys.map((key, index) => (
                  <span key={key}>
                    {index > 0 && " "}
                    <kbd>{key}</kbd>
                  </span>
                ))}
              </td>
              <td>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

export function PropsTables({ tables }: { tables: PropsTableData[] }) {
  return (
    <>
      {tables.map((table) => (
        <TableScroll key={table.heading} label={`Props of ${table.heading}`}>
          <table className="table">
            {tables.length > 1 && (
              <caption>
                <code>{table.heading}</code>
              </caption>
            )}
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row">
                    <code>{row.name}</code>
                    {row.required && <span className="required">Required</span>}
                  </th>
                  <td className="type-cell">
                    <code>{row.type}</code>
                  </td>
                  <td>{row.defaultValue ? <code>{row.defaultValue}</code> : "–"}</td>
                  <td>{row.description || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      ))}
    </>
  );
}

export function OnThisPage({ items }: { items: Array<{ id: string; title: string }> }) {
  return (
    <nav className="on-this-page" aria-labelledby="on-this-page">
      <p id="on-this-page" className="rail-label">
        On this page
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="kerb-focusable">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
