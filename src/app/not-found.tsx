import Link from "next/link";
export default function NotFound() {
  return (
    <main className="space-y-5 p-12">
      <h1 className="font-serif text-4xl">Page not found.</h1>
      <Link href="/create" className="text-primary underline">
        Back to the studio
      </Link>
    </main>
  );
}
