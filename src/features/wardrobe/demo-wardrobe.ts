import type { StaticImageData } from "next/image";
import image10001 from "@/assets/10001.jpg";
import image10007 from "@/assets/10007.jpg";
import image10008 from "@/assets/10008.jpg";
import image10016 from "@/assets/10016.jpg";
import image10021 from "@/assets/10021.jpg";
import image10023 from "@/assets/10023.jpg";
import image10024 from "@/assets/10024.jpg";
import image10027 from "@/assets/10027.jpg";
import image10029 from "@/assets/10029.jpg";
import image10032 from "@/assets/10032.jpg";
import image10033 from "@/assets/10033.jpg";
import image10034 from "@/assets/10034.jpg";
import image10035 from "@/assets/10035.jpg";
import image10037 from "@/assets/10037.jpg";
import image10039 from "@/assets/10039.jpg";
import image10040 from "@/assets/10040.jpg";
import image10041 from "@/assets/10041.jpg";
import image10042 from "@/assets/10042.jpg";
import image10052 from "@/assets/10052.jpg";
import image10054 from "@/assets/10054.jpg";

export type DemoWardrobeEntry = {
  id: string;
  name: string;
  category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory";
  color: string;
  subcategory: string;
  notes: string;
  attributes: Record<string, string | string[]>;
  imageName: string;
  image: StaticImageData;
};

