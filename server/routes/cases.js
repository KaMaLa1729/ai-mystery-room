const express = require("express");
const { randomUUID } = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const router = express.Router();
const cases = new Map();

const settings = {
  Easy: { suspects: 3, clues: 5, hints: 2, base: 100 },
  Medium: { suspects: 4, clues: 7, hints: 3, base: 150 },
  Hard: { suspects: 5, clues: 9, hints: 3, base: 200 },
};
async function generateMysteryWithAI(premise, difficulty) {
  const config = settings[difficulty];

  const prompt = `
Create a fair, fictional detective mystery game.

Premise: ${premise}
Difficulty: ${difficulty}

Return ONLY valid JSON using this structure:
{
  "title": "A short mystery title",
  "story": "An engaging mystery story",
  "suspects": [
    {
      "id": "suspect-1",
      "name": "Full name",
      "occupation": "Occupation",
      "statement": "Their statement"
    }
  ],
  "clues": [
    {
      "id": "clue-1",
      "title": "Evidence title",
      "description": "Evidence description"
    }
  ],
  "hints": ["Hint one", "Hint two"],
  "culpritId": "suspect-1",
  "solutionExplanation": "Explain how the clues prove the culprit is responsible."
}

Requirements:
- Generate exactly ${config.suspects} suspects.
- Generate exactly ${config.clues} clues.
- Generate exactly ${config.hints} hints.
- Suspect IDs must be suspect-1, suspect-2, and so on.
- Clue IDs must be clue-1, clue-2, and so on.
- The culpritId must match one suspect ID.
- At least three clues must support the solution.
- Include meaningful contradictions and alibis.
- Every clue must fit the same story.
- Do not reveal the culprit in the public story.
- All content must be fictional and safe.
`;

 let response;
let lastError;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    break;
  } catch (error) {
    lastError = error;

    const temporary =
      error.status === 503 ||
      error.status === 429 ||
      error.status === 500 ||
      String(error.message).includes("UNAVAILABLE");

    if (!temporary || attempt === 3) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }
}

if (!response) {
  throw lastError || new Error("Gemini did not return a response.");
}
  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(text);
}
function makeMystery(premise, difficulty) {
  const config = settings[difficulty];

  const names = [
    "Alex Morgan",
    "Jordan Blake",
    "Taylor Reed",
    "Casey Parker",
    "Morgan Ellis",
  ];

  const suspects = names.slice(0, config.suspects).map((name, index) => ({
    id: `suspect-${index + 1}`,
    name,
    occupation: [
      "Event manager",
      "Business partner",
      "Security officer",
      "Family friend",
      "Housekeeper",
    ][index],
    statement: [
      "I was organizing the event.",
      "I was near the main hall.",
      "I was checking the security system.",
      "I spoke to the host earlier.",
      "I was working in the service area.",
    ][index],
  }));

  const clueDescriptions = [
    "A witness noticed someone near the room shortly before the incident.",
    "The security log shows an unexpected gap in the recorded activity.",
    "A glass was found near the scene.",
    "A note was discovered close to the entrance.",
    "A witness reported a disagreement earlier that evening.",
    "A door was found unlocked despite the security rules.",
    "A receipt places a suspect near the location.",
    "A timeline reveals a contradiction in one statement.",
    "An object was found hidden behind nearby furniture.",
  ];

  const clues = clueDescriptions.slice(0, config.clues).map((description, index) => ({
    id: `clue-${index + 1}`,
    title: `Evidence ${index + 1}`,
    description,
  }));

  const hints = [
    "Compare each suspect's statement with the timeline.",
    "Look for contradictions rather than relying on motive alone.",
    "Check which evidence supports or challenges each alibi.",
  ].slice(0, config.hints);

  // Temporary demo culprit. Replace with a consistent AI-generated mystery later.
  const culpritIndex = Math.min(1, suspects.length - 1);

  return {
    id: randomUUID(),
    title: "Case File: The Mystery",
    story: premise,
    difficulty,
    suspects,
    clues,
    hints,
    hintsAvailable: config.hints,
    culpritId: suspects[culpritIndex].id,
    solutionExplanation:
      `${suspects[culpritIndex].name} is the temporary demo culprit. ` +
      "This placeholder solution must be replaced with a consistent, evidence-supported mystery.",
    discovered: [],
    hintsUsed: 0,
    completed: false,
    accusation: null,
    score: 0,
    hintIndex: 0,
  };
}

function publicCase(mystery) {
  const {
    culpritId,
    solutionExplanation,
    hints,
    discovered,
    hintsUsed,
    ...safeCase
  } = mystery;

  return {
    ...safeCase,
    hintsAvailable: mystery.hintsAvailable - hintsUsed,
    clues: mystery.clues.map((clue) => ({
      ...clue,
      discovered: discovered.includes(clue.id),
    })),
  };
}

