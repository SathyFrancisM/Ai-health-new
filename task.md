# MediGuide Development Tasks

- `[x]` **Phase 1: Setup & Scaffolding**
  - `[x]` Initialize Next.js in `frontend/` folder.
  - `[x]` Setup Tailwind CSS, Framer Motion, Lucide React, and Three.js dependencies.
  - `[x]` Initialize Express in `backend/` folder with basic structure.

- `[x]` **Phase 2: Authentication & Database Mock**
  - `[x]` Create mock user database and mock endpoints for Auth in `backend/`.
  - `[x]` Build Auth UI (Login/Register) in `frontend/`.
  - `[x]` Build Health Onboarding form (collecting allergies, health data).

- `[x]` **Phase 3: The AI Chatbot Engine**
  - `[x]` Build frontend Chat Interface with left-panel text and center 3D canvas.
  - `[x]` Implement proxy 3D Avatar (a bouncing graphical companion).
  - `[x]` Add Speech-to-Text and Text-to-Speech logic using Web Speech API.
  - `[x]` Implement Mock AI API endpoint in `backend/` enforcing strict logic (Home remedies only, filtering allergies, language matching).

- `[x]` **Phase 4: Emergency Trigger System**
  - `[x]` Add global 🚨 Emergency Button in UI.
  - `[x]` Create Mock Twilio/WhatsApp API endpoint in `backend/`.
  - `[x]` Implement 3-minute inactivity auto-trigger (disabled by "bye").

- `[x]` **Phase 5: Booking Portals & Polishing**
  - `[x]` Build Hospital Search Page (using mock data).
  - `[x]` Build Doctor Consultation Page (using mock data).
  - `[x]` Refine UI animations, dynamic styling, and error handling.
