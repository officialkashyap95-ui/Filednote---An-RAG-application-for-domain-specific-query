import { FileType, Trash2 } from "lucide-react";
import type { SourceDocument } from "../../../types";

type Props = {
  sources: SourceDocument[];
  activeSourceId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

export function SourcePanel({
  sources,
  activeSourceId,
  onSelect,
  onRemove,
}: Props) {
  if (sources.length === 0) {
    return (
      <div className="source-list source-list--empty">
        <div className="sources-empty">
          <FileType size={20} />
          <strong>No matching sources</strong>
          <span>Try another search term.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="source-list">
      {sources.map((source) => (
        <div
          key={source.id}
          className={`source-item ${
            source.id === activeSourceId ? "is-active" : ""
          }`}
        >
          <button
            type="button"
            className="source-select"
            onClick={() => onSelect(source.id)}
          >
            <span className={`file-icon file-icon--${source.color}`}>
              {source.type}
            </span>

            <span className="source-item-text">
              <strong>{source.name}</strong>
              <span>
                {source.type}
                {source.pages ? ` · ${source.pages} pages` : ""}
              </span>
            </span>
          </button>

          <button
            type="button"
            className="source-remove"
            aria-label={`Remove ${source.name}`}
            title="Remove source"
            onClick={() => onRemove(source.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
