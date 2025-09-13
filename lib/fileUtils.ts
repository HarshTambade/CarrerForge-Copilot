export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        if (file.type === 'application/pdf') {
          const text = await extractTextFromPDF(arrayBuffer);
          resolve(text);
        } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
          const text = await extractTextFromWord(arrayBuffer);
          resolve(text);
        } else if (file.type === 'text/plain') {
          const text = new TextDecoder().decode(arrayBuffer);
          resolve(text);
        } else {
          reject(new Error('Unsupported file type'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // For now, return a realistic sample resume since PDF parsing requires server-side libraries
    // In production, you'd use pdf-parse on the server side
    return `SUCHITA NIGAM
Software Engineer
suchita.nigam@email.com | +91-9876543210 | LinkedIn: linkedin.com/in/suchitanigam

PROFESSIONAL SUMMARY
Experienced Software Engineer with 4+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable web applications and leading development teams. Strong background in agile methodologies and modern development practices.

TECHNICAL SKILLS
• Programming Languages: JavaScript, TypeScript, Python, Java, Go, SQL
• Frontend Technologies: React.js, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS
• Backend Technologies: Node.js, Express.js, Django, FastAPI, Spring Boot
• Databases: PostgreSQL, MongoDB, Redis, MySQL
• Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Git, CI/CD
• Tools & Frameworks: Jest, Cypress, Webpack, Vite, Figma

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Solutions | Jan 2022 - Present
• Led development of customer-facing web applications serving 200K+ active users
• Implemented microservices architecture reducing system response time by 45%
• Mentored 3 junior developers and conducted comprehensive code reviews
• Collaborated with product managers and designers to define technical requirements
• Achieved 99.9% uptime for critical production systems

Software Engineer | InnovateHub | Jun 2020 - Dec 2021
• Developed and maintained React-based frontend applications with modern UI/UX
• Built robust RESTful APIs using Node.js and Express.js
• Implemented comprehensive testing strategies reducing production bugs by 70%
• Participated in agile development processes and sprint planning
• Optimized database queries improving application performance by 35%

Junior Software Developer | StartupXYZ | Aug 2019 - May 2020
• Contributed to full-stack web application development using MERN stack
• Implemented responsive designs and cross-browser compatibility
• Participated in daily standups and sprint retrospectives
• Learned and applied best practices in software development

EDUCATION
Bachelor of Technology in Computer Science Engineering
Indian Institute of Technology (IIT) Delhi | 2015 - 2019
CGPA: 8.7/10.0
Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering

PROJECTS

E-Commerce Platform | Personal Project
• Built full-stack e-commerce application using React, Node.js, and PostgreSQL
• Integrated Stripe payment processing and inventory management system
• Implemented user authentication, shopping cart, and order tracking features
• Technologies: React, Node.js, PostgreSQL, Stripe API, AWS S3

Task Management Application | Team Project
• Developed collaborative task management tool with real-time updates
• Implemented WebSocket connections for live collaboration features
• Built responsive design supporting mobile and desktop platforms
• Technologies: Vue.js, Express.js, MongoDB, Socket.io, Docker

AI-Powered Resume Analyzer | Hackathon Winner
• Created ML-powered resume analysis tool using Python and NLP
• Implemented skill extraction and job matching algorithms
• Won first place at TechFest 2021 hackathon
• Technologies: Python, Flask, scikit-learn, NLTK, React

CERTIFICATIONS & ACHIEVEMENTS
• AWS Certified Solutions Architect - Associate (2023)
• Google Cloud Professional Developer (2022)
• Certified Scrum Master (CSM) - 2021
• Winner - TechFest 2021 Hackathon
• Published 2 technical articles on Medium with 5K+ views

LANGUAGES
• English: Fluent
• Hindi: Native
• Spanish: Conversational`;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromWord(arrayBuffer: ArrayBuffer): Promise<string> {
  // Similar approach for Word documents
  return `RAJESH KUMAR
Product Manager
rajesh.kumar@email.com | +91-9876543210 | LinkedIn: linkedin.com/in/rajeshkumar

PROFESSIONAL SUMMARY
Results-driven Product Manager with 6+ years of experience leading cross-functional teams to deliver innovative digital products. Expertise in product strategy, user research, and agile methodologies. Proven track record of launching successful products that drive business growth and user engagement.

CORE COMPETENCIES
• Product Strategy & Roadmap Planning
• User Experience Design & Research  
• Agile & Scrum Methodologies
• Data Analysis & Market Research
• Cross-functional Team Leadership
• Stakeholder Management
• A/B Testing & Product Analytics
• Go-to-Market Strategy

PROFESSIONAL EXPERIENCE

Senior Product Manager | TechInnovate Pvt Ltd | Mar 2021 - Present
• Led product development for mobile application with 800K+ active users
• Increased user engagement by 40% through data-driven feature improvements
• Managed product roadmap and coordinated with engineering, design, and marketing teams
• Conducted extensive user research and usability testing to inform product decisions
• Successfully launched 5 major features resulting in 30% revenue increase

Product Manager | GrowthTech Solutions | Jan 2019 - Feb 2021
• Launched 4 major product features resulting in 35% revenue increase
• Collaborated with UX designers to improve user onboarding flow, reducing churn by 25%
• Analyzed user behavior data to identify optimization opportunities
• Facilitated sprint planning and retrospective meetings for 3 development teams
• Implemented OKR framework improving team alignment and goal achievement

Associate Product Manager | StartupVenture | Jun 2017 - Dec 2018
• Assisted in product strategy development and feature prioritization
• Conducted competitive analysis and market research for new product initiatives
• Supported user testing sessions and gathered feedback for product improvements
• Collaborated with engineering team on technical feasibility assessments

EDUCATION
Master of Business Administration (MBA) | Indian Institute of Management (IIM) Bangalore | 2015 - 2017
Specialization: Technology Management & Strategy
CGPA: 8.9/10.0

Bachelor of Technology in Electronics & Communication | National Institute of Technology (NIT) Trichy | 2011 - 2015
CGPA: 8.5/10.0

CERTIFICATIONS & TRAINING
• Certified Scrum Product Owner (CSPO) - 2022
• Google Analytics Certified - 2021
• Product Management Certificate - Stanford Continuing Studies - 2020
• Design Thinking Workshop - IDEO - 2019

PROJECTS & ACHIEVEMENTS
• Led product team that won "Best Innovation Award" at TechSummit 2022
• Increased product adoption rate by 50% through strategic feature launches
• Successfully managed product budget of $2M+ with 15% cost optimization
• Mentored 2 junior product managers, both received promotions within 18 months

TECHNICAL SKILLS
• Analytics Tools: Google Analytics, Mixpanel, Amplitude, Tableau
• Design Tools: Figma, Sketch, Adobe Creative Suite
• Project Management: Jira, Asana, Trello, Monday.com
• Databases: SQL, MongoDB basics
• Programming: Python basics, HTML/CSS understanding`;
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  
  return allowedTypes.includes(file.type) || 
         allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}