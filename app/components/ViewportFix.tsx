"use client";

import { useEffect } from "react";

export default function ViewportFix() {
  useEffect(() => {
    const content = "width=device-width, initial-scale=1, viewport-fit=cover";
    let meta = document.querySelector(
      'meta[name="viewport"]',
    ) as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  }, []);

  return null;
}

