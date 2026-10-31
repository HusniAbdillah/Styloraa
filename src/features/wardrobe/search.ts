type SearchableWardrobeItem = {
  name: string;
  category: string;
  color: string;
  subcategory: string | null;
  notes: string;
  attributes: unknown;
  inferred_attributes?: unknown;
};

function appendSearchValues(value: unknown, values: string[]) {
  if (typeof value === "string" || typeof value === "number") {
    values.push(String(value));
    return;
  }
  if (typeof value === "boolean") {
    values.push(value ? "true" : "false");
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) appendSearchValues(entry, values);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      values.push(key);
      appendSearchValues(entry, values);
    }
  }
}

export function wardrobeSearchText(item: SearchableWardrobeItem) {
  const values = [
    item.name,
    item.category,
    item.color,
    item.subcategory ?? "",
    item.notes,
  ];
  appendSearchValues(item.attributes, values);
  appendSearchValues(item.inferred_attributes, values);
  return values.join(" ").toLocaleLowerCase();
}

export function wardrobeItemMatchesSearch(
  item: SearchableWardrobeItem,
  search: string,
) {
  const needle = search.trim().toLocaleLowerCase();
  return !needle || wardrobeSearchText(item).includes(needle);
}
