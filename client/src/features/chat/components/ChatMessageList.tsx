import { useState } from "react";
import {
  Check,
  Copy,
  MoreHorizontal,
  ThumbsDown,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import type { ChatMessage, Citation } from "../../../types";

type Props = {
  messages: ChatMessage[];
  onCitationClick: (citation: Citation) => void;
};

function formatMessage(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function ChatMessageList({
  messages,
  onCitationClick,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyMessage(message: ChatMessage) {
    const text = [
      message.content,
      ...(message.bullets ?? []).map(
        (item) => `${item.title}: ${item.detail}`,
      ),
      message.ending ?? "",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="message-list" aria-live="polite">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`message message--${message.role}`}
        >
          {message.role === "assistant" ? (
            <div className="assistant-mark">f</div>
          ) : (
            <div className="message-user-icon">
              <UserRound size={16} />
            </div>
          )}

          <div className="message-body">
            <div className="message-meta">
              <strong>
                {message.role === "assistant" ? "Fieldnotes" : "You"}
              </strong>
              <span>{message.time}</span>
            </div>

            <div className="message-content">
              {formatMessage(message.content)}
            </div>

            {message.bullets && (
              <ol className="answer-list">
                {message.bullets.map((item, index) => (
                  <li key={item.title}>
                    <strong>
                      {index + 1}. {item.title}.
                    </strong>{" "}
                    {item.detail}
                  </li>
                ))}
              </ol>
            )}

            {message.ending && (
              <p className="message-ending">{message.ending}</p>
            )}

            {!!message.citations?.length && (
              <div className="citation-row">
                {message.citations.map((citation, index) => (
                  <button
                    key={citation.id}
                    type="button"
                    className="citation-chip"
                    onClick={() => onCitationClick(citation)}
                  >
                    <span>{index + 1}</span>
                    {citation.label}
                  </button>
                ))}
              </div>
            )}

            {message.role === "assistant" && (
              <div className="message-tools">
                <button
                  type="button"
                  aria-label="Copy answer"
                  title="Copy answer"
                  onClick={() => void copyMessage(message)}
                >
                  {copiedId === message.id ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <button type="button" aria-label="Helpful answer" title="Helpful">
                  <ThumbsUp size={14} />
                </button>
                <button type="button" aria-label="Unhelpful answer" title="Not helpful">
                  <ThumbsDown size={14} />
                </button>
                <button type="button" aria-label="More options">
                  <MoreHorizontal size={15} />
                </button>

                {copiedId === message.id && (
                  <span className="copied-label">Copied</span>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}