# 🔮 Future Decision Engine (Predictive Analytics System)

An enterprise-grade, full-stack predictive analytics platform built to solve real-world algorithmic problems—specifically **Automated Financial Underwriting & Credit Risk Mitigation**. 

The system trains state-of-the-art **XGBoost** and **Random Forest** models on highly correlated institutional data, auto-tunes them for maximum precision using Cross-Validation, and exposes them through a sleek, highly interactive 2026-era React dashboard featuring real-time "Agentic Explanations" of its mathematical reasoning.

---

## 🎯 Key Features

1. **Auto-Tuned ML Pipelines 🤖**
   * Employs scikit-learn's `RandomizedSearchCV` combined with robust `ColumnTransformers` containing proper `SimpleImputer`, `StandardScaler`, and `OneHotEncoder` parameters.
   * Auto-tunes XGBoost hyperparameters silently in the background via strict K-fold Cross-Validation to guarantee peak accuracy, eliminating manual guesswork.
   * Zero data leakage between training and real-time inference.

2. **Fair Lending & 'Agentic' Explainable AI ⚖️**
   * Built for highly-regulated environments where AI decisions *must* be explainable.
   * Dynamically generates an **Agentic Reasoning Trace** that exposes the model's exact computational thought process, mapping exactly which inputs caused the specific confidence percentage.

3. **Institutional Business Logic & Decisioning 🏦**
   * Instead of generic output, the AI provides actionable financial mandates. It issues concrete underwriting directions based on distinct confidence thresholds (e.g., *“High Risk Profile: Debt-to-income violation. Decline application and issue FCRA adverse action notice.”*).

4. **Highly Interactive 2026 Web Environment 🌐**
   * Breathtaking UI built on **React + Vite** with sophisticated Glassmorphism and pulsing neon accents.
   * **Dynamic Prediction Form:** Raw textual inputs have been systematically replaced with interactive HTML5 Range Sliders and smart Select drop-downs mapped natively to the database parameters.
   * Real-time Data Visualization powered by `Recharts` rendering performance metrics and historical analytics.

---

## 🏗️ Technology Stack

| Domain | Technology/Framework |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Lucide React, Recharts |
| **Backend API** | FastAPI (Python), Async APIs |
| **Machine Learning** | Scikit-Learn (Pipelines, Calibration), XGBoost, Pandas, Numpy |
| **Database** | SQLite (Local Dev) / PostgreSQL (Production via SQLAlchemy ORM) |
| **Authentication** | JWT (JSON Web Tokens) with Bcrypt Hashing |
| **DevOps** | Docker, Docker Compose, Nginx (SPA routing) |

---

## 🚀 Quickstart (Local Development)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
Navigate to the backend folder and boot the API server:
```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Start the FastAPI Server (Defaults to http://localhost:8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
Open a separate terminal window and start the Vite development server:
```bash
cd frontend
npm install

# Start the React Server (Defaults to http://localhost:5173)
npm run dev
```

### 4. Seeding the Application & Generating Data
To operate the platform efficiently, you need institutional data. A highly-correlated financial data generator is included:
```bash
cd backend
# Generate `sample_loan_data.csv` solving the "Loan Approval" credit-risk problem
python ml/generate_sample_data.py

# Optionally run the integration tests to verify the pipeline end-to-end
python test_e2e.py
```

---

## 🐳 Docker Deployment

The application is fully containerized for massive scalability. Utilizing multi-stage Docker builds, the backend orchestrates Uvicorn workers while the frontend is served via an optimized Nginx proxy.

Ensure Docker Desktop is running, then simply execute:
```bash
docker-compose up --build
```
* **Frontend UI:** `http://localhost:80`
* **Backend API Docs (Swagger):** `http://localhost:8000/docs`

---

## 🛡️ License & Disclaimers
This predictive engine is designed as a software architecture demonstration. While its underlying calculations mimic real institutional credit underwriting risk mechanics, it should absolutely not be deployed to handle real-world financial capital directly without prior rigorous regulatory sign-off conforming to Fair Credit and Anti-Discrimination parameters.
# Analytics-Engine
