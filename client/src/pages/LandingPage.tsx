
import "./LandingPage.css";

type LandingPageProps = {
  onOpenWorkspace: () => void;
};

const features = [
  {
    number: "01",
    title: "Bring your material together",
    description:
      "Keep lecture notes, reports, papers and reference documents in one place.",
  },
  {
    number: "02",
    title: "Ask better questions",
    description:
      "Explore ideas across your documents instead of searching through them one by one.",
  },
  {
    number: "03",
    title: "Follow the source",
    description:
      "Trace answers back to the documents and passages that support them.",
  },
];

export default function LandingPage({
  onOpenWorkspace,
}: LandingPageProps) {
  return (
    <main className="landing-page" id="top">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Fieldnotes home">
          <span className="brand-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </a>

        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </nav>

        <button
          className="nav-workspace-button"
          onClick={onOpenWorkspace}
        >
          Open workspace <span aria-hidden="true">↗</span>
        </button>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            A workspace for your reading and research
          </p>

          <h1>
            Make sense of
            <br />
            <span>what you read.</span>
          </h1>

          <p className="hero-description">
            Add your PDFs and notes, ask questions in plain language,
            and see which passages support each answer.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={onOpenWorkspace}
            >
              Get started <span aria-hidden="true">↗</span>
            </button>

            <a className="secondary-link" href="#how-it-works">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>

          <p className="hero-footnote">
            Made for curious minds, careful readers and lifelong learners.
          </p>
        </div>

        {/* Product preview */}
        <div className="hero-preview" aria-label="Example research workspace">
          <div className="preview-topbar">
            <div className="preview-breadcrumb">
              <span className="preview-dot" />
              <span>Computer Networks</span>
            </div>

            <button
              className="preview-menu"
              type="button"
              aria-label="Example workspace menu"
              tabIndex={-1}
            >
              •••
            </button>
          </div>

          <div className="preview-content">
            <aside className="preview-sources">
              <div className="preview-section-heading">
                <span>Your sources</span>
                <span className="source-count">3</span>
              </div>

              <div className="preview-document selected">
                <span className="source-file-icon pdf-icon">PDF</span>
                <span className="document-copy">
                  <strong>Lecture 02</strong>
                  <small>Network fundamentals</small>
                </span>
              </div>

              <div className="preview-document">
                <span className="source-file-icon notes-icon">TXT</span>
                <span className="document-copy">
                  <strong>Class notes</strong>
                  <small>Communication models</small>
                </span>
              </div>

              <div className="preview-document">
                <span className="source-file-icon paper-icon">PDF</span>
                <span className="document-copy">
                  <strong>Reference paper</strong>
                  <small>Data transmission</small>
                </span>
              </div>

              <p className="source-hint">
                Your answers are grounded in the material you add.
              </p>
            </aside>

            <section className="preview-answer">
              <div className="answer-context">
                <span className="answer-context-dot" />
                Answer based on your sources
              </div>

              <div className="question-bubble">
                What are the key components of a data communication system?
              </div>

              <div className="answer-body">
                <p>
                  A data communication system has <strong>five key components</strong>.
                  Each plays a different role in getting information from one
                  device to another.
                </p>

                <div className="answer-point">
                  <span className="answer-point-number">01</span>
                  <p>
                    <strong>Sender</strong>
                    <span>The device that sends the information.</span>
                  </p>
                </div>

                <div className="answer-point">
                  <span className="answer-point-number">02</span>
                  <p>
                    <strong>Receiver</strong>
                    <span>The device that receives the information.</span>
                  </p>
                </div>

                <div className="answer-point">
                  <span className="answer-point-number">03</span>
                  <p>
                    <strong>Message, medium and protocol</strong>
                    <span>
                      The data being shared, the path it travels through,
                      and the rules that govern the exchange.
                    </span>
                  </p>
                </div>
              </div>

              <div className="citation">
                <span className="citation-icon" aria-hidden="true">↗</span>
                <span className="citation-copy">
                  <strong>Lecture 02</strong>
                  <small>Page 3</small>
                </span>
                <span className="citation-label">Source</span>
              </div>

              <div className="preview-prompt">
                <span>Ask a follow-up question...</span>
                <span className="prompt-arrow" aria-hidden="true">↑</span>
              </div>
            </section>
          </div>

          <div className="preview-caption">
            <span>AN EXAMPLE RESEARCH SESSION</span>
            <span>3 sources added</span>
          </div>
        </div>
      </section>

      <section className="landing-note">
        <p>
          Good research is not just about finding an answer.
          It is about knowing where it came from.
        </p>
        <span>THE FIELDNOTES APPROACH</span>
      </section>

      <section className="landing-features" id="features">
        <div className="section-heading">
          <p className="eyebrow">A little more clarity</p>
          <h2>From scattered documents to connected ideas.</h2>
        </div>

        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature-item" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="how-heading">
          <p className="eyebrow">A simple way to begin</p>
          <h2>Start with what you have.</h2>
        </div>

        <div className="steps-list">
          <div className="step">
            <span>01</span>
            <div>
              <h3>Add your documents</h3>
              <p>
                Bring the material you want to understand into your workspace.
              </p>
            </div>
          </div>

          <div className="step">
            <span>02</span>
            <div>
              <h3>Ask what matters</h3>
              <p>
                Ask specific questions and explore connections across your sources.
              </p>
            </div>
          </div>

          <div className="step">
            <span>03</span>
            <div>
              <h3>Check the evidence</h3>
              <p>
                Use source references to return to the original material.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <p className="eyebrow">Your next good question starts here</p>
        <h2>Read closely. Think clearly.</h2>
        <button className="primary-button" onClick={onOpenWorkspace}>
          Open fieldnotes <span aria-hidden="true">↗</span>
        </button>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </a>

        <span>A quieter place to think.</span>

        <a href="#top">
          Back to top ↑
        </a>
      </footer>
    </main>
  );
}
