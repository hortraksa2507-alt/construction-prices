import { useState, memo } from "react";
import { useProducts } from "../context/ProductContext";
import { CATEGORIES } from "../data/categories";

const ProductCard = memo(function ProductCard({ product, style }) {
  const { state, dispatch } = useProducts();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  const cat = CATEGORIES.find((c) => c.key === product.cat);
  const hasImage = !!state.images[product.id];

  function startEdit(field) {
    setEditingField(field);
    setEditValue(product[field] || "");
  }

  function saveEdit() {
    dispatch({ type: "UPDATE_PRODUCT", id: product.id, field: editingField, value: editValue });
    setEditingField(null);
  }

  function cancelEdit() {
    setEditingField(null);
  }

  function handleDelete() {
    if (confirm("លុបទំនិញនេះ?")) {
      dispatch({ type: "DELETE_PRODUCT", id: product.id });
    }
  }

  function handleImageClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        dispatch({ type: "SET_IMAGE", id: product.id, data: ev.target.result });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function handleRemoveImage(e) {
    e.stopPropagation();
    dispatch({ type: "REMOVE_IMAGE", id: product.id });
  }

  return (
    <div className="product-card" style={style}>
      <div className="card-image" onClick={handleImageClick}>
        {hasImage ? (
          <>
            <img src={state.images[product.id]} alt={product.name} loading="lazy" />
            <button className="remove-image-btn" onClick={handleRemoveImage}>
              ✕
            </button>
          </>
        ) : (
          <span className="placeholder">{cat?.icon || "📦"}</span>
        )}
        <div className="upload-overlay">
          <span>📷</span>
          <span>ដាក់រូបភាព</span>
        </div>
      </div>

      <div className="card-body">
        <div className="card-tag">
          {cat?.icon} {cat?.label}
        </div>

        {editingField === "name" ? (
          <div>
            <input
              className="edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <div className="edit-actions">
              <button className="save-btn" onClick={saveEdit}>រក្សាទុក</button>
              <button className="cancel-btn" onClick={cancelEdit}>បោះបង់</button>
            </div>
          </div>
        ) : (
          <div className="card-name" onClick={() => startEdit("name")}>
            {product.name}
          </div>
        )}

        <div className="card-prices">
          {editingField === "price" ? (
            <div style={{ width: "100%" }}>
              <input
                className="edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <div className="edit-actions">
                <button className="save-btn" onClick={saveEdit}>រក្សាទុក</button>
                <button className="cancel-btn" onClick={cancelEdit}>បោះបង់</button>
              </div>
            </div>
          ) : (
            <>
              {product.price ? (
                <span className="price-tag" onClick={() => startEdit("price")}>
                  {product.price}
                </span>
              ) : (
                <span className="price-tag empty" onClick={() => startEdit("price")}>
                  + តម្លៃ
                </span>
              )}
              {product.price2 && (
                <span className="price-tag" onClick={() => startEdit("price2")}>
                  {product.price2}
                </span>
              )}
            </>
          )}
        </div>

        <div className="card-actions">
          <button onClick={() => startEdit("name")}>✏️ កែឈ្មោះ</button>
          <button onClick={() => startEdit("price")}>💰 កែតម្លៃ</button>
          <button className="delete-btn" onClick={handleDelete}>🗑️ លុប</button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
