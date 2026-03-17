import { useState } from "react";
import { useProducts } from "../context/ProductContext";
import { CATEGORIES } from "../data/categories";
import "../styles/Modal.css";

export default function AddProductModal({ onClose }) {
  const { dispatch } = useProducts();
  const [form, setForm] = useState({ name: "", price: "", price2: "", cat: "pipe" });

  function handleSubmit() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_PRODUCT", product: { ...form, name: form.name.trim() } });
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h2>➕ បន្ថែមទំនិញថ្មី</h2>

        <label>ឈ្មោះទំនិញ</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="ឧ: ទីប_21_(5.០)"
          autoFocus
          onKeyDown={handleKeyDown}
        />

        <label>តម្លៃ</label>
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="ឧ: 4000រ"
          onKeyDown={handleKeyDown}
        />

        <label>តម្លៃ២ (ជម្រើស)</label>
        <input
          value={form.price2}
          onChange={(e) => setForm({ ...form, price2: e.target.value })}
          placeholder="ឧ: 8000រ/Kg"
          onKeyDown={handleKeyDown}
        />

        <label>ប្រភេទ</label>
        <select
          value={form.cat}
          onChange={(e) => setForm({ ...form, cat: e.target.value })}
        >
          {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
            <option key={c.key} value={c.key}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>

        <div className="modal-actions">
          <button className="confirm-btn" onClick={handleSubmit}>បន្ថែម</button>
          <button className="cancel-btn" onClick={onClose}>បោះបង់</button>
        </div>
      </div>
    </div>
  );
}
