
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  ChevronRight,
  Gift,
  LogOut,
  SlidersHorizontal,
  Sparkles,
  FileText,
  GraduationCap,
  Leaf,
  Plus,
  Search,
  Scale,
  Settings2,
  Stethoscope,
  X,
} from "lucide-react";
import type { AuthUser } from "../lib/api";

type Props = {
  activeDomain: string;
  activeNotebook: string;
  onDomainChange: (domain: string) => void;
  onNotebookChange: (notebook: string) => void;
  open: boolean;
  onClose: () => void;
  user: AuthUser;
  onLogout: () => void | Promise<void>;
  signingOut: boolean;
};

const domains = [
  { name: "Education", icon: GraduationCap, available: true },
  { name: "Legal", icon: Scale, available: false },
  { name: "Agriculture", icon: Leaf, available: false },
  { name: "Medical", icon: Stethoscope, available: false },
];

const notebooks = [
  "Computer Networks",
  "Data Structures",
  "Python Fundamentals",
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppSidebar({
  activeDomain,
  activeNotebook,
  onDomainChange,
  onNotebookChange,
  open,
  onClose,
  user,
  onLogout,
  signingOut,
}: Props) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(event.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWorkspaceMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogoutClick() {
    if (signingOut) return;

    // Close the menu and invoke the logout handler supplied by App.tsx.
    setWorkspaceMenuOpen(false);
    await onLogout();
  }

  return (
    <aside className={`app-sidebar ${open ? "app-sidebar--open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">
          <BookOpen size={18} />
        </div>

        <span>fieldnotes</span>

        <button
          className="icon-button mobile-close"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <div className="sidebar-scroll">
        <button
          className="new-notebook-button"
          type="button"
          onClick={() => onNotebookChange("Untitled notebook")}
        >
          <Plus size={16} />
          <span>New notebook</span>
          <kbd>⌘ N</kbd>
        </button>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className="nav-item" type="button">
            <Search size={17} />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>

          <button className="nav-item" type="button">
            <FileText size={17} />
            <span>All notebooks</span>
          </button>
        </nav>

        <section className="sidebar-section">
          <div className="section-label">
            <span>DOMAINS</span>
            <ChevronDown size={13} />
          </div>

          {domains.map(({ name, icon: Icon, available }) => (
            <button
              key={name}
              type="button"
              className={`domain-item ${
                activeDomain === name ? "is-active" : ""
              }`}
              onClick={() => {
                if (available) onDomainChange(name);
              }}
              title={available ? name : "Coming soon"}
              disabled={!available}
            >
              <Icon size={17} />
              <span>{name}</span>
              {!available && <span className="soon-dot" />}
            </button>
          ))}
        </section>

        <section className="sidebar-section notebooks-section">
          <div className="section-label">
            <span>RECENT NOTEBOOKS</span>
            <button
              type="button"
              aria-label="Create notebook"
              onClick={() => onNotebookChange("Untitled notebook")}
            >
              <Plus size={14} />
            </button>
          </div>

          {notebooks.map((notebook, index) => (
            <button
              key={notebook}
              type="button"
              className={`notebook-item ${
                activeNotebook === notebook ? "is-active" : ""
              }`}
              onClick={() => onNotebookChange(notebook)}
            >
              <span
                className={`notebook-dot ${
                  index === 0
                    ? "dot-blue"
                    : index === 1
                      ? "dot-amber"
                      : "dot-rose"
                }`}
              />
              <span>{notebook}</span>
            </button>
          ))}
        </section>
      </div>

      <div className="sidebar-bottom">
        <div className="workspace-menu-container" ref={workspaceMenuRef}>
          {workspaceMenuOpen && (
            <div
              className="workspace-menu-popup"
              role="dialog"
              aria-label="Account menu"
            >
              <button
                className="account-menu-identity"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <span className="account-menu-avatar">
                  {getInitials(user.name)}
                </span>

                <span className="account-menu-identity-copy">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>

                <ChevronRight size={18} />
              </button>

              <div className="account-menu-divider" />

              <button
                className="workspace-menu-item"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <Sparkles size={19} />
                <span>Explore plans</span>
              </button>

              <button
                className="workspace-menu-item"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <SlidersHorizontal size={19} />
                <span>Personalization</span>
              </button>

              <button
                className="workspace-menu-item"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <CircleUserRound size={19} />
                <span>Profile</span>
              </button>

              <button
                className="workspace-menu-item"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <Settings2 size={19} />
                <span>Settings</span>
              </button>

              <div className="account-menu-divider" />

              <button
                className="workspace-menu-item"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <CircleHelp size={19} />
                <span>Help</span>
                <ChevronRight
                  className="account-menu-trailing"
                  size={17}
                />
              </button>

              <button
                className="workspace-menu-item"
                type="button"
                onClick={handleLogoutClick}
                disabled={signingOut}
              >
                <LogOut size={19} />
                <span>
                  {signingOut ? "Logging out..." : "Log out"}
                </span>
              </button>

              <button
                className="account-menu-offer"
                type="button"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <Gift size={18} />
                <span>Explore Fieldnotes features</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`user-profile ${
              workspaceMenuOpen ? "user-profile--open" : ""
            }`}
            aria-expanded={workspaceMenuOpen}
            aria-haspopup="dialog"
            onClick={() =>
              setWorkspaceMenuOpen((current) => !current)
            }
          >
            <span className="user-avatar">{getInitials(user.name)}</span>

            <span className="user-profile-info">
              <strong>{user.name}</strong>
              <small>Personal account</small>
            </span>

            <ChevronDown
              size={18}
              className={`workspace-chevron ${
                workspaceMenuOpen ? "workspace-chevron--open" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
