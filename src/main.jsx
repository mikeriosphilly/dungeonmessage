import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.jsx";
import "./index.css";
import bgWood from "./assets/bg_wood.jpg";

// Set background on body before React renders to avoid FOUC.
// Only body — not html — so the iOS status bar safe area shows the solid
// html { background-color } instead of the wood texture, matching the AppHeader.
// Inline styles cannot be overridden by any CSS rule (including Tailwind).
// Guard with typeof check because this module is also executed during SSG in Node.js.
if (typeof document !== "undefined") {
  document.body.style.backgroundImage = `url(${bgWood})`;
  document.body.style.backgroundRepeat = "repeat";
  document.body.style.backgroundSize = "960px auto";
}

export const createRoot = ViteReactSSG({ routes });
