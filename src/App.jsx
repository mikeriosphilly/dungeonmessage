import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import StartTable from "./pages/StartTable";
import JoinTable from "./pages/JoinTable";
import GmDashboard from "./pages/GmDashboard";
import PlayerFeed from "./pages/PlayerFeed";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/start" element={<StartTable />} />
      <Route path="/join" element={<JoinTable />} />
      <Route path="/gm/:code" element={<GmDashboard />} />
      <Route path="/table/:code" element={<PlayerFeed />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
