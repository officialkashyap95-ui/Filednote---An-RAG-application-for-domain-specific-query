
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import WorkspacePage from "./pages/WorkspacePage";

function LandingRoute() {
  const navigate = useNavigate();

  return (
    <LandingPage
      onOpenWorkspace={() => navigate("/workspace")}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />

        <Route
          path="/workspace"
          element={<WorkspacePage />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
