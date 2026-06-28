import { useEffect, useState } from "react";

/**
 * Утгыг саатуулж буцаана — хайлтын талбар товчлуур бүрт fetch хийхээс сэргийлнэ.
 * @param value мөшгих утга
 * @param delayMs саатуулах хугацаа (default 300мс)
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
