"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import PropertyCard from "@/components/property/PropertyCard";
import type { Property } from "@/lib/types";

const PAGE_SIZE = 25;

export default function PagedCards({ items, resetKey }: { items: Property[]; resetKey?: string }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);

  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="pgrid">
        {pageItems.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
      <Pagination
        page={page}
        total={items.length}
        pageSize={PAGE_SIZE}
        onChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
