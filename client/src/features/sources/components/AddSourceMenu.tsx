import { useEffect, useRef, useState } from "react";
import { ClipboardPaste, FileText, Plus, Upload } from "lucide-react";

type Props = {
  variant: "icon" | "wide";
  onUploadFiles: (files: File[]) => void;
  onPasteText: () => void;
  onAddSample: () => void;
};

export function AddSourceMenu({
  variant,
  onUploadFiles,
  onPasteText,
  onAddSample,
}: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!anchorRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="menu-anchor" ref={anchorRef}>
      {variant === "icon" ? (
        <button
          type="button"
          className="composer-plus"
          aria-label="Add source"
          title="Add source"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <Plus size={18} />
        </button>
      ) : (
        <button
          type="button"
          className="add-source-button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <Plus size={16} />
          Add source
        </button>
      )}

      {open && (
        <div
          className={`menu ${variant === "icon" ? "menu--up" : "menu--wide"}`}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => run(() => inputRef.current?.click())}
          >
            <Upload size={16} />
            <span>Upload files</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => run(onPasteText)}
          >
            <ClipboardPaste size={16} />
            <span>Paste text</span>
          </button>
          <div className="account-menu-divider" />
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => run(onAddSample)}
          >
            <FileText size={16} />
            <span>Add sample source</span>
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.docx,.txt"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) onUploadFiles(files);
        }}
      />
    </div>
  );
}