export const demoWardrobeEntries: DemoWardrobeEntry[] = [
  {
    id: "sample-10001",
    name: "Blue denim A-line skirt",
    category: "bottom",
    color: "Blue",
    subcategory: "Denim skirt",
    notes: "Easy to pair with a tucked tee on a sunny afternoon.",
    attributes: {
      material: "denim",
      pattern: "solid",
      silhouette: "A-line",
      length: "above knee",
      style: ["casual", "classic"],
    },
    imageName: "10001.jpg",
    image: image10001,
  },
  {
    id: "sample-10007",
    name: "Color-pop graphic T-shirt",
    category: "top",
    color: "White",
    subcategory: "Printed short-sleeve tee",
    notes: "A playful graphic adds a bright note to simple layers.",
    attributes: {
      material: "cotton",
      pattern: "graphic print",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["casual", "playful"],
    },
    imageName: "10007.jpg",
    image: image10007,
  },
  {
    id: "sample-10008",
    name: "Black illustrated T-shirt",
    category: "top",
    color: "Black",
    subcategory: "Graphic tee",
    notes: "A relaxed graphic layer for low-key weekends.",
    attributes: {
      material: "cotton",
      pattern: "graphic print",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["casual", "streetwear"],
    },
    imageName: "10008.jpg",
    image: image10008,
  },
  {
    id: "sample-10016",
    name: "Pink garden-print dress",
    category: "dress",
    color: "Pink",
    subcategory: "Sleeveless floral dress",
    notes: "A cheerful one-piece for brunch or a daytime event.",
    attributes: {
      material: "woven fabric",
      pattern: "floral",
      fit: "fit and flare",
      length: "knee length",
      style: ["romantic", "playful"],
    },
    imageName: "10016.jpg",
    image: image10016,
  },
  {
    id: "sample-10021",
    name: "White training shorts",
    category: "bottom",
    color: "White",
    subcategory: "Athletic shorts",
    notes: "Lightweight shorts for a warm-up or an easy day outside.",
    attributes: {
      material: "performance fabric",
      pattern: "solid",
      fit: "relaxed",
      length: "above knee",
      style: ["sporty", "casual"],
    },
    imageName: "10021.jpg",
    image: image10021,
  },
  {
    id: "sample-10023",
    name: "Charcoal straight-leg trousers",
    category: "bottom",
    color: "Charcoal",
    subcategory: "Straight-leg pants",
    notes: "A simple dark neutral that works with both tees and knits.",
    attributes: {
      material: "stretch twill",
      pattern: "solid",
      fit: "straight",
      length: "full length",
      style: ["casual", "utility"],
    },
    imageName: "10023.jpg",
    image: image10023,
  },
  {
    id: "sample-10024",
    name: "Make Your Self graphic tee",
    category: "top",
    color: "Black",
    subcategory: "Text-print T-shirt",
    notes: "Bold lettering gives a monochrome outfit a little attitude.",
    attributes: {
      material: "cotton",
      pattern: "text graphic",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["streetwear", "casual"],
    },
    imageName: "10024.jpg",
    image: image10024,
  },
  {
    id: "sample-10027",
    name: "Fox sketch T-shirt",
    category: "top",
    color: "White",
    subcategory: "Illustrated tee",
    notes: "An easy white layer with a hand-drawn look.",
    attributes: {
      material: "cotton",
      pattern: "animal illustration",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["casual", "playful"],
    },
    imageName: "10027.jpg",
    image: image10027,
  },
  {
    id: "sample-10029",
    name: "Navy zip-front hoodie",
    category: "outerwear",
    color: "Navy",
    subcategory: "Zip hoodie",
    notes: "A soft extra layer for cool mornings and late evenings.",
    attributes: {
      material: "fleece",
      pattern: "solid",
      fit: "relaxed",
      sleeve: "long sleeve",
      style: ["sporty", "casual"],
    },
    imageName: "10029.jpg",
    image: image10029,
  },
  {
    id: "sample-10032",
    name: "Retro graphic T-shirt",
    category: "top",
    color: "Black",
    subcategory: "Vintage-print tee",
    notes: "A nostalgic print makes this an easy conversation piece.",
    attributes: {
      material: "cotton",
      pattern: "retro graphic",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["casual", "nostalgic"],
    },
    imageName: "10032.jpg",
    image: image10032,
  },
  {
    id: "sample-10033",
    name: "Black mesh training shorts",
    category: "bottom",
    color: "Black",
    subcategory: "Running shorts",
    notes: "A practical pair for a quick run or a relaxed gym session.",
    attributes: {
      material: "performance fabric",
      pattern: "solid",
      fit: "relaxed",
      length: "above knee",
      style: ["sporty", "casual"],
    },
    imageName: "10033.jpg",
    image: image10033,
  },
  {
    id: "sample-10034",
    name: "Black patterned track top",
    category: "top",
    color: "Black",
    subcategory: "Long-sleeve athletic top",
    notes: "A streamlined layer for an early walk or cool workout.",
    attributes: {
      material: "performance knit",
      pattern: "tonal stripe",
      fit: "regular",
      sleeve: "long sleeve",
      style: ["sporty", "minimal"],
    },
    imageName: "10034.jpg",
    image: image10034,
  },
  {
    id: "sample-10035",
    name: "Grey everyday running shoes",
    category: "shoes",
    color: "Grey",
    subcategory: "Running shoes",
    notes: "Cushioned trainers for errands, walks, and active days.",
    attributes: {
      material: "mesh and synthetic",
      pattern: "color block",
      fit: "lace-up",
      use: "running",
      style: ["sporty", "casual"],
    },
    imageName: "10035.jpg",
    image: image10035,
  },
  {
    id: "sample-10037",
    name: "Grey and yellow running shoes",
    category: "shoes",
    color: "Grey and yellow",
    subcategory: "Cushioned trainers",
    notes: "A pop of yellow livens up a practical running shoe.",
    attributes: {
      material: "mesh and synthetic",
      pattern: "color block",
      fit: "lace-up",
      use: "running",
      style: ["sporty", "bright"],
    },
    imageName: "10037.jpg",
    image: image10037,
  },
  {
    id: "sample-10039",
    name: "Silver-blue training shoes",
    category: "shoes",
    color: "Silver and blue",
    subcategory: "Running sneakers",
    notes: "A lightweight-looking pair for everyday movement.",
    attributes: {
      material: "mesh and synthetic",
      pattern: "color block",
      fit: "lace-up",
      use: "training",
      style: ["sporty", "casual"],
    },
    imageName: "10039.jpg",
    image: image10039,
  },
  {
    id: "sample-10040",
    name: "White striped polo shirt",
    category: "top",
    color: "White and yellow",
    subcategory: "Short-sleeve polo",
    notes: "A clean collar and soft stripes make an easy smart-casual top.",
    attributes: {
      material: "cotton blend",
      pattern: "horizontal stripe",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["classic", "sporty"],
    },
    imageName: "10040.jpg",
    image: image10040,
  },
  {
    id: "sample-10041",
    name: "Earth-tone striped polo",
    category: "top",
    color: "Brown and charcoal",
    subcategory: "Striped polo shirt",
    notes: "Muted stripes bring a little texture to a neutral outfit.",
    attributes: {
      material: "cotton blend",
      pattern: "horizontal stripe",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["classic", "casual"],
    },
    imageName: "10041.jpg",
    image: image10041,
  },
  {
    id: "sample-10042",
    name: "Raspberry pink polo",
    category: "top",
    color: "Raspberry",
    subcategory: "Short-sleeve polo",
    notes: "A saturated pink layer brightens dark denim or neutral trousers.",
    attributes: {
      material: "cotton blend",
      pattern: "solid",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["classic", "bright"],
    },
    imageName: "10042.jpg",
    image: image10042,
  },
  {
    id: "sample-10052",
    name: "Black running shorts",
    category: "bottom",
    color: "Black",
    subcategory: "Lightweight sports shorts",
    notes: "A simple activewear staple for warm-weather workouts.",
    attributes: {
      material: "performance fabric",
      pattern: "solid",
      fit: "relaxed",
      length: "short",
      style: ["sporty", "minimal"],
    },
    imageName: "10052.jpg",
    image: image10052,
  },
  {
    id: "sample-10054",
    name: "Purple rugby polo",
    category: "top",
    color: "Purple",
    subcategory: "Short-sleeve rugby shirt",
    notes: "A bold team-style top for a relaxed, sporty outfit.",
    attributes: {
      material: "cotton blend",
      pattern: "graphic logo",
      fit: "regular",
      sleeve: "short sleeve",
      style: ["sporty", "statement"],
    },
    imageName: "10054.jpg",
    image: image10054,
  },
];

