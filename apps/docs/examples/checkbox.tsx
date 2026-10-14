"use client";

import { Checkbox } from "@kerb/react";
import { useState } from "react";

const toppings = ["Basil", "Olives", "Peppers"];

export default function CheckboxExample() {
  const [chosen, setChosen] = useState<string[]>(["Basil"]);
  const all = chosen.length === toppings.length;
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={{ fontWeight: 700 }}>Toppings</legend>
      <Checkbox
        label="All toppings"
        checked={all}
        indeterminate={chosen.length > 0 && !all}
        onChange={() => setChosen(all ? [] : toppings)}
      />
      {toppings.map((topping) => (
        <Checkbox
          key={topping}
          label={topping}
          checked={chosen.includes(topping)}
          onChange={(event) =>
            setChosen((current) =>
              event.target.checked
                ? [...current, topping]
                : current.filter((item) => item !== topping),
            )
          }
        />
      ))}
    </fieldset>
  );
}
