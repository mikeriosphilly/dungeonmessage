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

  // vite-react-ssg injects <link> preloads and a <script> hydration tag as
  // direct children of #root alongside the React-rendered content. React's
  // virtual DOM doesn't include those nodes, so hydrateRoot sees a child-
  // count mismatch and occasionally inserts a second React tree instead of
  // activating the existing SSR HTML. Remove the non-React nodes before
  // hydration so the DOM matches exactly what React expects.
  const root = document.getElementById("root");
  if (root) {
    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeName === "LINK" || node.nodeName === "SCRIPT") {
        root.removeChild(node);
      }
    });
  }
}

export const createRoot = ViteReactSSG({ routes });
