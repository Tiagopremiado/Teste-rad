# Radar Aviator

Radar Aviator is an AI-powered system for analyzing patterns and suggesting strategies for the Aviator game.

## Features

- **AI-Powered Analysis**: Utilizes Google Gemini to provide deep insights into game history.
- **Data Input**: Supports data entry via text paste, spreadsheet upload (.xlsx), and screenshot analysis.
- **Strategic Recommendations**: Generates custom strategies based on market conditions and user risk profile.
- **Live Co-Pilot**: An AI bot that can manage betting sessions automatically based on advanced tactics.
- **Social Hub**: A private social network for premium users to share wins, strategies, and suggestions.
- **Pattern Cataloger**: Tools to manually and automatically discover winning and losing patterns.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Charting**: Recharts

## Setup & Local Development

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <directory-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add your Google Gemini API key(s). This application supports single keys or a comma-separated list for key rotation.

    ```.env.local
    # For a single API key
    API_KEY=YOUR_GEMINI_API_KEY

    # For multiple API keys (recommended for resilience)
    API_KEYS=YOUR_GEMINI_API_KEY_1,YOUR_GEMINI_API_KEY_2
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment to Vercel

This project is configured for seamless deployment on [Vercel](https://vercel.com/).

1.  **Push your code to a GitHub repository.**

2.  **Import the repository on Vercel.** Vercel will automatically detect that this is a Vite project and configure the build settings correctly.

3.  **Configure Environment Variables:**
    In your Vercel project settings, navigate to the "Environment Variables" section. Add your `API_KEY` or `API_KEYS` with the same values from your `.env.local` file. **It is crucial that these variable names match exactly.**

4.  **Deploy.** Vercel will build and deploy your application. Any subsequent push to the main branch will trigger a new deployment automatically.