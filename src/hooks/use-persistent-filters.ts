"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type FilterValue = string | number | undefined;
type Filters = Record<string, FilterValue>;

/**
 * Syncs filter state with URL search params AND localStorage.
 * Priority: URL params > localStorage > defaults
 */
export function usePersistentFilters<T extends Filters>(
  storageKey: string,
  defaults: T
): [T, (updates: Partial<T>) => void, () => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function readFromUrl(): Partial<T> {
    const result: Partial<T> = {};
    for (const key of Object.keys(defaults)) {
      const val = searchParams.get(key);
      if (val !== null) {
        const defaultVal = defaults[key];
        if (typeof defaultVal === "number") {
          (result as Record<string, FilterValue>)[key] = Number(val);
        } else {
          (result as Record<string, FilterValue>)[key] = val;
        }
      }
    }
    return result;
  }

  function readFromStorage(): Partial<T> {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return {};
      return JSON.parse(stored) as Partial<T>;
    } catch {
      return {};
    }
  }

  function mergeFilters(): T {
    const fromStorage = readFromStorage();
    const fromUrl = readFromUrl();
    return { ...defaults, ...fromStorage, ...fromUrl } as T;
  }

  const [filters, setFiltersState] = useState<T>(() => mergeFilters());

  // Sync when URL changes (e.g., user presses browser back)
  useEffect(() => {
    setFiltersState(mergeFilters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const next = { ...filters, ...updates } as T;
      setFiltersState(next);

      // Persist to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }

      // Sync to URL
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, pathname, router, searchParams, storageKey]
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaults);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    router.push(pathname);
  }, [defaults, pathname, router, storageKey]);

  return [filters, setFilters, resetFilters];
}
