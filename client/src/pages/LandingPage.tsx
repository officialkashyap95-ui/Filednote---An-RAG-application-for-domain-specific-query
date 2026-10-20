import { useState } from "react";
import "./LandingPage.css";

type LandingPageProps = {
  onOpenWorkspace: () => void;
  onOpenLogin: () => void;
};

const samples = [
  {
    tab: "Lecture notes",
    project: "Computer Networks",
    sources: [
      { name: "Lecture 02.pdf", meta: "24 pages" },
      { name: "Class notes.txt", meta: "3 pages" },
      { name: "Tanenbaum ch. 1.pdf", meta: "41 pages" },
    ],
    question: "What are the components of a data communication system?",
    answer:
      "Five: sender, receiver, message, transmission medium and protocol. The protocol is the set of rules both ends agree on. Without it, two devices can be connected and still not understand each other.",
    cite: { doc: "Lecture 02.pdf", page: "Page 3" },
  },
  {
    tab: "Research paper",
    project: "Sleep and memory review",
    sources: [
      { name: "Diekelmann 2010.pdf", meta: "12 pages" },
      { name: "Reading log.txt", meta: "2 pages" },
    ],
    question: "Which studies in my folder found no effect of napping?",
    answer:
      "One. The 2010 review reports a null result for naps under 20 minutes when testing procedural memory. The reading log mentions a second paper, but you haven't added it yet.",
    cite: { doc: "Diekelmann 2010.pdf", page: "Page 7" },
  },
  {
    tab: "Not in your sources",
    project: "Quarterly report",
    sources: [{ name: "Q3 report.pdf", meta: "18 pages" }],
    question: "What was the churn rate in Q2?",
    answer:
      "I can't find that. The report covers Q3 only and mentions Q2 revenue on page 9, but not churn. Add the Q2 report and ask again.",
    cite: null,
  },
];

const features = [
  {
    title: "One workspace per project",
    text: "Upload PDFs and text notes into a project. Everything you ask is answered from that project only.",
  },
  {
    title: "Questions across documents",
    text: "Ask how two papers disagree, or where a term first appears. You don't need to remember which file it was in.",
  },
  {
    title: "Every answer shows its source",
    text: "Each claim links to the document and page it came from, so you can read the original before you rely on it.",
  },
];

const steps = [
  ["Add your documents", "Drop in PDFs or paste notes. Fieldnotes reads them and keeps them in your project."],
  ["Ask a question", "Write it the way you'd ask a classmate or colleague. Follow-ups keep their context."],
  ["Open the source", "Click a citation to jump to the page. If your documents don't cover it, Fieldnotes says so."],
];

const toc = [
  ["overview", "Overview"],
  ["features", "Features"],
  ["how-it-works", "How it works"],
  ["limitations", "Limitations"],
];

export default function LandingPage({ onOpenWorkspace, onOpenLogin }: LandingPageProps) {
  const [active, setActive] = useState(0);
  const s = samples[active];

  return (
    <main className="landing-page" id="top">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Fieldnotes home">
          <span className="brand-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </a>

        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#limitations">Limitations</a>
        </nav>

        <div className="landing-nav-actions">
          <button className="nav-login-button" type="button" onClick={onOpenLogin}>
            Log in
          </button>
          <button className="primary-button" type="button" onClick={onOpenWorkspace}>
            Get started
          </button>
        </div>
      </header>

      <article>
        <header className="article-head" id="overview">
          <p className="article-tag">Product</p>
          <h1>Introducing Fieldnotes</h1>
          <p className="article-lead">
            Fieldnotes is a workspace where you add your PDFs and notes, ask
            questions in plain language, and see which page each answer came
            from.
          </p>
          <div className="article-actions">
            <button className="primary-button" type="button" onClick={onOpenWorkspace}>
              Try Fieldnotes
            </button>
            <a className="secondary-link" href="#samples">See an example</a>
          </div>
        </header>

        <section className="samples" id="samples" aria-label="Examples">
          <h2 className="samples-title">Samples</h2>
          <div className="sample-tabs" role="tablist">
            {samples.map((x, i) => (
              <button
                key={x.tab}
                role="tab"
                type="button"
                aria-selected={i === active}
                className={i === active ? "sample-tab is-active" : "sample-tab"}
                onClick={() => setActive(i)}
              >
                {x.tab}
              </button>
            ))}
          </div>

          <div className="sample-window">
            <aside className="sample-sources">
              <p className="sample-project">{s.project}</p>
              <ul>
                {s.sources.map((src) => (
                  <li key={src.name}>
                    <span>{src.name}</span>
                    <small>{src.meta}</small>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="sample-chat" role="tabpanel" key={active}>
              <div className="sample-question">{s.question}</div>
              <p className="sample-answer">{s.answer}</p>
              {s.cite && (
                <div className="sample-cite">
                  <strong>{s.cite.doc}</strong>
                  <span>{s.cite.page}</span>
                </div>
              )}
              <div className="sample-input">Ask a follow-up question</div>
            </div>
          </div>
        </section>

        <div className="article-body">
          <nav className="article-toc" aria-label="On this page">
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`}>{label}</a>
            ))}
          </nav>

          <div className="article-text">
            <section>
              <p>
                Good research isn't only about finding an answer. It's about
                knowing where the answer came from. Fieldnotes keeps your
                lecture notes, reports and papers in one place and answers
                from them, so you can check every claim against the original.
              </p>
            </section>

            <section id="features">
              <h2>What Fieldnotes does</h2>
              <div className="feature-list">
                {features.map((f) => (
                  <div className="feature-item" key={f.title}>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="how-it-works">
              <h2>How it works</h2>
              <ol className="steps-list">
                {steps.map(([title, text], i) => (
                  <li className="step" key={title}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="limitations">
              <h2>Limitations</h2>
              <p>
                Fieldnotes only answers from the documents you add. It won't
                fill gaps with guesses from the internet, and it tells you when
                your sources don't cover a question. You still decide what to
                trust, which is why every answer links back to the page.
              </p>
            </section>
          </div>
        </div>
      </article>

      <section className="landing-cta">
        <h2>Add your first document</h2>
        <p>It takes under a minute to set up a project.</p>
        <button className="primary-button" type="button" onClick={onOpenWorkspace}>
          Open Fieldnotes
        </button>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </a>
        <span>Document Q&amp;A with sources.</span>
        <a href="#top">Back to top</a>
      </footer>
    </main>
  );
}