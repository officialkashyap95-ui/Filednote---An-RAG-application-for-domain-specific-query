
import { FileType, MoreHorizontal } from "lucide-react";
import type { SourceDocument } from "../../../types";

type Props = {
  sources: SourceDocument[];
  activeSourceId: string;
  onSelect: (id: string) => void;
};

export function SourcePanel({
  sources,
  activeSourceId,
  onSelect,
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
        <button
          type="button"
          key={source.id}
          className={`source-item ${
            source.id === activeSourceId ? "is-active" : ""
          }`}
          onClick={() => onSelect(source.id)}
        >
          <div className={`file-icon file-icon--${source.color}`}>
            <FileType size={17} />
          </div>

          <div className="source-item-text">
            <strong>{source.name}</strong>
            <span>
              {source.type}
              {source.pages ? ` · ${source.pages} pages` : ""}
            </span>
          </div>

          <MoreHorizontal size={16} className="source-more" />
        </button>
      ))}
    </div>
  );
}
