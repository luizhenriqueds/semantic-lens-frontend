"use client";

import { useEffect, useState } from "react";

// A JSON value in localStorage, kept in sync across hooks and tabs via a custom
// event (same tab) and the native `storage` event (other tabs).
export function createStore<T>(key: string, fallback: T) {
  const event = `${key}-change`;

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch (err) {
      console.warn(`Failed to read ${key} from localStorage`, err);
      return fallback;
    }
  };

  const write = (value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event(event));
    } catch (err) {
      console.warn(`Failed to write ${key} to localStorage`, err);
    }
  };

  const useValue = (): T => {
    const [value, setValue] = useState<T>(fallback);
    useEffect(() => {
      const sync = () => setValue(read());
      sync();
      window.addEventListener(event, sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener(event, sync);
        window.removeEventListener("storage", sync);
      };
    }, []);
    return value;
  };

  return { read, write, useValue };
}