const imageByName: Record<string, StaticImageData> = Object.fromEntries(
  demoWardrobeEntries.map((entry) => [entry.imageName, entry.image]),
);
const entryByImageName = new Map(
  demoWardrobeEntries.map((entry) => [entry.imageName, entry]),
);

export function getDemoWardrobeEntry(id: string) {
  return demoWardrobeEntries.find((entry) => entry.id === id) ?? null;
}

export function isDemoWardrobeEntryId(id: unknown): id is string {
  return typeof id === "string" && getDemoWardrobeEntry(id) !== null;
}

export function getLocalSeedWardrobeEntryId(provenance: unknown) {
  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance))
    return null;
  const details = provenance as Record<string, unknown>;
  if (details.demo_sample !== true || details.source !== "local_seed")
    return null;
  if (
    typeof details.static_entry_id === "string" &&
    getDemoWardrobeEntry(details.static_entry_id)
  )
    return details.static_entry_id;
  const imageName = details.demo_image;
  return typeof imageName === "string"
    ? (entryByImageName.get(imageName)?.id ?? null)
    : null;
}

export function getLocalSeedWardrobeImage(provenance: unknown) {
  if (
    !provenance ||
    typeof provenance !== "object" ||
    Array.isArray(provenance)
  )
    return null;
  const details = provenance as Record<string, unknown>;
  if (details.demo_sample !== true || details.source !== "local_seed")
    return null;
  const imageName = details.demo_image;
  return typeof imageName === "string"
    ? (imageByName[imageName] ?? null)
    : null;
}
