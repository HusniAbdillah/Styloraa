"use client";
import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "@radix-ui/react-icons";
import styles from "./studio.module.css";
export function WardrobePhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={styles.noPhoto}>
      <ImageIcon width={28} height={28} aria-hidden="true" />
      <span>Photo unavailable</span>
    </div>
  ) : (
    <Image
      src={src}
      alt={name}
      fill
      unoptimized
      sizes="(max-width: 640px) 45vw, 240px"
      className={styles.itemPhoto}
      onError={() => setFailed(true)}
    />
  );
}
