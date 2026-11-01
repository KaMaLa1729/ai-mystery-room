import { useState } from "react";
import "./App.css";

const API_URL = "https://ai-mystery-room-x6en.onrender.com";
export default function App() {
  const [screen, setScreen] = useState("home");
  const [premise, setPremise] = useState(
    "A priceless diamond disappeared during a dinner party."
  );
  const [difficulty, setDifficulty] = useState("Easy");
  const [mystery, setMystery] = useState(null);
  const [discovered, setDiscovered] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hint, setHint] = useState("");
  const [accusation, setAccusation] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createMystery(event) {
    event.preventDefault();

    if (premise.trim().length < 10) {
      setError("Please enter a mystery premise of at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setHint("");

    try {
      const response = await fetch(`${API_URL}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premise, difficulty }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not generate the mystery.");
      }

      setMystery(data);
      setDiscovered([]);
      setHintsUsed(0);
      setAccusation("");
      setResult(null);
      setScreen("investigation");
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the server. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function discoverClue(clueId) {
    if (discovered.includes(clueId)) return;

    try {
      const response = await fetch(
        `${API_URL}/api/cases/${mystery.id}/clues/${clueId}/discover`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not discover this clue.");
      }

      setDiscovered((previous) => [...previous, clueId]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestHint() {
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/cases/${mystery.id}/hints`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not request a hint.");
      }

      setHintsUsed(data.hintsUsed);
      setHint(data.hint);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitAccusation(event) {
    event.preventDefault();

    if (!accusation) {
      setError("Select a suspect before submitting your accusation.");
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/cases/${mystery.id}/accuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspectId: accusation }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit your accusation.");
      }

      setResult(data);
      setScreen("results");
    } catch (err) {
      setError(err.message);
    }
  }

  function startOver() {
    setMystery(null);
    setResult(null);
    setDiscovered([]);
    setHintsUsed(0);
    setHint("");
    setAccusation("");
    setError("");
    setScreen("home");
  }

  const score = result?.score ?? 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={startOver}>
          <span className="brand-icon">⌕</span>
          <span>MYSTERY<span className="accent">ROOM</span></span>
        </button>

        <span className="status-badge">
          <span className="status-dot" />
          DETECTIVE MODE
        </span>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {screen === "home" && (
        <section className="hero">
          <div className="eyebrow">
            <span>✦</span> AN AI-POWERED DETECTIVE EXPERIENCE
          </div>

          <h1>
            EVERY CLUE
            <br />
            <span>HAS A SECRET.</span>
          </h1>

          <p className="hero-description">
            Enter a world of secrets, suspicious characters, and hidden
            evidence. Investigate the mystery. Find the truth. Catch the culprit.
          </p>

          <div className="feature-row">
            <div className="feature-card">
              <span>◈</span>
              <strong>AI Mysteries</strong>
              <small>Unique storylines</small>
            </div>
            <div className="feature-card">
              <span>⌕</span>
              <strong>Investigate</strong>
              <small>Discover evidence</small>
            </div>
            <div className="feature-card">
              <span>♧</span>
              <strong>Solve the Case</strong>
              <small>Expose the truth</small>
            </div>
          </div>

          <button className="primary-button hero-button" onClick={() => setScreen("create")}>
            START INVESTIGATION <span>→</span>
          </button>

          <p className="fine-print">THINK CAREFULLY. EVERY DETAIL MATTERS.</p>
        </section>
      )}

      {screen === "create" && (
        <section className="panel">
          <p className="eyebrow">CASE SETUP / 01</p>
          <h2>Create Your Mystery</h2>
          <p className="muted">
            Choose a premise and difficulty. Your investigation begins here.
          </p>

          <form onSubmit={createMystery}>
            <label htmlFor="premise">MYSTERY PREMISE</label>
            <textarea
              id="premise"
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              minLength={10}
              maxLength={500}
              placeholder="Describe the crime or mysterious event..."
              required
            />

            <label>DIFFICULTY LEVEL</label>
            <div className="difficulty-grid">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  type="button"
                  key={level}
                  className={`difficulty-card ${
                    difficulty === level ? "selected" : ""
                  }`}
                  onClick={() => setDifficulty(level)}
                >
                  <strong>{level}</strong>
                  <small>
                    {level === "Easy"
                      ? "3 suspects · 5 clues"
                      : level === "Medium"
                        ? "4 suspects · 7 clues"
                        : "5 suspects · 9 clues"}
                  </small>
                </button>
              ))}
            </div>

            <button className="primary-button full-width" disabled={loading}>
              {loading ? "GENERATING MYSTERY..." : "GENERATE MYSTERY →"}
            </button>
          </form>
        </section>
      )}

      {screen === "investigation" && mystery && (
        <section className="investigation">
          <div className="case-heading">
            <div>
              <p className="eyebrow">ACTIVE INVESTIGATION</p>
              <h2>{mystery.title}</h2>
              <span className="difficulty-tag">{difficulty.toUpperCase()}</span>
            </div>

            <div className="progress-box">
              <strong>{discovered.length}/{mystery.clues.length}</strong>
              <small>CLUES FOUND</small>
            </div>
          </div>

          <article className="story-card">
            <h3>CASE FILE</h3>
            <p>{mystery.story}</p>
          </article>

          <h3 className="section-title">THE SUSPECTS</h3>
          <div className="suspect-grid">
            {mystery.suspects.map((suspect) => (
              <article className="suspect-card" key={suspect.id}>
                <div className="suspect-avatar">?</div>
                <h3>{suspect.name}</h3>
                <p>{suspect.description}</p>
                <small>ALIBI: {suspect.alibi}</small>
              </article>
            ))}
          </div>

          <h3 className="section-title">EVIDENCE BOARD</h3>
          <div className="clue-grid">
            {mystery.clues.map((clue) => {
              const found = discovered.includes(clue.id);

              return (
                <button
                  key={clue.id}
                  className={`clue-card ${found ? "found" : ""}`}
                  onClick={() => discoverClue(clue.id)}
                  disabled={found}
                >
                  <span>{found ? "✓" : "◈"}</span>
                  <strong>{clue.title}</strong>
                  <small>
                    {found ? clue.description : "Click to investigate"}
                  </small>
                </button>
              );
            })}
          </div>

          <div className="hint-box">
            <div>
              <h3>Need a hint?</h3>
              <p className="muted">
                Available hints: {mystery.hintsAvailable - hintsUsed}
              </p>
              {hint && <p className="hint-text">{hint}</p>}
            </div>
            <button
              className="secondary-button"
              onClick={requestHint}
              disabled={hintsUsed >= mystery.hintsAvailable}
            >
              REQUEST HINT
            </button>
          </div>

          <button
            className="primary-button full-width"
            onClick={() => setScreen("accuse")}
          >
            ACCUSE A SUSPECT →
          </button>
        </section>
      )}

      {screen === "accuse" && mystery && (
        <section className="panel">
          <p className="eyebrow">FINAL DECISION / 02</p>
          <h2>Who Did It?</h2>
          <p className="muted">
            Review your evidence carefully. Once submitted, your accusation
            will be final.
          </p>

          <form onSubmit={submitAccusation}>
            <div className="accusation-list">
              {mystery.suspects.map((suspect) => (
                <label
                  key={suspect.id}
                  className={`accusation-option ${
                    accusation === suspect.id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="suspect"
                    value={suspect.id}
                    checked={accusation === suspect.id}
                    onChange={(event) => setAccusation(event.target.value)}
                  />
                  <span>
                    <strong>{suspect.name}</strong>
                    <small>{suspect.description}</small>
                  </span>
                </label>
              ))}
            </div>

            <button className="primary-button full-width">
              SUBMIT FINAL ACCUSATION →
            </button>
          </form>

          <button
            className="text-button"
            onClick={() => setScreen("investigation")}
          >
            ← Return to investigation
          </button>
        </section>
      )}

      {screen === "results" && result && (
        <section className="panel results-panel">
          <p className="eyebrow">CASE CLOSED</p>
          <div className="result-icon">{result.correct ? "✓" : "✕"}</div>

          <h2>{result.correct ? "Case Solved!" : "Wrong Accusation"}</h2>

          <p className="muted">
            {result.correct
              ? "Excellent detective work. You uncovered the truth."
              : "The evidence tells another story. Review the explanation below."}
          </p>

          <div className="score-card">
            <small>FINAL SCORE</small>
            <strong>{score}</strong>
            <span>POINTS</span>
          </div>

          <article className="story-card result-story">
            <h3>THE TRUTH</h3>
            <p>
              <strong>Culprit:</strong> {result.culprit}
            </p>
            <p>{result.explanation}</p>
          </article>

          <button className="primary-button full-width" onClick={startOver}>
            SOLVE ANOTHER MYSTERY →
          </button>
        </section>
      )}

      <footer>
        AI MYSTERY ROOM <span>•</span> EVERY CLUE COUNTS
      </footer>
    </main>
  );
}