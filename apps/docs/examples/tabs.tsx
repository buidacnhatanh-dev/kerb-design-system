"use client";

import { Tabs } from "@kerb/react";

export default function TabsExample() {
  return (
    <Tabs label="Kerb at a glance" defaultValue="overview">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="tokens">Tokens</Tabs.Tab>
        <Tabs.Tab value="tests">Tests</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">
        <p>Kerb is a set of thirteen accessible React components with three themes.</p>
      </Tabs.Panel>
      <Tabs.Panel value="tokens">
        <p>Colours, type and spacing come from semantic tokens.</p>
      </Tabs.Panel>
      <Tabs.Panel value="tests">
        <p>Every story is checked with axe in light, dark and comfort.</p>
      </Tabs.Panel>
    </Tabs>
  );
}
