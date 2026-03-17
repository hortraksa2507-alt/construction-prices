import { useProducts } from "../context/ProductContext";
import "../styles/Header.css";

export default function Header({ onToggleSidebar, onShowAdd }) {
  const { state, dispatch } = useProducts();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <button className="hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
            ☰
          </button>
          <div className="logo">
            <span className="logo-icon">🏗️</span>
            <div>
              <h1>តម្លៃសម្ភារៈសំណង់</h1>
              <p>Construction Material Prices</p>
            </div>
          </div>
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="ស្វែងរកទំនិញ..."
            value={state.search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", value: e.target.value })}
          />
        </div>

        <div className="header-actions">
          <button
            className={`icon-btn ${state.darkMode ? "active" : ""}`}
            onClick={() => dispatch({ type: "TOGGLE_DARK_MODE" })}
            title={state.darkMode ? "Light Mode" : "Dark Mode"}
          >
            {state.darkMode ? "☀️" : "🌙"}
          </button>
          <button className="add-btn" onClick={onShowAdd}>
            ＋ បន្ថែមទំនិញ
          </button>
        </div>
      </div>
    </header>
  );
}
