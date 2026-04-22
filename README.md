# Campus INPT (IT Events Platform)

A full-stack prototype application for discovering, managing, and interacting with university clubs, events, and a built-in RAG-based AI chatbot.

## Features

- **Club Directory**: Browse clubs by category (Tech, Sport, Art, Science, Entrepreneuriat, Social, Freelance).
- **Events & Hackathons**: Find IT events, hackathons, and activities organized by clubs.
- **AI Chatbot**: A Retrieval-Augmented Generation (RAG) chatbot using ChromaDB and Mistral AI embeddings to answer questions using uploaded documents.
- **Document Management**: Upload PDF documents to the database to feed the chatbot's knowledge.
- **Dark Mode Support**: Beautiful Tailwind CSS interface with Radix UI components.

## Tech Stack

### Frontend
- Next.js (React)
- Tailwind CSS v3
- TypeScript
- Radix UI & Lucide React (Icons)

### Backend
- FastAPI (Python)
- SQLModel (SQLite)
- ChromaDB (Vector Search)
- LangChain & Mistral AI
- Uvicorn

## Getting Started

### Prerequisites
- Node.js & npm
- Python 3.10+
- A Mistral API Key (`MISTRAL_API_KEY`)

### Backend Setup
1. Navigate to the `backend` folder.
2. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend` directory:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Initialization
The backend is configured to automatically create the SQLite database (`campus_inpt.db`) and seed the initial clubs upon startup.

## License
MIT
