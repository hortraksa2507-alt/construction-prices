import { useProducts } from "../context/ProductContext";
import { useFilteredProducts } from "../hooks/useFilteredProducts";

export default function Pagination() {
  const { state, dispatch } = useProducts();
  const { totalPages } = useFilteredProducts();

  if (totalPages <= 1) return null;

  const { page } = state;

  function goTo(p) {
    dispatch({ type: "SET_PAGE", value: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>
        ‹
      </button>
      {start > 1 && (
        <>
          <button className="page-btn" onClick={() => goTo(1)}>1</button>
          {start > 2 && <span className="page-info">...</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn ${p === page ? "active" : ""}`}
          onClick={() => goTo(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="page-info">...</span>}
          <button className="page-btn" onClick={() => goTo(totalPages)}>{totalPages}</button>
        </>
      )}
      <button className="page-btn" disabled={page === totalPages} onClick={() => goTo(page + 1)}>
        ›
      </button>
    </div>
  );
}
