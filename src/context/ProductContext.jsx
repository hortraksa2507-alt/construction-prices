import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { DEFAULT_PRODUCTS } from "../data/products";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import {
  supabase,
  fetchProducts,
  upsertProduct,
  insertProduct,
  deleteProduct as dbDelete,
  subscribeToProducts,
} from "../utils/supabase";

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
  useCloud: !!supabase,
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
      const newProduct = { ...action.product, id: action.product.id || maxId + 1 };
      return { ...state, products: [...state.products, newProduct] };
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
    case "SET_IMAGE":
      return { ...state, images: { ...state.images, [action.id]: action.data } };
    case "REMOVE_IMAGE": {
      const ni = { ...state.images };
      delete ni[action.id];
      return { ...state, images: ni };
    }
    case "IMPORT_DATA":
      return { ...state, products: action.products, images: action.images, page: 1 };
    case "REALTIME_INSERT":
      if (state.products.find((p) => p.id === action.product.id)) return state;
      return { ...state, products: [...state.products, action.product] };
    case "REALTIME_UPDATE":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.product.id ? { ...action.product } : p
        ),
      };
    case "REALTIME_DELETE":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
      };
    default:
      return state;
  }
}

export function ProductProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimeout = useRef(null);
  const isCloud = state.useCloud;

  // Load initial data
  useEffect(() => {
    async function init() {
      if (isCloud) {
        const cloudProducts = await fetchProducts();
        if (cloudProducts && cloudProducts.length > 0) {
          dispatch({ type: "LOAD_DATA", products: cloudProducts, images: {} });
        } else {
          // First time: seed Supabase with default products
          if (supabase) {
            await supabase.from("products").upsert(
              DEFAULT_PRODUCTS.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                price2: p.price2,
                cat: p.cat,
              })),
              { onConflict: "id" }
            );
          }
          dispatch({ type: "LOAD_DATA", products: [...DEFAULT_PRODUCTS], images: {} });
        }
      } else {
        const stored = loadFromStorage();
        if (stored && stored.products?.length) {
          dispatch({ type: "LOAD_DATA", products: stored.products, images: stored.images });
        } else {
          dispatch({ type: "LOAD_DATA", products: [...DEFAULT_PRODUCTS], images: {} });
        }
      }
      const savedDark = localStorage.getItem("dark-mode") === "true";
      if (savedDark) dispatch({ type: "TOGGLE_DARK_MODE" });
    }
    init();
  }, [isCloud]);

  // Real-time subscription
  useEffect(() => {
    if (!isCloud) return;
    const channel = subscribeToProducts((payload) => {
      if (payload.eventType === "INSERT") {
        dispatch({ type: "REALTIME_INSERT", product: payload.new });
      } else if (payload.eventType === "UPDATE") {
        dispatch({ type: "REALTIME_UPDATE", product: payload.new });
      } else if (payload.eventType === "DELETE") {
        dispatch({ type: "REALTIME_DELETE", id: payload.old.id });
      }
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isCloud]);

  // Persist to localStorage (fallback when no cloud)
  const persist = useCallback(() => {
    if (isCloud) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveToStorage({ products: state.products, images: state.images });
    }, 300);
  }, [state.products, state.images, isCloud]);

  useEffect(() => {
    if (!state.loading) persist();
  }, [state.products, state.images, state.loading, persist]);

  // Dark mode
  useEffect(() => {
    if (!state.loading) {
      localStorage.setItem("dark-mode", state.darkMode);
      document.documentElement.setAttribute("data-theme", state.darkMode ? "dark" : "light");
    }
  }, [state.darkMode, state.loading]);

  // Wrap dispatch to sync with Supabase
  const cloudDispatch = useCallback(
    (action) => {
      dispatch(action);

      if (!isCloud) return;

      if (action.type === "ADD_PRODUCT") {
        const product = { name: action.product.name, price: action.product.price, price2: action.product.price2, cat: action.product.cat };
        insertProduct(product).then((inserted) => {
          if (inserted) {
            dispatch({ type: "REALTIME_UPDATE", product: inserted });
          }
        });
      } else if (action.type === "UPDATE_PRODUCT") {
        const current = state.products.find((p) => p.id === action.id);
        if (current) {
          upsertProduct({ ...current, [action.field]: action.value });
        }
      } else if (action.type === "DELETE_PRODUCT") {
        dbDelete(action.id);
      } else if (action.type === "IMPORT_DATA") {
        // Bulk upsert on import
        if (supabase && action.products) {
          supabase.from("products").upsert(
            action.products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              price2: p.price2,
              cat: p.cat,
            })),
            { onConflict: "id" }
          );
        }
      }
    },
    [isCloud, state.products]
  );

  return (
    <ProductContext.Provider value={{ state, dispatch: cloudDispatch }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
}
