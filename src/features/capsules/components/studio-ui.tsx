import Link from "next/link";
import { WardrobePhoto } from "./wardrobe-photo";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BackpackIcon,
} from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import type { StudioItem } from "../types";
import styles from "./studio.module.css";

export function StudioHeading({
  title,
  description,
  back,
  children,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className={styles.heading}>
      {back ? (
        <Link className={styles.back} href={back.href}>
          <ArrowLeftIcon aria-hidden="true" />
          {back.label}
        </Link>
      ) : null}
      <div className={styles.titleRow}>
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {children}
      </div>
    </header>
  );
}

export function StudioLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={secondary ? styles.secondaryLink : styles.primaryLink}
      href={href}
    >
      {children}
      <ArrowRightIcon aria-hidden="true" />
    </Link>
  );
}

export function ItemVisual({
  item,
  compact = false,
}: {
  item: StudioItem;
  compact?: boolean;
}) {
  return (
    <div className={compact ? styles.compactVisual : styles.itemVisual}>
      {item.imageUrl ? (
        <WardrobePhoto
          key={item.imageUrl}
          src={item.imageUrl}
          name={item.name}
        />
      ) : (
        <div className={styles.noPhoto}>
          <BackpackIcon width={28} height={28} aria-hidden="true" />
          <span>Photo not added</span>
        </div>
      )}
    </div>
  );
}

export function PieceBoard({ items }: { items: StudioItem[] }) {
  return (
    <div className={styles.pieceBoard}>
      {items.slice(0, 4).map((item) => (
        <div className={styles.boardPiece} key={item.id}>
          <ItemVisual item={item} compact />
          <span>{item.name}</span>
        </div>
      ))}
      {!items.length ? <p>No pieces selected yet.</p> : null}
    </div>
  );
}

export function ItemGrid({
  items,
  preview = false,
}: {
  items: StudioItem[];
  preview?: boolean;
}) {
  return (
    <div className={styles.itemGrid}>
      {items.map((item) => (
        <article className={styles.itemCard} key={item.id}>
          <ItemVisual item={item} />
          <div className={styles.itemCopy}>
            <h3>{item.name}</h3>
            <p>
              {item.color} · {item.category}
            </p>
            {!item.available ? (
              <p className={styles.notice}>No longer available</p>
            ) : preview ? (
              <Link
                className={styles.textLink}
                href={`/wardrobe/${item.id}/preview`}
              >
                Preview this piece
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function StudioState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={styles.empty}>
      <span className={styles.emptyIcon}>
        <BackpackIcon width={28} height={28} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <div className={styles.muted}>{children}</div>
      {action}
    </section>
  );
}

export function StudioError({ message }: { message: string }) {
  return (
    <div role="alert" className={styles.error}>
      {message}
    </div>
  );
}

export function SourceNote({ source }: { source: string }) {
  return (
    <span className={styles.source}>
      {source === "live"
        ? "AI-assisted combination"
        : source === "sample"
          ? "Unavailable: this saved result is not live output"
          : "Arranged by you"}
    </span>
  );
}
