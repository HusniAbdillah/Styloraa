"use client";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({ reset }: { reset: () => void }) { return <div role="alert" className="space-y-4"><h1 className="font-serif text-3xl">Studio belum dapat dimuat.</h1><p className="text-secondary">Coba kembali beberapa saat lagi.</p><Button onClick={reset}>Coba lagi</Button></div>; }
