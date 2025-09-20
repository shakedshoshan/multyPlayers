# Game Hub

Game Hub is a collection of real-time multiplayer games.

## ✨ Games

### 🧠 SynapseSync
A real-time multiplayer word association game where the goal is to think like your friends. Can your group achieve a collective consciousness and all guess the same word for a given category?

- **Real-time Multiplayer:** Play with friends in a private room.
- **AI-Powered Categories:** Game categories are dynamically generated each round using Google's Gemini model via Genkit, ensuring a unique experience every time.
- **Adaptive AI:** The AI adapts the difficulty of categories based on player success rates.
- **Scoring & Streaks:** Work together to build up your "Hive Mind Streak" by guessing the same word.

### 🕵️ The Impostor's Riddle
A game of deduction and deception. Find the impostor who doesn't know the secret word.

- **Social Deduction:** One player is the Impostor and doesn't know the secret word, only the category.
- **Dynamic Riddles:** The AI generates a new category and secret word for each round.
- **Voting System:** Discuss with your friends and vote out who you think the Impostor is.
- **Timed Rounds:** Identify the Impostor before the timer runs out.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) with Google AI
- **Hosting:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v20 or later)
- npm

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/game-hub.git
    cd game-hub
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Google AI API key:
    ```.env
    GEMINI_API_KEY=YOUR_API_KEY
    ```

4.  **Run the development server:**
    The application runs on two ports: one for the Next.js frontend and one for the Genkit AI flows.

    - **Start the Next.js app (port 9002):**
      ```sh
      npm run dev
      ```
    - **Start the Genkit server (port 3400):**
      In a separate terminal, run:
      ```sh
      npm run genkit:dev
      ```

5.  **Open the app:**
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
