# SynapseSync

SynapseSync is a real-time multiplayer word association game where the goal is to think like your friends. Can your group achieve a collective consciousness and all guess the same word for a given category?


## ✨ Features

- **Real-time Multiplayer:** Play with friends in a private room.
- **AI-Powered Categories:** Game categories are dynamically generated each round using Google's Gemini model via Genkit, ensuring a unique experience every time.
- **Adaptive AI:** The AI adapts the difficulty of categories based on player success rates.
- **Scoring & Streaks:** Work together to build up your "Hive Mind Streak" by guessing the same word.
- **Lobby System:** Easily create a room and share a unique code with friends to join.
- **Responsive Design:** Play on any device, whether it's a desktop or mobile phone.

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
    git clone https://github.com/your-username/synapsesync.git
    cd synapsesync
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
