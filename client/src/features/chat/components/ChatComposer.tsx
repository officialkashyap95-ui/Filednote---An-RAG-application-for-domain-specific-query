import { ArrowUp, SlidersHorizontal } from "lucide-react";
import { AddSourceMenu } from "../../sources/components/AddSourceMenu.tsx";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onUploadFiles: (files: File[]) => void;
  onPasteText: () => void;
  onAddSample: () => void;
  onOpenSettings: () => void;
  enterToSend: boolean;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  onUploadFiles,
  onPasteText,
  onAddSample,
  onOpenSettings,
  enterToSend,
}: Props) {
  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          value={value}
          onChange={(event) => {
            onChange(event.target.value);

            const textarea = event.currentTarget;
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
          }}
          onKeyDown={(event) => {
            if (enterToSend && event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask a question about your sources..."
          rows={1}
          aria-label="Message"
        />

        <div className="composer-actions">
          <div className="composer-left">
            <AddSourceMenu
              variant="icon"
              onUploadFiles={onUploadFiles}
              onPasteText={onPasteText}
              onAddSample={onAddSample}
            />

            <button
              type="button"
              className="composer-tool"
              onClick={onOpenSettings}
            >
              <SlidersHorizontal size={15} />
              <span>Answer settings</span>
            </button>
          </div>

          <div className="composer-right">
            <span className="enter-hint">
              {enterToSend ? "Enter to send" : "Enter for new line"}
            </span>
            <button
              type="button"
              className="send-button"
              onClick={onSend}
              disabled={!value.trim()}
              aria-label="Send message"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
