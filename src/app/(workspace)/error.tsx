"use client";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="space-y-4">
      <h1 className="font-serif text-3xl">The studio could not be loaded.</h1>
      <p className="text-secondary">Please try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
