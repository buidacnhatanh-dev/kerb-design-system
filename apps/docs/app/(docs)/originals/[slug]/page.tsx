import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentPage } from "../../../../components/ComponentPage";
import { componentBySlug, components } from "../../../../lib/registry";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return components
    .filter((entry) => entry.group === "originals")
    .map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = componentBySlug((await params).slug);
  return { title: entry?.title };
}

export default async function Page({ params }: Params) {
  const entry = componentBySlug((await params).slug);
  if (!entry || entry.group !== "originals") notFound();
  return <ComponentPage entry={entry} />;
}
