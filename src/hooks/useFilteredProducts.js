import { useMemo } from "react";
import { useProducts } from "../context/ProductContext";

export function useFilteredProducts() {
  const { state } = useProducts();
  const { products, search, activeCat, sortBy, sortDir, page, pageSize } = state;

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchCat = activeCat === "all" || p.cat === activeCat;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name, "km");
      } else if (sortBy === "price") {
        const pa = parsePrice(a.price);
        const pb = parsePrice(b.price);
        cmp = pa - pb;
      } else if (sortBy === "cat") {
        cmp = a.cat.localeCompare(b.cat);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [products, search, activeCat, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const catCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.cat] = (counts[p.cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      withPrice: filtered.filter((p) => p.price).length,
      withoutPrice: filtered.filter((p) => !p.price).length,
      withImage: Object.keys(state.images).length,
    }),
    [filtered, state.images]
  );

  return { filtered, paginated, totalPages, catCounts, stats };
}

function parsePrice(price) {
  if (!price) return 0;
  const num = parseFloat(price.replace(/[^\d.]/g, ""));
  if (price.includes("$")) return num * 4100;
  return num || 0;
}
