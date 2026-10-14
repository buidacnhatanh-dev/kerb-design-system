import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="home">
      <h1>Page not found</h1>
      <p className="lead">
        There is no page at this address. <Link href="/">Go to the home page</Link>{" "}
        or press <kbd>/</kbd> to search.
      </p>
    </main>
  );
}
