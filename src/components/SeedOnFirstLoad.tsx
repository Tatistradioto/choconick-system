"use client";

import { useEffect, useRef } from "react";

export function SeedOnFirstLoad() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    fetch("/api/seed", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.message === "Seed concluído") window.location.reload();
      })
      .catch(() => {});
  }, []);
  return null;
}
