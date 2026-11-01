# AI Mystery Room — Project Specification

## 1. Project Overview

AI Mystery Room is an AI-powered web application where users create and solve fictional mysteries. Users investigate suspects, discover clues, request hints, accuse a suspect, and receive a final verdict with a score.

The application uses Google's Gemini API to generate structured mysteries, Express.js to manage game logic, MongoDB to persist cases, and React to provide the user interface.

## 2. Objectives

- Generate mysteries from user-provided premises.
- Support Easy, Medium, and Hard difficulty levels.
- Provide interactive suspect investigation and clue discovery.
- Allow limited hints.
- Accept a final accusation.
- Calculate scores securely on the backend.
- Keep the culprit and solution private until the accusation.
- Persist mysteries and results in MongoDB.
- Deploy a working application accessible through a public URL.

## 3. Target Users

Users who enjoy detective puzzles, mystery stories, logical reasoning, and interactive games.

## 4. Technology Stack

### Frontend
- React
- Vite
- React Router
- Axios
- CSS; Tailwind CSS is optional

### Backend
- Node.js
- Express.js
- Google Gemini API through `@google/genai`
- Zod for validating input and generated data

### Database
- MongoDB Atlas
- Mongoose

### Development and Deployment
- Git and GitHub
- Vercel for the frontend
- A suitable Node.js hosting provider for the backend

## 5. User Flow

1. User opens the home page.
2. User starts a new investigation.
3. User enters a premise and selects a difficulty.
4. The backend asks Gemini to generate a structured mystery.
5. The backend validates the generated content.
6. The mystery is saved in MongoDB.
7. The frontend displays the story, suspects, and available clues.
8. The player discovers clues.
9. The player may request available hints.
10. The player selects a suspect and submits an accusation.
11. The backend calculates the score and checks the accusation.
12. The result page reveals the culprit and explanation.
13. The player can start another mystery.

## 6. Difficulty Configuration

| Difficulty | Suspects | Clues | Hints | Correct Accusation Base Score |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

The backend must enforce these limits.

## 7. Frontend Requirements

### Home
- Display the project name and introduction.
- Provide a Start Investigation button.

### Create Mystery
- Accept a premise between 10 and 500 characters.
- Provide Easy, Medium, and Hard difficulty options.
- Display loading and error states.

### Investigation Room
- Display the mystery title and story.
- Display the correct number of suspects.
- Display clues and their discovery status.
- Allow clue discovery.
- Allow limited hint requests.
- Provide a suspect-selection interface for accusations.
- Display investigation progress.

### Results
- Display whether the accusation was correct.
- Reveal the culprit and solution explanation.
- Display the final score.
- Provide an option to start another mystery.

### Usability
- Provide clear error messages.
- Prevent duplicate submissions.
- Support desktop and mobile screens.
- Keep the interface consistent and accessible.

## 8. Backend API

### POST /api/cases
Create a mystery.

Request:
{
  "premise": "A priceless diamond disappeared during a dinner party.",
  "difficulty": "Easy"
}

Response: public mystery ID, title, story, difficulty, suspects, clues, and hint availability. Never return the culprit ID or solution explanation.

### GET /api/cases/:id
Retrieve a public mystery and its permitted progress information without exposing the solution.

### POST /api/cases/:id/clues/:clueId/discover
Mark a valid clue as discovered. Do not award duplicate clue points for rediscovering the same clue.

### POST /api/cases/:id/hints
Return the next available hint and update the server-side hint count. Reject requests after the hint limit is reached.

### POST /api/cases/:id/accuse
Request:
{
  "suspectId": "suspect-1"
}

Validate the suspect ID, calculate the score on the backend, complete the case, and return the verdict and explanation.

### GET /api/cases/:id/result
Return the final result only after the case has been completed.

## 9. Database Model

Each case should store:

- Unique case ID
- Title
- Story
- Original premise
- Difficulty
- Suspects
- Clues
- Hints
- Culprit ID
- Private solution explanation
- Discovered clue IDs
- Hints used
- Completion status
- Submitted accusation
- Final score
- Creation timestamp

The culprit ID and solution explanation must remain private server-side fields until the case is completed.

## 10. Gemini AI Requirements

Gemini should generate structured JSON containing:

- Mystery title
- Mystery story
- Suspects with unique IDs, descriptions, motives, and alibis
- Clues with unique IDs and evidence descriptions
- Hints
- Culprit ID
- Evidence-supported solution explanation

The generated mystery must contain exactly the number of suspects, clues, and hints required by the selected difficulty.

The solution must be logically consistent with the story, suspect statements, and clues. The clues must provide a reasonable basis for identifying the culprit.

Validate the output with Zod before saving it. Handle invalid JSON, missing fields, incorrect counts, API errors, and generation failures without crashing the server.

The Gemini API key must be stored in the backend environment and never exposed to the browser.

## 11. Scoring Rules

Calculate the score only on the backend.

Final score:

max(0, accusation points + discovered clue points - hint penalties)

- Correct accusation: award the base score for the selected difficulty.
- Incorrect accusation: award zero accusation base points.
- Each uniquely discovered clue: +5 points.
- Each hint used: -10 points.
- Minimum score: 0.

Do not trust a score or progress value submitted by the frontend.

## 12. Security Requirements

- Store API keys and database credentials in environment variables.
- Never commit `.env` files to GitHub.
- Never return the culprit ID or solution explanation before the accusation.
- Do not expose internal game state unnecessarily.
- Validate request bodies, difficulty values, IDs, and generated AI output.
- Handle invalid requests and server errors safely.
- Configure CORS for the intended frontend origin in production.
- Do not expose database connection strings or API keys in client code or logs.

## 13. Error Handling

The application must handle:

- Empty or invalid premises
- Unsupported difficulty values
- Missing or invalid case IDs
- Invalid clue and suspect IDs
- Hint limits reached
- Repeated accusations
- Gemini API failures
- Invalid AI-generated content
- MongoDB connection failures
- Network errors
- Unexpected server errors

Return suitable HTTP status codes and safe, understandable error messages.

## 14. Testing Requirements

- Generate mysteries at all three difficulty levels.
- Confirm suspect, clue, and hint counts.
- Discover clues and verify duplicate discoveries do not add points.
- Request hints until the limit is reached.
- Test correct and incorrect accusations.
- Verify all scoring calculations.
- Confirm the solution is hidden before an accusation.
- Confirm results cannot be retrieved before completion.
- Test invalid input and missing IDs.
- Verify saved cases survive a server restart.
- Test the complete workflow on the deployed website.

## 15. Acceptance Criteria

The project is complete when:

1. Users can create mysteries from a premise.
2. All three difficulty levels follow the required counts.
3. Mysteries are generated by Gemini and validated.
4. Clues, hints, and accusations work correctly.
5. Scoring is calculated securely on the backend.
6. The solution is hidden until the player submits an accusation.
7. Results show the correct culprit, explanation, and score.
8. MongoDB persists cases and results.
9. The application handles expected failures safely.
10. The source code is available in GitHub.
11. The frontend and backend are deployed.
12. A complete mystery can be created and solved on the live website.

## 16. Project Deliverables

- Complete source code
- SPEC.md
- GitHub repository URL
- Live application URL
- Successful live mystery-solving demonstration
- Submission form completed with the required URLs

## 17. Current Implementation Status

The current prototype has a React/Vite interface, an Express backend, and temporary in-memory mystery data. The demo mystery generator must be replaced with Gemini generation, and in-memory storage must be replaced with MongoDB persistence.

The implementation is not considered complete until all acceptance criteria have been tested and the live application works.