// Create a mystery using Gemini AI
router.post("/", async (req, res) => {
  try {
    const { premise, difficulty = "Easy" } = req.body || {};

    if (
      typeof premise !== "string" ||
      premise.trim().length < 10 ||
      premise.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Premise must contain between 10 and 500 characters.",
      });
    }

    if (!settings[difficulty]) {
      return res.status(400).json({
        message: "Difficulty must be Easy, Medium, or Hard.",
      });
    }

    const generated = await generateMysteryWithAI(
      premise.trim(),
      difficulty
    );

    const config = settings[difficulty];

    if (
      !generated ||
      typeof generated.title !== "string" ||
      typeof generated.story !== "string" ||
      !Array.isArray(generated.suspects) ||
      !Array.isArray(generated.clues) ||
      !Array.isArray(generated.hints) ||
      typeof generated.culpritId !== "string" ||
      typeof generated.solutionExplanation !== "string" ||
      generated.suspects.length !== config.suspects ||
      generated.clues.length !== config.clues ||
      generated.hints.length !== config.hints ||
      !generated.suspects.some((s) => s.id === generated.culpritId)
    ) {
      throw new Error("Gemini generated an invalid mystery structure.");
    }

    const mystery = {
      ...generated,
      id: randomUUID(),
      difficulty,
      hintsAvailable: config.hints,
      discovered: [],
      hintsUsed: 0,
      completed: false,
      accusation: null,
      score: 0,
      hintIndex: 0,
    };

    cases.set(mystery.id, mystery);

    return res.status(201).json(publicCase(mystery));
  } catch (error) {
    console.error("Mystery generation failed:", error.message);

    return res.status(502).json({
      message:
        "AI mystery generation failed. Check your Gemini API key, model access, and server logs.",
    });
  }
});

// Get a mystery without revealing the solution
router.get("/:id", (req, res) => {
  const mystery = cases.get(req.params.id);

  if (!mystery) {
    return res.status(404).json({ message: "Mystery not found." });
  }

  return res.json(publicCase(mystery));
});

// Discover evidence
router.post("/:id/clues/:clueId/discover", (req, res) => {
  const mystery = cases.get(req.params.id);

  if (!mystery) {
    return res.status(404).json({ message: "Mystery not found." });
  }

  if (mystery.completed) {
    return res.status(400).json({ message: "This mystery is already completed." });
  }

  const clue = mystery.clues.find((item) => item.id === req.params.clueId);

  if (!clue) {
    return res.status(404).json({ message: "Evidence not found." });
  }

  if (!mystery.discovered.includes(clue.id)) {
    mystery.discovered.push(clue.id);
  }

  return res.json({
    message: "Evidence discovered.",
    clue,
    discoveredCount: mystery.discovered.length,
    totalClues: mystery.clues.length,
  });
});

// Request a hint
router.post("/:id/hints", (req, res) => {
  const mystery = cases.get(req.params.id);

  if (!mystery) {
    return res.status(404).json({ message: "Mystery not found." });
  }

  if (mystery.completed) {
    return res.status(400).json({ message: "This mystery is already completed." });
  }

  if (mystery.hintsUsed >= mystery.hints.length) {
    return res.status(400).json({ message: "No hints remain." });
  }

  const hint = mystery.hints[mystery.hintIndex];
  mystery.hintIndex += 1;
  mystery.hintsUsed += 1;

  return res.json({
    hint,
    hintsUsed: mystery.hintsUsed,
    hintsRemaining: mystery.hints.length - mystery.hintsUsed,
  });
});

// Make an accusation
router.post("/:id/accuse", (req, res) => {
  const mystery = cases.get(req.params.id);

  if (!mystery) {
    return res.status(404).json({ message: "Mystery not found." });
  }

  if (mystery.completed) {
    return res.status(400).json({ message: "This mystery is already completed." });
  }

  const { suspectId } = req.body || {};
  const suspect = mystery.suspects.find((item) => item.id === suspectId);

  if (!suspect) {
    return res.status(400).json({ message: "Choose a valid suspect." });
  }

  const correct = suspectId === mystery.culpritId;
  const baseScore = settings[mystery.difficulty].base;
  const score = Math.max(
    0,
    (correct ? baseScore : 0) +
      mystery.discovered.length * 5 -
      mystery.hintsUsed * 10
  );

  mystery.completed = true;
  mystery.accusation = suspectId;
  mystery.score = score;

  return res.json({
    correct,
    culprit: mystery.suspects.find((item) => item.id === mystery.culpritId).name,
    explanation: mystery.solutionExplanation,
    score,
    discoveredCount: mystery.discovered.length,
    hintsUsed: mystery.hintsUsed,
  });
});

// View the result after completion
router.get("/:id/result", (req, res) => {
  const mystery = cases.get(req.params.id);

  if (!mystery) {
    return res.status(404).json({ message: "Mystery not found." });
  }

  if (!mystery.completed) {
    return res.status(403).json({
      message: "Complete your accusation before viewing the solution.",
    });
  }

  return res.json({
    correct: mystery.accusation === mystery.culpritId,
    culprit: mystery.suspects.find((item) => item.id === mystery.culpritId).name,
    explanation: mystery.solutionExplanation,
    score: mystery.score,
    discoveredCount: mystery.discovered.length,
    hintsUsed: mystery.hintsUsed,
  });
});

module.exports = router;