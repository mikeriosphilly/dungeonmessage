import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // SSG via vite-react-ssg. Pre-renders / and /join at build time for SEO.
  //
  // ⚠️  PATCH DEPENDENCY: patches/react-router-dom+7.12.0.patch shims the
  // missing ./server.js export so vite-react-ssg works with react-router-dom v7.
  // If you upgrade react-router-dom, re-run `npm run build` and verify the SSG
  // step succeeds ("Rendering Pages... (2)"). If it breaks, regenerate the patch:
  //   npx patch-package react-router-dom
  ssgOptions: {
    includedRoutes: (paths) =>
      paths.filter((p) => {
        const normalized = p.startsWith("/") ? p : `/${p}`;
        return ["/", "/join"].includes(normalized);
      }),
  },
});
