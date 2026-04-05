import { Outlet } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./Footer";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function ensureAnonAuth() {
  return supabase.auth.getSession().then(({ data }) => {
    if (data?.session) return;
    return supabase.auth.signInAnonymously();
  });
}

export default function Layout() {
  useEffect(() => {
    ensureAnonAuth().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      <Footer />
      <Analytics />
    </div>
  );
}
