import type { Metadata } from "next";
import { ContentPage } from "../../../components/ContentPage";
import * as content from "../../../content/pages/focus.mdx";

export const metadata: Metadata = { title: "Focus" };

export default function Page() {
  return <ContentPage file="pages/focus.mdx" content={content} />;
}
