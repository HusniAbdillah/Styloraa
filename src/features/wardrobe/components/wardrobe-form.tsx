"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addWardrobeItem } from "../actions";
import { categories } from "../schema";
const inputClass = "mt-2 block min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2";
export function WardrobeForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(addWardrobeItem, { ok: false, message: "" });
  return <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-6"><h2 className="font-serif text-2xl">Tambah item</h2><p className="text-sm text-secondary">Semua pengunjung memakai wardrobe demo yang sama.</p><fieldset disabled={!enabled || pending} className="space-y-4 disabled:opacity-60"><label className="block text-sm">Nama item<input name="name" required minLength={2} maxLength={100} className={inputClass} placeholder="Kemeja linen" /></label><label className="block text-sm">Kategori<select name="category" className={inputClass}>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label><label className="block text-sm">Warna<input name="color" required maxLength={40} className={inputClass} placeholder="Cream" /></label><Button type="submit" disabled={!enabled || pending}>{pending ? "Menyimpan…" : "Tambah ke wardrobe"}</Button></fieldset><p role="status" aria-live="polite" className="text-sm text-secondary">{state.message || (!enabled ? "Hubungkan Supabase dan aktifkan penulisan demo untuk menyimpan." : "")}</p></form>;
}
