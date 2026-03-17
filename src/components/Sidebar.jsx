import { useProducts } from "../context/ProductContext";
import { useFilteredProducts } from "../hooks/useFilteredProducts";
import { CATEGORIES } from "../data/categories";
import "../styles/Sidebar.css";

export default function Sidebar({ open, onClose }) {
  const { state, dispatch } = useProducts();
  const { catCounts } = useFilteredProducts();

  return (
    <>
      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <h3>ប្រភេទទំនិញ</h3>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-btn ${state.activeCat === c.key ? "active" : ""}`}
            onClick={() => {
              dispatch({ type: "SET_CATEGORY", value: c.key });
              onClose();
            }}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
            <span className="cat-count">
              {c.key === "all" ? state.products.length : catCounts[c.key] || 0}
            </span>
          </button>
        ))}
      </aside>
    </>
  );
}
