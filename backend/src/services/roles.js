const ROLES = {
  devops: {
    id: 'devops',
    title: 'DevOps Engineer',
    icon: '⚙️',
    color: '#00d4aa',
    levels: {
      fresher: `a DevOps fresher (0-1 yr). Topics: CI/CD concepts, Git basics, what is Docker, Linux commands, pipelines, DevOps culture, YAML, Nginx basics, what is a VM.`,
      mid:     `a mid-level DevOps engineer (2-4 yrs). Topics: Docker networking/volumes/compose, Kubernetes pods/services/deployments, Terraform modules, Jenkins pipelines, Ansible playbooks, Git branching, Prometheus/Grafana, blue-green deploys.`,
      senior:  `a senior DevOps/SRE (5+ yrs). Topics: Kubernetes operators/RBAC/admission controllers, chaos engineering, eBPF observability, GitOps/ArgoCD, multi-cloud, SLOs/SLIs/error budgets, Istio service mesh, platform engineering, FinOps.`
    }
  },
  fullstack: {
    id: 'fullstack',
    title: 'Java Full Stack Developer',
    icon: '☕',
    color: '#f59e0b',
    levels: {
      fresher: `a Java full stack fresher (0-1 yr). Topics: Java OOP basics, Spring Boot hello world, REST API concepts, HTML/CSS basics, JavaScript fundamentals, Maven/Gradle, SQL basics, what is React/Angular, Git basics, MVC pattern.`,
      mid:     `a mid-level Java full stack developer (2-4 yrs). Topics: Spring Boot advanced (security, JPA, Hibernate), Microservices basics, React hooks and state management, REST vs GraphQL, JWT auth, Docker basics, MySQL/PostgreSQL, unit testing (JUnit/Mockito), CI/CD pipelines.`,
      senior:  `a senior Java full stack developer (5+ yrs). Topics: Spring Cloud microservices, Kafka messaging, reactive programming (WebFlux), advanced React patterns (Redux Toolkit, React Query), system design, distributed transactions, database optimization, Kubernetes deployment, security best practices, performance tuning.`
    }
  },
  dataanalyst: {
    id: 'dataanalyst',
    title: 'Data Analyst',
    icon: '📊',
    color: '#8b5cf6',
    levels: {
      fresher: `a data analyst fresher (0-1 yr). Topics: What is data analysis, Excel basics, SQL SELECT queries, what is a dashboard, types of charts, mean/median/mode, what is Python for data, what is a database, data cleaning basics, business intelligence concepts.`,
      mid:     `a mid-level data analyst (2-4 yrs). Topics: Advanced SQL (joins, window functions, CTEs), Python pandas/numpy, data visualization with Tableau/Power BI, statistical analysis, A/B testing concepts, ETL pipelines, data warehousing basics, storytelling with data, KPIs and metrics.`,
      senior:  `a senior data analyst (5+ yrs). Topics: Advanced Python (scikit-learn basics, matplotlib/seaborn), data modeling (star/snowflake schema), dimensional modeling, advanced statistics, machine learning for analysts, data governance, stakeholder management, building data pipelines, Snowflake/BigQuery, predictive analytics.`
    }
  },
  cybersecurity: {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    icon: '🔐',
    color: '#ef4444',
    levels: {
      fresher: `a cybersecurity fresher (0-1 yr). Topics: CIA triad, what is a firewall, types of malware, phishing attacks, what is encryption, SSL/TLS basics, what is a VPN, network basics (TCP/IP, ports), password security, what is SIEM.`,
      mid:     `a mid-level cybersecurity analyst (2-4 yrs). Topics: Penetration testing basics, OWASP Top 10, SIEM tools (Splunk), incident response process, vulnerability assessment, network security (IDS/IPS), identity and access management, SOC operations, CVE analysis, log analysis.`,
      senior:  `a senior cybersecurity engineer (5+ yrs). Topics: Advanced threat hunting, red team/blue team operations, malware analysis, Zero Trust architecture, cloud security (AWS/Azure security), DevSecOps, forensic investigation, APT detection, risk management frameworks (NIST/ISO 27001), threat intelligence platforms.`
    }
  },
  cloud: {
    id: 'cloud',
    title: 'Cloud Engineer',
    icon: '☁️',
    color: '#3b82f6',
    levels: {
      fresher: `a cloud engineer fresher (0-1 yr). Topics: What is cloud computing, IaaS/PaaS/SaaS, AWS/Azure/GCP basic services (EC2, S3, RDS), what is a load balancer, cloud vs on-premise, basic networking in cloud, what is auto-scaling, cloud billing basics, IAM basics.`,
      mid:     `a mid-level cloud engineer (2-4 yrs). Topics: AWS core services deep dive (VPC, Lambda, ECS, EKS, CloudFormation), Terraform IaC, cloud networking (VPNs, Direct Connect), managed databases (RDS, DynamoDB), serverless architecture, cloud monitoring (CloudWatch), cost optimization, multi-region deployments.`,
      senior:  `a senior cloud architect (5+ yrs). Topics: Multi-cloud architecture (AWS + GCP/Azure), cloud-native design patterns, microservices on Kubernetes, advanced networking (Transit Gateway, SD-WAN), FinOps and cost governance, disaster recovery strategies, Well-Architected Framework, event-driven architectures, data lake architectures, cloud security posture.`
    }
  }
}

module.exports = { ROLES }
