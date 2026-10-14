import type { Metadata } from "next";
import { ContentPage } from "../../../components/ContentPage";
import * as content from "../../../content/pages/theming.mdx";

export const metadata: Metadata = { title: "Theming" };

export default function Page() {
  return <ContentPage file="pages/theming.mdx" content={content} />;
}
