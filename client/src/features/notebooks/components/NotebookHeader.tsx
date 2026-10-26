import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Link2,
  MoreHorizontal,
  PanelRightOpen,
  Share2,
  Trash2,
} from "lucide-react";

type Props = {
  title: string;
  domain: string;
  sourceCount: number;
  onToggleSources: () => void;
  sourcePanelOpen: boolean;
  notebooks: string[];
  onSelectNotebook: (name: string) => void;
  onShare: () => void;
  onExport: () => void;
  onClear: () => void;
};

type Menu = "notebooks" | "options" | null;

export function NotebookHeader({
  title,
  onToggleSources,
  sourcePanelOpen,
  notebooks,
  onSelectNotebook,
  onShare,
  onExport,
  onClear,
}: Props) {
  const [menu, setMenu] = useState<Menu>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function run(action: () => void) {
    setMenu(null);
    action();
  }

  return (
    <header className="notebook-header" ref={headerRef}>
      <div className="menu-anchor">
        <button
          type="button"
          className="breadcrumb"
          aria-haspopup="menu"
          aria-expanded={menu === "notebooks"}
          onClick={() => setMenu(menu === "notebooks" ? null : "notebooks")}
        >
          <strong>{title}</strong>
          <ChevronDown size={14} />
        </button>

        {menu === "notebooks" && (
          <div className="menu menu--left" role="menu">
            {notebooks.map((name) => (
              <button
                key={name}
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => run(() => onSelectNotebook(name))}
              >
                <span>{name}</span>
                {name === title && <Check size={15} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="header-actions">
        <button
          className="header-button"
          type="button"
          onClick={() => run(onShare)}
        >
          <Share2 size={15} />
          Share
        </button>

        <div className="menu-anchor">
          <button
            className="header-button icon-only"
            type="button"
            aria-label="Notebook options"
            aria-haspopup="menu"
            aria-expanded={menu === "options"}
            onClick={() => setMenu(menu === "options" ? null : "options")}
          >
            <MoreHorizontal size={18} />
          </button>

          {menu === "options" && (
            <div className="menu menu--right" role="menu">
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => run(onShare)}
              >
                <Link2 size={15} />
                <span>Copy link</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => run(onExport)}
              >
                <Download size={15} />
                <span>Export conversation</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu-item menu-item--danger"
                onClick={() => run(onClear)}
              >
                <Trash2 size={15} />
                <span>Clear conversation</span>
              </button>
            </div>
          )}
        </div>

        <button
          className="header-button icon-only panel-toggle"
          type="button"
          onClick={onToggleSources}
          aria-label={sourcePanelOpen ? "Hide sources" : "Show sources"}
        >
          {sourcePanelOpen ? (
            <FileText size={17} />
          ) : (
            <PanelRightOpen size={17} />
          )}
        </button>
      </div>
    </header>
  );
}
