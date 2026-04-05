import { Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import StartTable from "./pages/StartTable";
import JoinTable from "./pages/JoinTable";
import GmDashboard from "./pages/GmDashboard";
import PlayerFeed from "./pages/PlayerFeed";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import Layout from "./components/Layout";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    HydrateFallback: () => null,
    children: [
      { index: true, element: <Landing />, HydrateFallback: () => null },
      { path: "start", element: <StartTable /> },
      { path: "join", element: <JoinTable />, HydrateFallback: () => null },
      { path: "gm/:gmSecret", element: <GmDashboard /> },
      { path: "table/:code", element: <PlayerFeed /> },
      { path: "privacy", element: <Privacy /> },
      { path: "admin", element: <Admin /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];
