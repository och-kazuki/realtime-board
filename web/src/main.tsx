import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("画面を描く場所（id が root の要素）が見つからない");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
