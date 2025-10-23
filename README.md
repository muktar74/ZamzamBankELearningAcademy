# Zamzam Bank E-Learning Platform


An internal e-learning website for Zamzam Bank, designed to deliver short, targeted training on different issues regarding Islamic Finance Banking (IFB). The platform allows employees to take courses, complete quizzes, and generate certificates, while administrators can manage all course content and user progress. The application is enhanced with Google's Gemini AI for content generation, analysis, and a helpful AI assistant.

---

## ✨ Key Features

### For Employees (Learners)
- **Personalized Dashboard**: View progress, recently viewed courses, points, and earned badges at a glance.
- **Course Catalog**: Browse, search, and filter all available courses by status (All, In Progress, Completed).
- **Interactive Course View**: Engage with course content module by module, including HTML-formatted lessons and downloadable textbooks.
- **Quizzes & Assessments**: Test knowledge with final quizzes that unlock upon module completion.
- **Certificate Generation**: Instantly generate and download a professional Certificate of Completion in PDF, PNG, or JPG format.
- **Gamification**: Earn points for completing modules and courses. Unlock badges for achieving milestones (e.g., 'First Course', 'Quiz Master').
- **Leaderboard**: See how you rank against your peers based on points earned.
- **Discussion Forums**: Engage in discussions with colleagues on a per-course basis.
- **Course Reviews**: Rate and review courses to provide feedback.
- **AI Personal Assistant**: Get instant answers to questions about Islamic Finance or specific course content from a Gemini-powered chatbot.
- **Profile Management**: Update your name, email, and profile picture.

### For Administrators
- **Comprehensive Admin Dashboard**: A centralized hub for managing all aspects of the platform.
- **Course Management (CRUD)**: Create, read, update, and delete courses.
- **AI-Powered Content Generation**: Use the Gemini API to automatically generate:
    - A detailed course description.
    - Multiple structured learning modules with HTML content.
    - A relevant final quiz with multiple-choice questions and answers.
- **User Management (CRUD)**: Manage employee accounts, approve new registrations, and edit user details.
- **Resource Library Management**: Add, edit, and delete curated external resources (articles, books, videos).
- **Platform Analytics**: View key statistics like total users, courses, and completions.
- **AI-Powered Discussion Analysis**: Use Gemini to analyze all course discussions and extract key topics and trends.
- **Report Generation**: Download platform data as CSV files for:
    - User Registrations
    - Course Completions
    - Overall Course Performance
- **Notification System**: Broadcast custom messages to all employees or send targeted notifications to individuals.

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Certificate Generation**: `html2canvas`, `jspdf`
- **Data Persistence**: `LocalStorage` (for demonstration purposes)

---

## 🚀 Getting Started

This application is designed to run in a self-contained browser environment where the Gemini API key is provided as an environment variable.

### Prerequisites
- A modern web browser.
- The `API_KEY` for the Google Gemini service must be configured in the deployment environment.

### Running the Application
1.  The application is served via `index.html`.
2.  The main application logic is in `index.tsx`, which is loaded as a module.
3.  All dependencies like React and `@google/genai` are loaded via an `importmap` from a CDN, requiring no local installation.

---

## 🔐 Security Warning

This project is intended for **demonstration purposes only**. Several components are implemented in a simplified way that is **not secure for a production environment**:

1.  **Authentication**: User credentials (email and plaintext passwords) are stored directly in the client-side code (`constants.ts`). **This is a major security vulnerability.** In a real-world application, authentication must be handled by a secure backend server that stores hashed passwords and uses a token-based system (e.g., JWT, OAuth).
2.  **Data Storage**: All application data (users, courses, progress) is stored in the browser's `LocalStorage`. This data is not persistent, is not shared between users, and can be easily manipulated by the end-user. A production application requires a secure backend and a database (e.g., PostgreSQL, MongoDB).
3.  **Authorization**: User roles are managed on the client-side, which is insecure. A backend should always validate a user's permissions before performing any action.

---

## ☁️ Deployment

This application is ready for deployment on static hosting platforms like **Vercel** or **Netlify**.

To deploy:
1.  Commit the entire project to a Git repository (e.g., GitHub, GitLab).
2.  Connect your repository to your hosting provider (e.g., Vercel).
3.  Configure the build settings (usually no special settings are needed for a Vite/CRA-like setup).
4.  **Crucially**, set the `API_KEY` as an **environment variable** in your Vercel project settings. The key should be named `API_KEY`. The application is built to read this variable directly.
