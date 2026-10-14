import type { Metadata } from "next";
import { ContentPage } from "../../../components/ContentPage";
import * as content from "../../../content/pages/install.mdx";

export const metadata: Metadata = { title: "Install" };

export default function Page() {
  return <ContentPage file="pages/install.mdx" content={content} />;
}
