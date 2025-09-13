# 🚀 CareerForge Copilot  

> **CareerForge Copilot = Career GPS + Proof-of-Skills Engine**  
Guides, validates, and tracks your career growth beyond just resume optimization.  

---

## ✨ Features  

### 📝 Smart Resume Optimizer + Proof Validation  
- Upload resume → AI tailors it to any job description  
- ATS Score Predictor (% compatibility)  
- STAR-format bullet rewriting with measurable impact  
- Link resume bullets to **proofs** (GitHub commits, Kaggle projects, certifications, demo videos)  

### 📊 Skill Gap Analyzer + Role Delta Engine  
- Paste job link → AI compares required vs current skills  
- Spider chart visualization (your skills vs role skills)  
- Rank missing skills by **impact & ease of learning**  
- Generate a **30-day personalized upskilling plan**  

### 🎯 Personalized Growth Engine  
- Micro-learning paths → daily 15-min tasks  
- Micro-internship generator (mini-projects aligned with missing skills)  
- ROI-based certification roadmap  

### 📌 Career Intelligence Dashboard  
- Track applications, ATS improvements, & success rates  
- **Recruiter Simulator**: Heatmap of recruiter’s 6s skim  
- AI-generated interview prep questions  
- Salary Negotiation Assistant with market data  

### 🧬 Gamified Career DNA Profile  
- Build a **career fingerprint** (hard + soft skills + aspirations)  
- Career XP system → badges for milestones  
- Weekly career challenges based on market trends  

### 🤝 Peer Learning & Job Market Integration  
- Anonymous mentorship (match with peers who made similar moves)  
- Live job feed tailored to evolving skill profile  
- “Ready Score” → % readiness for each role in real time  

---

## 🏆 Why CareerForge?  
✅ Goes beyond resume polishing → adds recruiter simulator, proof-based resumes, micro-internships, and readiness scoring  
✅ Shows **real impact** → ATS % improvement, time saved, reduced skill gaps  
✅ Hackathon MVP-ready with **innovation + feasibility balance**  

---

## 🛠️ Tech Stack  

**Frontend**  
- Next.js / React  
- Tailwind CSS  

**Backend**  
- FastAPI / Django  

**AI/ML**  
- Resume Parsing → spaCy, HuggingFace Transformers  
- Job Matching → Sentence Transformers  
- Resume Rewriting → LLM (OpenAI API / LLaMA)  
- Recruiter Simulator → Attention Heatmaps + GPT Summaries  

**Database**  
- PostgreSQL  
- FAISS (for embeddings)  

**Integrations**  
- LinkedIn (job scraping)  
- GitHub / Google Drive (proofs)  
- Coursera / Udemy (learning paths)  

---

## ⚡ Hackathon MVP Demo Flow (3–5 mins)  
1. Upload Resume + Paste Job Link → ATS Score + Tailored Resume  
2. Role Delta Visualization → Spider Chart of Missing Skills  
3. One-Click Growth Plan → Personalized Roadmap  
4. Recruiter Simulator → Heatmap of Recruiter’s First Impressions  
5. Export Resume + Career DNA Profile (PDF + Proof-based Link)  

---

## 📦 Installation  

```bash
# Clone the repository
git clone https://github.com/your-org/careerforge-copilot.git
cd careerforge-copilot

# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup
cd ../backend
pip install -r requirements.txt
uvicorn main:app --reload
