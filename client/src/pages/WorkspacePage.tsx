
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  FileSearch,
  FileText,
  GraduationCap,
  Menu,
  PanelRightClose,
  Plus,
  Search,
  Settings2,
  X,
  ArrowUpRight,
  GripVertical,
} from "lucide-react";

import "./WorkspacePage.css";

import { AppSidebar } from "../layouts/AppSidebar";
import { NotebookHeader } from "../features/notebooks/components/NotebookHeader";
import { ChatMessageList } from "../features/chat/components/ChatMessageList";
import { ChatComposer } from "../features/chat/components/ChatComposer";
import { SourcePanel } from "../features/sources/components/SourcePanel";
import type { AuthUser } from "../lib/api";

import type { ChatMessage, Citation, SourceDocument } from "../types";

const initialSources: SourceDocument[] = [
  {
    id: "s1",
    name: "Introduction to Data Communication.pdf",
    type: "PDF",
    pages: 18,
    added: "Added today",
    color: "blue",
    excerpt:
      "Data communication is the exchange of data between two devices through some form of transmission medium.",
  },
  {
    id: "s2",
    name: "Computer Networks — Unit 1.docx",
    type: "DOCX",
    pages: 12,
    added: "Added today",
    color: "amber",
    excerpt:
      "A protocol defines the rules that both the sender and receiver must follow to communicate.",
  },
  {
    id: "s3",
    name: "Lecture 02 — Network Models.pdf",
    type: "PDF",
    pages: 24,
    added: "Added yesterday",
    color: "rose",
    excerpt:
      "The OSI reference model divides network communication into seven layers.",
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Hi! I’m ready to help you study these materials. Ask a question, compare concepts, or request concise revision notes. I’ll show the source references available in this demo workspace.",
    time: "2:41 PM",
  },
  {
    id: "m2",
    role: "user",
    content:
      "What are the key components of a data communication system?",
    time: "2:42 PM",
  },
  {
    id: "m3",
    role: "assistant",
    content: "A data communication system has **five key components**:",
    bullets: [
      {
        title: "Sender",
        detail: "The device that creates and sends the data.",
      },
      {
        title: "Receiver",
        detail: "The device that receives the data.",
      },
      {
        title: "Message",
        detail:
          "The information being communicated, such as text, audio, or video.",
      },
      {
        title: "Transmission medium",
        detail:
          "The path through which data travels, such as a cable or wireless signal.",
      },
      {
        title: "Protocol",
        detail:
          "The rules that govern how devices exchange data.",
      },
    ],
    ending:
      "These components work together to transfer information from one device to another.",
    citations: [
      {
        id: "c1",
        label: "Source 1 · page 3",
        sourceId: "s1",
        quote:
          "Data communication is the exchange of data between two devices through some form of transmission medium.",
      },
      {
        id: "c2",
        label: "Source 2 · page 2",
        sourceId: "s2",
        quote:
          "A protocol defines the rules that both the sender and receiver must follow to communicate.",
      },
    ],
    time: "2:42 PM",
  },
];

type WorkspacePageProps = {
  user: AuthUser;
  onLogout: () => void | Promise<void>;
  signingOut: boolean;
};

type ResizeTarget = "sidebar" | "sources";

type DragState = {
  target: ResizeTarget;
  startX: number;
  startWidth: number;
};

