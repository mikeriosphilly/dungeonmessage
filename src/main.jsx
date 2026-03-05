import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import bgWood from "./assets/bg_wood.jpg";

// Set background before React renders to avoid FOUC.
// Inline style cannot be overridden by any CSS rule (including Tailwind).
document.body.style.backgroundImage = `url(${bgWood})`;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
