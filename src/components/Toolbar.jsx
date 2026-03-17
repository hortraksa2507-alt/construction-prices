import { useRef } from "react";
import { useProducts } from "../context/ProductContext";
import { exportData, importData } from "../utils/storage";
import "../styles/Toolbar.css";

export default function Toolbar() {
  const { state, dispatch } = useProducts();
  const importRef = useRef(null);

  function handleSort(e) {
    dispatch({ type: "SET_SORT", sortBy: e.target.value, sortDir: state.sortDir });
  }

  function toggleDir() {
    dispatch({
      type: "SET_SORT",
      sortBy: state.sortBy,
      sortDir: state.sortDir === "asc" ? "desc" : "asc",
    });
  }

  function handleExport() {
    exportData(state.products, state.images);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importData(file);
      dispatch({ type: "IMPORT_DATA", products: data.products, images: data.images });
    } catch (err) {
      alert("Import failed: " + err.message);
    }
    e.target.value = "";
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <select className="sort-select" value={state.sortBy} onChange={handleSort}>
          <option value="name">តម្រៀបតាមឈ្មោះ</option>
          <option value="price">តម្រៀបតាមតម្លៃ</option>
          <option value="cat">តម្រៀបតាមប្រភេទ</option>
        </select>
        <button className="sort-dir-btn" onClick={toggleDir} title="Toggle sort direction">
          {state.sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={handleExport}>
          📥 Export
        </button>
        <button className="toolbar-btn" onClick={() => importRef.current?.click()}>
          📤 Import
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImport}
        />
        <button className="toolbar-btn" onClick={handlePrint}>
          🖨️ Print
        </button>
      </div>
    </div>
  );
}
