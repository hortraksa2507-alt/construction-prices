import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ProductProvider } from "./context/ProductContext";
import "./styles/index.css";

// Telegram Mini App integration
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  document.body.classList.add("telegram-webapp");

  // Match Telegram's color scheme
  if (tg.colorScheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("dark-mode", "true");
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProductProvider>
      <App />
    </ProductProvider>
  </React.StrictMode>
);
