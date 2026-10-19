
import {
  ChevronDown,
  FileText,
  MoreHorizontal,
  PanelRightOpen,
  Share2,
} from "lucide-react";

type Props = {
  title: string;
  domain: string;
  sourceCount: number;
  onToggleSources: () => void;
  sourcePanelOpen: boolean;
};

export function NotebookHeader({
  title,
  onToggleSources,
  sourcePanelOpen,
}: Props) {
  return (
    <header className="notebook-header">
      <div className="breadcrumb">
        <strong>{title}</strong>
        <ChevronDown size={14} />
      </div>

      <div className="header-actions">
        <button className="header-button" type="button">
          <Share2 size={15} />
          Share
        </button>

        <button
          className="header-button icon-only"
          type="button"
          aria-label="Notebook options"
        >
          <MoreHorizontal size={18} />
        </button>

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
