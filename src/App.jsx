import { useState, useCallback } from "react";
import { useProducts } from "./context/ProductContext";
import { useFilteredProducts } from "./hooks/useFilteredProducts";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import StatsBar from "./components/StatsBar";
import Toolbar from "./components/Toolbar";
import ProductCard from "./components/ProductCard";
import Pagination from "./components/Pagination";
import AddProductModal from "./components/AddProductModal";
import "./styles/ProductCard.css";

export default function App() {
  const { state } = useProducts();
  const { paginated } = useFilteredProducts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (state.loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg)",
          color: "var(--acc)",
          fontFamily: "'Battambang', sans-serif",
          fontSize: "1.2rem",
        }}
      >
        កំពុងផ្ទុកទិន្នន័យ...
      </div>
    );
  }

  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <Header onToggleSidebar={toggleSidebar} onShowAdd={() => setShowAdd(true)} />

      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", minHeight: "calc(100vh - 62px)" }}>
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />

        <main style={{ flex: 1, padding: 18 }}>
          <StatsBar />
          <Toolbar />

          {paginated.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <p>រកមិនឃើញទំនិញ</p>
            </div>
          ) : (
            <div className="product-grid">
              {paginated.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                />
              ))}
            </div>
          )}

          <Pagination />
        </main>
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
