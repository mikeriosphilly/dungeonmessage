import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import StartTable from "./pages/StartTable";
import JoinTable from "./pages/JoinTable";
import GmDashboard from "./pages/GmDashboard";
import PlayerFeed from "./pages/PlayerFeed";
import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import AppHeader from "./components/AppHeader";

function ensureAnonAuth() {
  return supabase.auth.getSession().then(({ data }) => {
    if (data?.session) return;
    return supabase.auth.signInAnonymously();
  });
}

export default function App() {
  useEffect(() => {
    ensureAnonAuth().catch(() => {
      // keep quiet for now, we will show a real error later if needed
    });
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<StartTable />} />
        <Route path="/join" element={<JoinTable />} />
        <Route path="/gm/:gmSecret" element={<GmDashboard />} />
        <Route path="/table/:code" element={<PlayerFeed />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
