export const ROLES = {
  devops: {
    id: 'devops', title: 'DevOps Engineer', icon: '⚙️',
    color: '#00d4aa', shadow: 'rgba(0,212,170,0.15)',
    interviewer: 'Alex', interviewerTitle: 'Senior DevOps Lead',
    gradient: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,212,170,0.03))',
    topics: ['CI/CD Pipelines', 'Kubernetes', 'Terraform', 'Docker', 'SRE Practices'],
    desc: 'Infrastructure, automation, CI/CD, containers, cloud operations'
  },
  fullstack: {
    id: 'fullstack', title: 'Java Full Stack', icon: '☕',
    color: '#f59e0b', shadow: 'rgba(245,158,11,0.15)',
    interviewer: 'Priya', interviewerTitle: 'Engineering Manager',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))',
    topics: ['Spring Boot', 'React / Angular', 'Microservices', 'REST APIs', 'Database Design'],
    desc: 'Java backend, Spring Boot, React/Angular frontend, microservices'
  },
  dataanalyst: {
    id: 'dataanalyst', title: 'Data Analyst', icon: '📊',
    color: '#8b5cf6', shadow: 'rgba(139,92,246,0.15)',
    interviewer: 'Morgan', interviewerTitle: 'Head of Analytics',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.03))',
    topics: ['SQL & Queries', 'Python / Pandas', 'Power BI / Tableau', 'Statistics', 'ETL Pipelines'],
    desc: 'SQL, Python, data visualization, statistics, business intelligence'
  },
  cybersecurity: {
    id: 'cybersecurity', title: 'Cybersecurity', icon: '🔐',
    color: '#ef4444', shadow: 'rgba(239,68,68,0.15)',
    interviewer: 'Jordan', interviewerTitle: 'Security Director',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))',
    topics: ['Threat Analysis', 'OWASP Top 10', 'Incident Response', 'Penetration Testing', 'Zero Trust'],
    desc: 'Network security, threat analysis, SIEM, penetration testing'
  },
  cloud: {
    id: 'cloud', title: 'Cloud Engineer', icon: '☁️',
    color: '#3b82f6', shadow: 'rgba(59,130,246,0.15)',
    interviewer: 'Sam', interviewerTitle: 'Cloud Architect',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.03))',
    topics: ['AWS / Azure / GCP', 'Serverless', 'Terraform IaC', 'Cloud Networking', 'FinOps'],
    desc: 'AWS, Azure, GCP, serverless, IaC, cloud architecture patterns'
  }
}

export const LEVELS = [
  { id: 'fresher', label: 'Fresher',   years: '0–1 yr',  desc: 'Core concepts & fundamentals' },
  { id: 'mid',     label: 'Mid-Level', years: '2–4 yrs', desc: 'Deep technical knowledge' },
  { id: 'senior',  label: 'Senior',    years: '5+ yrs',  desc: 'Architecture & leadership' }
]

export const TOTAL_QUESTIONS = 7
