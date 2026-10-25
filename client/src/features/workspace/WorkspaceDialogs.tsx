import { useEffect, useRef, useState, type ReactNode } from "react";
import { FileText, Search, X } from "lucide-react";
import type { AuthUser } from "../../lib/api";
import type { SourceDocument } from "../../types";

export type DialogKind =
  | "search"
  | "notebooks"
  | "settings"
  | "profile"
  | "help"
  | "paste";

export type AnswerSettings = {
  showCitations: boolean;
  enterToSend: boolean;
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type SearchProps = {
  mode: "search" | "notebooks";
  notebooks: string[];
  sources: SourceDocument[];
  activeNotebook: string;
  onOpenNotebook: (name: string) => void;
  onOpenSource: (id: string) => void;
  onClose: () => void;
};

export function SearchDialog({
  mode,
  notebooks,
  sources,
  activeNotebook,
  onOpenNotebook,
  onOpenSource,
  onClose,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const matchedNotebooks = notebooks.filter((n) => n.toLowerCase().includes(q));
  const matchedSources =
    mode === "search"
      ? sources.filter((s) => s.name.toLowerCase().includes(q))
      : [];
  const empty = matchedNotebooks.length === 0 && matchedSources.length === 0;

  function openFirst() {
    if (matchedNotebooks[0]) onOpenNotebook(matchedNotebooks[0]);
    else if (matchedSources[0]) onOpenSource(matchedSources[0].id);
  }

  return (
    <Modal
      title={mode === "search" ? "Search" : "All notebooks"}
      onClose={onClose}
    >
      <label className="modal-search">
        <Search size={16} />
        <input
          ref={inputRef}
          value={query}
          placeholder={
            mode === "search"
              ? "Search notebooks and sources"
              : "Find a notebook"
          }
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") openFirst();
          }}
        />
      </label>

      <div className="modal-results">
        {matchedNotebooks.length > 0 && (
          <>
            {mode === "search" && <p className="modal-group">Notebooks</p>}
            {matchedNotebooks.map((name) => (
              <button
                key={name}
                type="button"
                className={`modal-result ${
                  name === activeNotebook ? "is-active" : ""
                }`}
                onClick={() => onOpenNotebook(name)}
              >
                <FileText size={16} />
                <span>{name}</span>
              </button>
            ))}
          </>
        )}

        {matchedSources.length > 0 && (
          <>
            <p className="modal-group">Sources</p>
            {matchedSources.map((source) => (
              <button
                key={source.id}
                type="button"
                className="modal-result"
                onClick={() => onOpenSource(source.id)}
              >
                <FileText size={16} />
                <span>{source.name}</span>
              </button>
            ))}
          </>
        )}

        {empty && <p className="modal-empty">Nothing matches “{query}”.</p>}
      </div>
    </Modal>
  );
}

export function SettingsDialog({
  settings,
  onChange,
  onClose,
}: {
  settings: AnswerSettings;
  onChange: (next: AnswerSettings) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Answer settings" onClose={onClose}>
      <label className="setting-row">
        <span>
          <strong>Show source references</strong>
          <small>Display the citation chips under each answer.</small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={settings.showCitations}
          onChange={(event) =>
            onChange({ ...settings, showCitations: event.target.checked })
          }
        />
      </label>

      <label className="setting-row">
        <span>
          <strong>Press Enter to send</strong>
          <small>
            When off, Enter adds a new line and you send with the button.
          </small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={settings.enterToSend}
          onChange={(event) =>
            onChange({ ...settings, enterToSend: event.target.checked })
          }
        />
      </label>
    </Modal>
  );
}

export function ProfileDialog({
  user,
  onClose,
}: {
  user: AuthUser;
  onClose: () => void;
}) {
  return (
    <Modal title="Profile" onClose={onClose}>
      <dl className="profile-list">
        <div>
          <dt>Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd>Personal</dd>
        </div>
      </dl>
    </Modal>
  );
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Help" onClose={onClose}>
      <p className="modal-text">
        Add documents to a notebook, ask questions about them, and open the
        source reference under an answer to see where it came from.
      </p>
      <dl className="shortcut-list">
        <div>
          <dt>Search notebooks and sources</dt>
          <dd>
            <kbd>⌘ K</kbd> or <kbd>Ctrl K</kbd>
          </dd>
        </div>
        <div>
          <dt>Send a message</dt>
          <dd>
            <kbd>Enter</kbd>
          </dd>
        </div>
        <div>
          <dt>New line in a message</dt>
          <dd>
            <kbd>Shift Enter</kbd>
          </dd>
        </div>
        <div>
          <dt>Close a dialog or menu</dt>
          <dd>
            <kbd>Esc</kbd>
          </dd>
        </div>
      </dl>
    </Modal>
  );
}

export function PasteDialog({
  onAdd,
  onClose,
}: {
  onAdd: (title: string, text: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  return (
    <Modal title="Paste text" onClose={onClose}>
      <div className="modal-form">
        <label>
          Title
          <input
            value={title}
            placeholder="Untitled note"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label>
          Text
          <textarea
            value={text}
            rows={8}
            placeholder="Paste your notes or an excerpt here"
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="modal-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-primary"
            disabled={!text.trim()}
            onClick={() => onAdd(title.trim() || "Untitled note", text.trim())}
          >
            Add source
          </button>
        </div>
      </div>
    </Modal>
  );
}
