import { ArrowUp, Plus, SlidersHorizontal } from "lucide-react";

type Props = {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onAttach: () => void;
};

export function ChatComposer({
    value,
    onChange,
    onSend,
    onAttach,
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
                        if (event.key === "Enter" && !event.shiftKey) {
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
                        <button
                            type="button"
                            className="composer-tool"
                            onClick={onAttach}
                        >
                            <Plus size={16} />
                            <span>Add source</span>
                        </button>

                        <button type="button" className="composer-tool">
                            <SlidersHorizontal size={15} />
                            <span>Answer settings</span>
                        </button>
                    </div>

                    <div className="composer-right">
                        <span className="enter-hint">Enter to send</span>
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