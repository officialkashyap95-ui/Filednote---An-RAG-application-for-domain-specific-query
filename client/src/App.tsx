
import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import WorkspacePage from "./pages/WorkspacePage";
import AuthPage from "./pages/AuthPage";
import { api, type AuthUser } from "./lib/api";

type MeResponse = {
  user: AuthUser;
};

function LandingRoute() {
  const navigate = useNavigate();

  return (
    <LandingPage
      onOpenWorkspace={() => navigate("/login")}
      onOpenLogin={() => navigate("/login?mode=login")}
    />
  );
}

function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    api<MeResponse>("/api/auth/me")
      .then((result) => {
        if (active) {
          setUser(result.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, setUser, checking };
}

function LoginRoute() {
  const { user, checking } = useCurrentUser();
  const location = useLocation();

  if (checking) {
    return <main style={{ padding: 32 }}>Checking session...</main>;
  }

  if (user) {
    return <Navigate to="/workspace" replace />;
  }

  return <AuthPage key={location.search} />;
}

function AuthenticatedWorkspace() {
  const { user, setUser, checking } = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await api<void>("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);

      // Navigate to the landing page with a full browser navigation.
      window.location.assign("/");
    } catch (error) {
      console.error("Logout failed:", error);

      window.alert(
        error instanceof Error
          ? `Logout failed: ${error.message}`
          : "Could not log out. Please try again.",
      );

      setSigningOut(false);
    }
  }, [setUser, signingOut]);

  if (checking) {
    return <main style={{ padding: 32 }}>Checking session...</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WorkspacePage
      user={user}
      onLogout={handleSignOut}
      signingOut={signingOut}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/workspace"
          element={<AuthenticatedWorkspace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}