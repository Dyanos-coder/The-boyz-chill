"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

/** Champ de recherche : met à jour ?q= dans l'adresse pendant la frappe (avec un petit délai). */
export function SearchBox({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function push(next: string) {
    const q = next.trim();
    startTransition(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
  }

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(next), 300);
  }

  return (
    <form
      role="search"
      className="search"
      data-pending={pending || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        push(value);
      }}
    >
      <Search className="i search__icon" aria-hidden="true" />
      <label htmlFor="search-plans" className="sr-only">
        Rechercher un plan
      </label>
      <input
        id="search-plans"
        className="input search__input"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search__clear"
          aria-label="Effacer la recherche"
          onClick={() => {
            clearTimeout(timer.current);
            setValue("");
            push("");
          }}
        >
          <X className="i" />
        </button>
      )}
    </form>
  );
}
