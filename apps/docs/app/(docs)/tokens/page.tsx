import type { Metadata } from "next";
import { ContentPage } from "../../../components/ContentPage";
import * as content from "../../../content/pages/tokens.mdx";

export const metadata: Metadata = { title: "Tokens" };

export default function Page() {
  return <ContentPage file="pages/tokens.mdx" content={content} />;
}
