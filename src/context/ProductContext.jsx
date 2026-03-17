import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { DEFAULT_PRODUCTS } from "../data/products";
import { loadFromStorage, saveToStorage } from "../utils/storage";

const ProductContext = createContext(null);

const initialState = {
  products: [],
  images: {},
  search: "",
  activeCat: "all",
  sortBy: "name",
  sortDir: "asc",
  page: 1,
  pageSize: 50,
  loading: true,
  darkMode: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_DATA":
      return { ...state, products: action.products, images: action.images || {}, loading: false };
    case "SET_PRODUCTS":
      return { ...state, products: action.products, page: 1 };
    case "SET_IMAGES":
      return { ...state, images: action.images };
    case "SET_SEARCH":
      return { ...state, search: action.value, page: 1 };
    case "SET_CATEGORY":
      return { ...state, activeCat: action.value, page: 1 };
    case "SET_SORT":
      return { ...state, sortBy: action.sortBy, sortDir: action.sortDir, page: 1 };
    case "SET_PAGE":
      return { ...state, page: action.value };
    case "TOGGLE_DARK_MODE":
      return { ...state, darkMode: !state.darkMode };
    case "ADD_PRODUCT": {
      const maxId = state.products.reduce((m, p) => Math.max(m, p.id), 0);
      return { ...state, products: [...state.products, { ...action.product, id: maxId + 1 }] };
    }
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, [action.field]: action.value } : p
        ),
      };
    case "DELETE_PRODUCT": {
      const newImages = { ...state.images };
      delete newImages[action.id];
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
        images: newImages,
      };
    }
    case "SET_IMAGE": {
      return { ...state, images: { ...state.images, [action.id]: action.data } };
    }
    case "REMOVE_IMAGE": {
      const ni = { ...state.images };
      delete ni[action.id];
      return { ...state, images: ni };
    }
    case "IMPORT_DATA":
      return { ...state, products: action.products, images: action.images, page: 1 };
    default:
      return state;
  }
}

export function ProductProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimeout = useRef(null);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored && stored.products?.length) {
      dispatch({ type: "LOAD_DATA", products: stored.products, images: stored.images });
    } else {
      dispatch({ type: "LOAD_DATA", products: [...DEFAULT_PRODUCTS], images: {} });
    }
    const savedDark = localStorage.getItem("dark-mode") === "true";
    if (savedDark) dispatch({ type: "TOGGLE_DARK_MODE" });
  }, []);

  const persist = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveToStorage({ products: state.products, images: state.images });
    }, 300);
  }, [state.products, state.images]);

  useEffect(() => {
    if (!state.loading) persist();
  }, [state.products, state.images, state.loading, persist]);

  useEffect(() => {
    if (!state.loading) {
      localStorage.setItem("dark-mode", state.darkMode);
      document.documentElement.setAttribute("data-theme", state.darkMode ? "dark" : "light");
    }
  }, [state.darkMode, state.loading]);

  return (
    <ProductContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
}
