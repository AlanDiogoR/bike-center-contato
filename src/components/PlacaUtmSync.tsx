"use client";

import { useLayoutEffect } from "react";
import { isPlacaUtmSource } from "@/lib/query";

/**
 * Reforço depois da hidratação: se o React não mexeu no atributo, não há
 * escrita. Se mexeu, o ajuste acontece antes da pintura.
 */
export function PlacaUtmSync() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const placa = isPlacaUtmSource(window.location.search);
    const current = root.getAttribute("data-utm-source");
    if (placa && current !== "placa") {
      root.setAttribute("data-utm-source", "placa");
    } else if (!placa && current !== null) {
      root.removeAttribute("data-utm-source");
    }
  }, []);

  return null;
}
