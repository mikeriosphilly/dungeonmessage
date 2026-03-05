import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import bgWood from "./assets/bg_wood.jpg";

// Set background on body before React renders to avoid FOUC.
// Only body — not html — so the iOS status bar safe area shows the solid
// html { background-color } instead of the wood texture, matching the AppHeader.
// Inline styles cannot be overridden by any CSS rule (including Tailwind).
document.body.style.backgroundImage = `url(${bgWood})`;
document.body.style.backgroundRepeat = "repeat";
document.body.style.backgroundSize = "960px auto";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
