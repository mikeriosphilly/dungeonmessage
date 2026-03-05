import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import bgWood from "./assets/bg_wood.jpg";

// Set background on both html and body before React renders.
// html covers safe area strips on iOS; body covers the main content area.
// Inline styles cannot be overridden by any CSS rule (including Tailwind).
function applyBg(img, size) {
  for (const el of [document.documentElement, document.body]) {
    el.style.backgroundImage = `url(${img})`;
    el.style.backgroundRepeat = "repeat";
    el.style.backgroundSize = size;
  }
}
applyBg(bgWood, "960px auto");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