export default function WorkspacePage({
  user,
  onLogout,
  signingOut,
}: WorkspacePageProps) {
  const [activeDomain, setActiveDomain] = useState("Education");
  const [activeNotebook, setActiveNotebook] =
    useState("Computer Networks");

  const [sources, setSources] = useState(initialSources);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const [selectedCitation, setSelectedCitation] =
    useState<Citation | null>(null);

  const [sourcePanelOpen, setSourcePanelOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [activeSourceId, setActiveSourceId] = useState("s1");
  const [toast, setToast] = useState("");

  const [sidebarWidth, setSidebarWidth] = useState(248);
  const [sourcePanelWidth, setSourcePanelWidth] = useState(305);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const activeSource = sources.find(
    (source) => source.id === activeSourceId,
  );

  const filteredSources = useMemo(
    () =>
      sources.filter((source) =>
        source.name.toLowerCase().includes(sourceSearch.toLowerCase()),
      ),
    [sources, sourceSearch],
  );

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.target === "sidebar") {
        const nextWidth = Math.min(
          360,
          Math.max(
            200,
            drag.startWidth + event.clientX - drag.startX,
          ),
        );

        setSidebarWidth(nextWidth);
      }

      if (drag.target === "sources") {
        const nextWidth = Math.min(
          480,
          Math.max(
            240,
            drag.startWidth - (event.clientX - drag.startX),
          ),
        );

        setSourcePanelWidth(nextWidth);
      }
    }

    function handlePointerUp() {
      dragRef.current = null;
      setIsResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Prevent background scrolling while the mobile Sources drawer is open.
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 850px)").matches;

    if (!isMobile || !sourcePanelOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sourcePanelOpen]);

  function startResize(
    event: React.PointerEvent<HTMLButtonElement>,
    target: ResizeTarget,
  ) {
    if (event.button !== 0) return;

    if (window.matchMedia("(max-width: 850px)").matches) return;

    event.preventDefault();

    dragRef.current = {
      target,
      startX: event.clientX,
      startWidth:
        target === "sidebar" ? sidebarWidth : sourcePanelWidth,
    };

    setIsResizing(true);
  }

  function showToast(message: string) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast(message);

    toastTimerRef.current = setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 2800);
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      time,
    };

    const demoReply: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "This is a demo response. The interface is working, but the document retrieval and AI pipeline have not been connected yet. In a later stage, answers will be generated from retrieved document passages.",
      time,
    };

    setMessages((current) => [
      ...current,
      userMessage,
      demoReply,
    ]);

    setDraft("");
  }

  function addDemoSource() {
    const newSource: SourceDocument = {
      id: crypto.randomUUID(),
      name: "Sample source — upload integration pending.pdf",
      type: "PDF",
      pages: 0,
      added: "Just now",
      color: "blue",
      excerpt:
        "This is a placeholder source. Actual file uploading and document processing have not been implemented yet.",
    };

    setSources((current) => [...current, newSource]);
    setActiveSourceId(newSource.id);
    setSelectedCitation(null);

    showToast("Demo source added. File upload is not connected yet.");
  }

  function selectCitation(citation: Citation) {
    setSelectedCitation(citation);
    setActiveSourceId(citation.sourceId);
    setSourcePanelOpen(true);
  }

  function closeSourcesPanel() {
    setSourcePanelOpen(false);
  }

  return (
    <div
      className={`app-shell ${isResizing ? "is-resizing" : ""}`}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      <AppSidebar
        activeDomain={activeDomain}
        activeNotebook={activeNotebook}
        onDomainChange={setActiveDomain}
        onNotebookChange={setActiveNotebook}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        user={user}
        onLogout={onLogout}
        signingOut={signingOut}
      />

      <button
        type="button"
        className="resize-divider sidebar-resize-divider"
        aria-label="Resize sidebar"
        title="Drag to resize sidebar"
        onPointerDown={(event) => startResize(event, "sidebar")}
      >
        <GripVertical size={14} />
      </button>

      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="mobile-topbar">
          <button
            type="button"
            className="icon-button"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={19} />
          </button>

          <span className="mobile-brand">
            <BookOpen size={17} />
            fieldnotes
          </span>

          <button
            type="button"
            className="icon-button"
            aria-label="Settings"
            onClick={() => showToast("Settings will be available soon.")}
          >
            <Settings2 size={18} />
          </button>
        </header>

        <NotebookHeader
          title={activeNotebook}
          domain={activeDomain}
          sourceCount={sources.length}
          onToggleSources={() =>
            setSourcePanelOpen((open) => !open)
          }
          sourcePanelOpen={sourcePanelOpen}
        />

        <div
          className={`workspace ${sourcePanelOpen ? "" : "workspace--wide"
            }`}
          style={
            {
              "--source-panel-width": `${sourcePanelWidth}px`,
            } as React.CSSProperties
          }
        >
          <section className="conversation-column">
            <div className="conversation-scroll">
              <div className="conversation-intro">
                <div className="intro-icon">
                  <GraduationCap size={20} />
                </div>

                <div>
                  <p className="eyebrow">YOUR STUDY WORKSPACE</p>
                  <h1>Let’s work through your sources.</h1>
                  <p className="intro-copy">
                    Explore your study materials in one place.
                    Source references in this preview use sample data.
                  </p>
                </div>
              </div>

              <ChatMessageList
                messages={messages}
                onCitationClick={selectCitation}
              />

              <div className="suggestion-row">
                <button
                  type="button"
                  onClick={() =>
                    setDraft(
                      "Summarise the key concepts in these sources.",
                    )
                  }
                >
                  <FileText size={15} />
                  Summarise sources
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraft(
                      "Create exam revision notes from these documents.",
                    )
                  }
                >
                  <GraduationCap size={15} />
                  Make revision notes
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraft(
                      "Compare the main concepts across these sources.",
                    )
                  }
                >
                  <Search size={15} />
                  Compare concepts
                </button>
              </div>
            </div>

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={sendMessage}
              onAttach={addDemoSource}
            />

            <p className="disclaimer">
              Demo workspace · AI answers and document retrieval are not connected.
            </p>
          </section>

          {sourcePanelOpen && (
            <>
              <button
                type="button"
                className="resize-divider sources-resize-divider"
                aria-label="Resize sources panel"
                title="Drag to resize sources panel"
                onPointerDown={(event) =>
                  startResize(event, "sources")
                }
              >
                <GripVertical size={14} />
              </button>

              <aside className="right-panel right-panel--mobile-open">
                <div className="panel-heading">
                  <div>
                    <h2>Sources</h2>
                    <span>
                      {sources.length} documents in this notebook
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-button subtle"
                    aria-label="Close sources panel"
                    onClick={closeSourcesPanel}
                  >
                    <PanelRightClose size={17} />
                  </button>
                </div>

                <label className="source-search">
                  <Search size={15} />

                  <input
                    value={sourceSearch}
                    onChange={(event) =>
                      setSourceSearch(event.target.value)
                    }
                    placeholder="Find a source"
                    aria-label="Find a source"
                  />

                  <kbd>⌘ K</kbd>
                </label>

                <button
                  type="button"
                  className="add-source-button"
                  onClick={addDemoSource}
                >
                  <Plus size={16} />
                  Add demo source
                </button>

                <SourcePanel
                  sources={filteredSources}
                  activeSourceId={activeSourceId}
                  onSelect={(id) => {
                    setActiveSourceId(id);
                    setSelectedCitation(null);
                  }}
                />

                <div className="source-detail">
                  <div className="detail-heading">
                    <FileSearch size={16} />
                    <span>Source preview</span>
                  </div>

                  {activeSource ? (
                    <>
                      <p className="preview-file">
                        {activeSource.name}
                      </p>

                      <p className="preview-page">
                        {activeSource.pages
                          ? `${activeSource.pages} pages · Sample text`
                          : "Document processing not connected"}
                      </p>

                      <blockquote>
                        {selectedCitation?.sourceId === activeSource.id
                          ? selectedCitation.quote
                          : activeSource.excerpt}
                      </blockquote>

                      <button
                        type="button"
                        className="text-link"
                        onClick={() =>
                          showToast(
                            "Full document preview will be added later.",
                          )
                        }
                      >
                        Open source <ArrowUpRight size={14} />
                      </button>
                    </>
                  ) : (
                    <p className="empty-preview">
                      Select a source to preview it.
                    </p>
                  )}
                </div>
              </aside>
            </>
          )}
        </div>
      </main>

      {sourcePanelOpen && (
        <button
          type="button"
          className="mobile-sources-scrim"
          aria-label="Close sources panel"
          onClick={closeSourcesPanel}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}

          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
