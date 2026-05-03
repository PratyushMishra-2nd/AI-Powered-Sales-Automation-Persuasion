# OutreachAI Suite — AI-Powered Sales Automation

## Chosen Vertical
**B2B Sales Automation & Revenue Operations (SaaS)**
This project targets Account Executives (AEs) and Sales Development Representatives (SDRs) who spend hours daily researching prospects, drafting personalized outreach, and preparing for discovery calls. 

## Approach & Logic
Our goal is to eliminate the friction in the sales prospecting lifecycle. Rather than building a bulky CRM, this is a lightweight, high-performance suite of AI tools designed for speed and quality. 
The application acts as a "copilot" for sales reps, offering five distinct tools:
1. **Outreach Generator:** Creates hyper-personalized emails based on prospect pain points and activity.
2. **A/B Tester:** Generates multiple unique angles (pain-focused, social proof, etc.) to test what resonates.
3. **Response Analyzer:** Evaluates prospect replies for sentiment/urgency and drafts the ideal follow-up.
4. **Objection Simulator:** A training environment where reps face realistic objections and receive AI scoring on their rebuttals.
5. **Call Prep Brief:** Summarizes context and generates talking points and discovery questions before a meeting.

## How the Solution Works
- **Architecture:** The application is built using **Next.js (App Router)** and **React**. It operates entirely client-side to ensure maximum privacy; no prospect data is stored on external databases.
- **AI Integration:** The suite is powered by **Google's Gemini 2.0 Flash**. Users provide their own API key, which is securely stored in the browser's session state.
- **Live Intelligence:** The Outreach Generator features an optional **Google Search Grounding** integration. When enabled, Gemini performs a live search on the prospect's company to fetch recent news, funding rounds, and strategic priorities, embedding this fresh intel into the generated email.
- **UI/UX:** The interface is built with Tailwind CSS for a premium, dark-mode SaaS aesthetic. A dynamic Three.js neural network visualization runs in the background, reacting to the AI's processing state.

## Assumptions Made
1. **API Key Availability:** We assume the user has access to a Google AI Studio API key to power the Gemini integration.
2. **Client-Side Processing:** We assume that keeping data in the browser (client-side API calls) is preferred by users for privacy and immediate setup, rather than routing data through a centralized backend database.
3. **Modern Browsers:** The dynamic Three.js background assumes the user is on a modern browser with WebGL enabled.

## Evaluation Focus Areas
- **Code Quality:** The project utilizes TypeScript for strict typing, reusable React components (`ui/Button`, `ui/Input`), and modularized API logic (`lib/gemini.ts`).
- **Security:** API keys are never hardcoded or transmitted to an unauthorized backend. They are kept in the client's local context and only sent directly to Google's API endpoints.
- **Efficiency:** The use of Gemini 2.0 Flash ensures extremely fast token generation. The Three.js background is dynamically imported (`ssr: false`) to avoid server-side rendering overhead.
- **Testing:** We use **Vitest** and **React Testing Library** for unit testing component logic and core utilities (`validators.test.ts`, `Button.test.tsx`). Scripts are included in `package.json` for CI/CD integration (`npm run test`).
- **Accessibility:** UI components use standard semantic HTML structures (`role="navigation"`, `role="banner"`), explicit ARIA attributes (`aria-live`, `aria-busy`, `aria-label`), visible focus rings (`focus-visible`), and a "Skip to main content" link for comprehensive screen reader and keyboard support.
- **Google Services:** The core value proposition relies heavily on **Google Gemini** for generative AI, with a specific, high-value integration of **Google Search Grounding** to provide live, factual context for outreach emails.
