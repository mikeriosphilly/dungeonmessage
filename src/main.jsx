import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import bgWood from "./assets/bg_wood.jpg";

// Set the default background texture before React renders to avoid FOUC.
// Uses an <img> element rather than CSS background-image — see #page-bg in index.css.
const pageBgImg = document.getElementById("page-bg-img");
if (pageBgImg) pageBgImg.src = bgWood;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
