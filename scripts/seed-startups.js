const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, '..', 'data', 'startups.db');
console.log('Database path:', dbPath);
const db = new Database(dbPath);

// Startup data with realistic information
const startups = [
  {
    id: '1',
    name: 'TechFlow Analytics',
    description: 'AI-powered business intelligence platform that provides real-time analytics and predictive insights for enterprise decision-making. Specializes in data visualization and automated reporting.',
    sector: 'SaaS',
    stage: 'Series A',
    country: 'USA',
    team_info: 'Founded by ex-Google and Microsoft engineers. 25 employees across engineering, sales, and customer success.',
    memo: null
  },
  {
    id: '2',
    name: 'GreenEnergy Solutions',
    description: 'Renewable energy management platform that helps businesses optimize their energy consumption and transition to sustainable power sources. Includes solar panel monitoring and carbon footprint tracking.',
    sector: 'CleanTech',
    stage: 'Seed',
    country: 'Germany',
    team_info: 'Founded by energy industry veterans. 15 employees with expertise in renewable energy and software development.',
    memo: null
  },
  {
    id: '3',
    name: 'HealthTech Pro',
    description: 'Digital health platform that connects patients with healthcare providers through telemedicine, appointment scheduling, and health record management. Focuses on preventive care and chronic disease management.',
    sector: 'HealthTech',
    stage: 'Series B',
    country: 'USA',
    team_info: 'Founded by healthcare professionals and technologists. 40 employees including doctors, engineers, and healthcare administrators.',
    memo: null
  },
  {
    id: '4',
    name: 'FinFlow',
    description: 'Financial technology platform that provides automated accounting, expense tracking, and financial planning for small businesses. Integrates with major banking systems and accounting software.',
    sector: 'FinTech',
    stage: 'Series A',
    country: 'UK',
    team_info: 'Founded by former bankers and accountants. 30 employees with strong financial and technical backgrounds.',
    memo: null
  },
  {
    id: '5',
    name: 'EduTech Innovations',
    description: 'Educational technology platform that creates personalized learning experiences using AI. Offers adaptive curriculum, progress tracking, and virtual tutoring for K-12 and higher education.',
    sector: 'EdTech',
    stage: 'Seed',
    country: 'Canada',
    team_info: 'Founded by educators and software engineers. 20 employees with backgrounds in education, psychology, and technology.',
    memo: null
  }
];

// Competitors data for each startup
const competitors = [
  // TechFlow Analytics competitors
  {
    startup_id: '1',
    competitor_name: 'Tableau Software',
    description: 'Leading data visualization and business intelligence platform. Strong in enterprise analytics and dashboard creation.',
    founded_year: 2003,
    employee_count: 4000,
    funding_raised: 0,
    revenue: 1500000000,
    linkedin_url: 'https://linkedin.com/company/tableau-software',
    website_url: 'https://tableau.com',
    main_features: 'Data visualization, dashboard creation, enterprise analytics',
    similarity_score: 0.85,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '1',
    competitor_name: 'Power BI',
    description: 'Microsoft\'s business analytics service. Integrates well with Microsoft ecosystem and offers self-service BI capabilities.',
    founded_year: 2015,
    employee_count: 180000,
    funding_raised: 0,
    revenue: 50000000000,
    linkedin_url: 'https://linkedin.com/company/microsoft',
    website_url: 'https://powerbi.microsoft.com',
    main_features: 'Business intelligence, data modeling, cloud analytics',
    similarity_score: 0.80,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '1',
    competitor_name: 'Looker',
    description: 'Data platform that provides business intelligence and analytics. Strong in data modeling and embedded analytics.',
    founded_year: 2012,
    employee_count: 800,
    funding_raised: 280000000,
    revenue: 100000000,
    linkedin_url: 'https://linkedin.com/company/looker',
    website_url: 'https://looker.com',
    main_features: 'Data modeling, embedded analytics, business intelligence',
    similarity_score: 0.75,
    is_external: true,
    research_status: 'completed'
  },

  // GreenEnergy Solutions competitors
  {
    startup_id: '2',
    competitor_name: 'Enphase Energy',
    description: 'Solar microinverter manufacturer and energy management platform. Strong in residential solar monitoring.',
    founded_year: 2006,
    employee_count: 3000,
    funding_raised: 0,
    revenue: 2000000000,
    linkedin_url: 'https://linkedin.com/company/enphase-energy',
    website_url: 'https://enphase.com',
    main_features: 'Solar monitoring, microinverters, energy management',
    similarity_score: 0.70,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '2',
    competitor_name: 'SolarEdge',
    description: 'Solar inverter and monitoring solutions provider. Focuses on residential and commercial solar installations.',
    founded_year: 2006,
    employee_count: 4000,
    funding_raised: 0,
    revenue: 2500000000,
    linkedin_url: 'https://linkedin.com/company/solaredge',
    website_url: 'https://solaredge.com',
    main_features: 'Solar inverters, monitoring, energy optimization',
    similarity_score: 0.75,
    is_external: true,
    research_status: 'completed'
  },

  // HealthTech Pro competitors
  {
    startup_id: '3',
    competitor_name: 'Teladoc Health',
    description: 'Leading telemedicine platform providing virtual healthcare services. Strong in primary care and mental health.',
    founded_year: 2002,
    employee_count: 6000,
    funding_raised: 0,
    revenue: 2000000000,
    linkedin_url: 'https://linkedin.com/company/teladoc-health',
    website_url: 'https://teladoc.com',
    main_features: 'Telemedicine, virtual care, health records',
    similarity_score: 0.90,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '3',
    competitor_name: 'Amwell',
    description: 'Digital healthcare platform offering telehealth solutions for providers and patients.',
    founded_year: 2006,
    employee_count: 2000,
    funding_raised: 500000000,
    revenue: 300000000,
    linkedin_url: 'https://linkedin.com/company/amwell',
    website_url: 'https://amwell.com',
    main_features: 'Telehealth, virtual care, provider network',
    similarity_score: 0.85,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '3',
    competitor_name: 'Doximity',
    description: 'Professional network for healthcare professionals with telemedicine capabilities.',
    founded_year: 2010,
    employee_count: 500,
    funding_raised: 80000000,
    revenue: 200000000,
    linkedin_url: 'https://linkedin.com/company/doximity',
    website_url: 'https://doximity.com',
    main_features: 'Healthcare network, telemedicine, professional tools',
    similarity_score: 0.70,
    is_external: true,
    research_status: 'completed'
  },

  // FinFlow competitors
  {
    startup_id: '4',
    competitor_name: 'QuickBooks',
    description: 'Intuit\'s accounting software for small businesses. Comprehensive financial management platform.',
    founded_year: 1983,
    employee_count: 12000,
    funding_raised: 0,
    revenue: 10000000000,
    linkedin_url: 'https://linkedin.com/company/intuit',
    website_url: 'https://quickbooks.intuit.com',
    main_features: 'Accounting, invoicing, expense tracking',
    similarity_score: 0.80,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '4',
    competitor_name: 'Xero',
    description: 'Cloud-based accounting software for small businesses. Strong in international markets.',
    founded_year: 2006,
    employee_count: 4000,
    funding_raised: 0,
    revenue: 800000000,
    linkedin_url: 'https://linkedin.com/company/xero',
    website_url: 'https://xero.com',
    main_features: 'Cloud accounting, invoicing, bank reconciliation',
    similarity_score: 0.85,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '4',
    competitor_name: 'FreshBooks',
    description: 'Cloud accounting software designed for small business owners and freelancers.',
    founded_year: 2003,
    employee_count: 500,
    funding_raised: 100000000,
    revenue: 100000000,
    linkedin_url: 'https://linkedin.com/company/freshbooks',
    website_url: 'https://freshbooks.com',
    main_features: 'Invoicing, expense tracking, time tracking',
    similarity_score: 0.75,
    is_external: true,
    research_status: 'completed'
  },

  // EduTech Innovations competitors
  {
    startup_id: '5',
    competitor_name: 'Duolingo',
    description: 'Language learning platform using gamification and AI. Strong in mobile learning.',
    founded_year: 2011,
    employee_count: 500,
    funding_raised: 200000000,
    revenue: 400000000,
    linkedin_url: 'https://linkedin.com/company/duolingo',
    website_url: 'https://duolingo.com',
    main_features: 'Language learning, gamification, mobile education',
    similarity_score: 0.60,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '5',
    competitor_name: 'Khan Academy',
    description: 'Non-profit educational platform providing free online courses and resources.',
    founded_year: 2008,
    employee_count: 200,
    funding_raised: 0,
    revenue: 50000000,
    linkedin_url: 'https://linkedin.com/company/khan-academy',
    website_url: 'https://khanacademy.org',
    main_features: 'Free education, video lessons, practice exercises',
    similarity_score: 0.70,
    is_external: true,
    research_status: 'completed'
  },
  {
    startup_id: '5',
    competitor_name: 'Coursera',
    description: 'Online learning platform offering courses from top universities and companies.',
    founded_year: 2012,
    employee_count: 1000,
    funding_raised: 400000000,
    revenue: 400000000,
    linkedin_url: 'https://linkedin.com/company/coursera',
    website_url: 'https://coursera.org',
    main_features: 'Online courses, certificates, degree programs',
    similarity_score: 0.65,
    is_external: true,
    research_status: 'completed'
  }
];

// Metrics data for each startup
const metrics = [
  {
    startup_id: '1',
    arr: 2500000,
    mrr: 208333,
    cac: 1500,
    ltv: 15000,
    churn: 5.2,
    runway: 18,
    burn_rate: 150000,
    customer_count: 150,
    revenue_growth: 45
  },
  {
    startup_id: '2',
    arr: 800000,
    mrr: 66667,
    cac: 800,
    ltv: 12000,
    churn: 3.8,
    runway: 24,
    burn_rate: 80000,
    customer_count: 80,
    revenue_growth: 65
  },
  {
    startup_id: '3',
    arr: 12000000,
    mrr: 1000000,
    cac: 2500,
    ltv: 25000,
    churn: 4.1,
    runway: 12,
    burn_rate: 300000,
    customer_count: 450,
    revenue_growth: 35
  },
  {
    startup_id: '4',
    arr: 3500000,
    mrr: 291667,
    cac: 1200,
    ltv: 18000,
    churn: 6.5,
    runway: 15,
    burn_rate: 120000,
    customer_count: 280,
    revenue_growth: 55
  },
  {
    startup_id: '5',
    arr: 1200000,
    mrr: 100000,
    cac: 600,
    ltv: 8000,
    churn: 4.8,
    runway: 30,
    burn_rate: 60000,
    customer_count: 120,
    revenue_growth: 75
  }
];

// Market analysis data (simplified for OpenAI deep research)
const marketAnalysis = [
  {
    startup_id: '1',
    research_report: 'Market Research Report for TechFlow Analytics\n\nSECTOR: Business Intelligence & Analytics\n\nMARKET OVERVIEW:\nThe global business intelligence and analytics market is valued at approximately $25 billion, with a projected growth rate of 12.5% annually. The market is driven by increasing demand for real-time analytics, AI/ML integration, and cloud migration trends.\n\nTARGET MARKET:\n- Enterprise customers seeking advanced analytics solutions\n- Mid-market companies looking for scalable BI tools\n- SMBs requiring affordable analytics platforms\n\nCOMPETITIVE LANDSCAPE:\nEstablished players dominate the enterprise segment, creating opportunities in the mid-market space. Key differentiators include AI-powered insights, embedded analytics, and industry-specific solutions.\n\nMARKET OPPORTUNITIES:\n- AI-powered predictive analytics\n- Embedded analytics in existing workflows\n- Industry-specific vertical solutions\n- Real-time data processing capabilities\n\nRISK ASSESSMENT:\n- Economic downturn affecting IT spending\n- Talent shortage in data science\n- Security and privacy concerns\n- Rapid technology evolution',
    research_status: 'completed'
  },
  {
    startup_id: '2',
    research_report: 'Market Research Report for GreenEnergy Solutions\n\nSECTOR: Renewable Energy & Sustainability\n\nMARKET OVERVIEW:\nThe renewable energy market is valued at approximately $15 billion globally, with strong growth of 18.2% annually. The market is driven by renewable energy adoption, sustainability focus, and government incentives.\n\nTARGET MARKET:\n- Commercial buildings seeking energy optimization\n- Industrial facilities requiring sustainability solutions\n- Residential customers adopting green energy\n\nCOMPETITIVE LANDSCAPE:\nFragmented market with regional players, where technology differentiation is key. Opportunities exist in energy optimization, carbon tracking, and smart grid integration.\n\nMARKET OPPORTUNITIES:\n- Energy optimization and efficiency solutions\n- Carbon footprint tracking and reporting\n- Smart grid integration technologies\n- Sustainability consulting services\n\nRISK ASSESSMENT:\n- Policy changes affecting incentives\n- Technology disruption from new innovations\n- Supply chain issues for components\n- Regulatory compliance requirements',
    research_status: 'completed'
  },
  {
    startup_id: '3',
    research_report: 'Market Research Report for HealthTech Innovations\n\nSECTOR: Digital Health & Telemedicine\n\nMARKET OVERVIEW:\nThe digital health market is valued at approximately $80 billion globally, with rapid growth of 22.8% annually. The market is driven by telemedicine adoption, digital health integration, and preventive care focus.\n\nTARGET MARKET:\n- Primary care providers seeking digital solutions\n- Specialty care practices requiring telemedicine tools\n- Mental health services needing digital platforms\n\nCOMPETITIVE LANDSCAPE:\nLarge players dominate the market, but opportunities exist in specialized care segments. Key areas include chronic disease management, mental health, and rural healthcare access.\n\nMARKET OPPORTUNITIES:\n- Chronic disease management platforms\n- Mental health digital solutions\n- Rural healthcare access technologies\n- Preventive care and wellness apps\n\nRISK ASSESSMENT:\n- Regulatory changes in healthcare\n- Reimbursement uncertainty\n- Provider adoption challenges\n- Data privacy and security concerns',
    research_status: 'completed'
  },
  {
    startup_id: '4',
    research_report: 'Market Research Report for FinFlow Pro\n\nSECTOR: Financial Technology & Accounting\n\nMARKET OVERVIEW:\nThe fintech market for small business solutions is valued at approximately $12 billion, with steady growth of 15.4% annually. The market is driven by cloud adoption, automation, and real-time financial insights.\n\nTARGET MARKET:\n- Small and medium businesses (SMBs)\n- Freelancers and independent contractors\n- Startups requiring financial management tools\n\nCOMPETITIVE LANDSCAPE:\nEstablished players have strong brand recognition, making UX differentiation key. Opportunities exist in AI-powered insights, automation, and integration ecosystems.\n\nMARKET OPPORTUNITIES:\n- AI-powered financial insights\n- Automated bookkeeping and accounting\n- Integration with existing business tools\n- Real-time financial reporting\n\nRISK ASSESSMENT:\n- Economic sensitivity affecting SMB spending\n- Regulatory changes in financial services\n- Security concerns for financial data\n- Competition from established players',
    research_status: 'completed'
  },
  {
    startup_id: '5',
    research_report: 'Market Research Report for EduTech Solutions\n\nSECTOR: Educational Technology & E-Learning\n\nMARKET OVERVIEW:\nThe educational technology market is valued at approximately $20 billion globally, with strong growth of 25.6% annually. The market is driven by personalized learning, AI integration, and mobile-first approaches.\n\nTARGET MARKET:\n- K-12 educational institutions\n- Higher education providers\n- Corporate training departments\n\nCOMPETITIVE LANDSCAPE:\nDiverse players across different segments, with content quality being a key differentiator. Opportunities exist in adaptive learning, skill-based education, and lifelong learning.\n\nMARKET OPPORTUNITIES:\n- Adaptive learning technologies\n- Skill-based education platforms\n- Lifelong learning solutions\n- Corporate training and development\n\nRISK ASSESSMENT:\n- Economic sensitivity affecting education budgets\n- Technology adoption barriers\n- Content quality and accreditation concerns\n- Competition from established education providers',
    research_status: 'completed'
  }
];

// Sample documents for each startup
const documents = [
  {
    startup_id: '1',
    name: 'TechFlow Business Plan 2024',
    type: 'pdf',
    summary: 'Comprehensive business plan outlining TechFlow\'s strategy for market expansion and product development.',
    kpis: 'ARR growth target: 60%, Customer acquisition cost: $1,500, Churn rate target: <5%',
    red_flags: 'High customer acquisition costs, dependency on key personnel',
    content: 'Business plan content would be here...',
    created_at: new Date().toISOString()
  },
  {
    startup_id: '1',
    name: 'TechFlow Financial Model',
    type: 'xlsx',
    summary: 'Detailed financial projections and unit economics analysis.',
    kpis: 'LTV/CAC ratio: 10:1, Monthly recurring revenue: $208K, Runway: 18 months',
    red_flags: 'Burn rate increasing, need for additional funding',
    content: 'Financial model content would be here...',
    created_at: new Date().toISOString()
  },
  {
    startup_id: '2',
    name: 'GreenEnergy Market Analysis',
    type: 'pdf',
    summary: 'Market analysis for renewable energy management platform.',
    kpis: 'Market size: $15B, Growth rate: 18%, Target segments: Commercial, Industrial',
    red_flags: 'Regulatory dependency, technology risk',
    content: 'Market analysis content would be here...',
    created_at: new Date().toISOString()
  },
  {
    startup_id: '3',
    name: 'HealthTech Pro Pitch Deck',
    type: 'pdf',
    summary: 'Investor pitch deck for Series B funding round.',
    kpis: 'ARR: $12M, Customer count: 450, Revenue growth: 35%',
    red_flags: 'Regulatory compliance costs, provider network dependency',
    content: 'Pitch deck content would be here...',
    created_at: new Date().toISOString()
  },
  {
    startup_id: '4',
    name: 'FinFlow Product Roadmap',
    type: 'pdf',
    summary: 'Product development roadmap and feature prioritization.',
    kpis: 'Feature adoption rate: 75%, Customer satisfaction: 4.2/5, NPS: 45',
    red_flags: 'Feature complexity, integration challenges',
    content: 'Product roadmap content would be here...',
    created_at: new Date().toISOString()
  },
  {
    startup_id: '5',
    name: 'EduTech Innovations Research',
    type: 'pdf',
    summary: 'Research on personalized learning algorithms and AI implementation.',
    kpis: 'Learning effectiveness improvement: 40%, Student engagement: 85%, Retention: 90%',
    red_flags: 'AI model accuracy, content quality dependency',
    content: 'Research content would be here...',
    created_at: new Date().toISOString()
  }
];

// Seed the database
function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    db.prepare('DELETE FROM documents').run();
    db.prepare('DELETE FROM market_analysis').run();
    db.prepare('DELETE FROM metrics').run();
    db.prepare('DELETE FROM competitors').run();
    db.prepare('DELETE FROM startups').run();

    console.log('✅ Cleared existing data');

    // Insert startups
    console.log('📊 Inserting startups...');
    const insertStartup = db.prepare(`
      INSERT INTO startups (id, name, description, sector, stage, country, team_info, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    startups.forEach(startup => {
      insertStartup.run(
        startup.id,
        startup.name,
        startup.description,
        startup.sector,
        startup.stage,
        startup.country,
        startup.team_info,
        startup.memo
      );
    });

    console.log(`✅ Inserted ${startups.length} startups`);

    // Insert competitors
    console.log('🏆 Inserting competitors...');
    const insertCompetitor = db.prepare(`
      INSERT INTO competitors (
        startup_id, competitor_name, description, founded_year, employee_count,
        funding_raised, revenue, linkedin_url, website_url, main_features,
        similarity_score, is_external, research_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    competitors.forEach(competitor => {
      try {
        insertCompetitor.run(
          competitor.startup_id,
          competitor.competitor_name,
          competitor.description,
          competitor.founded_year,
          competitor.employee_count,
          competitor.funding_raised,
          competitor.revenue,
          competitor.linkedin_url,
          competitor.website_url,
          competitor.main_features,
          competitor.similarity_score,
          competitor.is_external ? 1 : 0, // Convert boolean to integer
          competitor.research_status
        );
      } catch (error) {
        console.error('Error inserting competitor:', competitor.competitor_name, error);
      }
    });

    console.log(`✅ Inserted ${competitors.length} competitors`);

    // Insert metrics
    console.log('📈 Inserting metrics...');
    const insertMetrics = db.prepare(`
      INSERT INTO metrics (
        startup_id, arr, mrr, cac, ltv, churn, runway, burn_rate, customer_count, revenue_growth
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    metrics.forEach(metric => {
      insertMetrics.run(
        metric.startup_id,
        metric.arr,
        metric.mrr,
        metric.cac,
        metric.ltv,
        metric.churn,
        metric.runway,
        metric.burn_rate,
        metric.customer_count,
        metric.revenue_growth
      );
    });

    console.log(`✅ Inserted ${metrics.length} metrics records`);

    // Insert market analysis
    console.log('📊 Inserting market analysis...');
    const insertMarketAnalysis = db.prepare(`
      INSERT INTO market_analysis (
        startup_id, research_report, research_status
      ) VALUES (?, ?, ?)
    `);

    marketAnalysis.forEach(analysis => {
      insertMarketAnalysis.run(
        analysis.startup_id,
        analysis.research_report || 'Market research report pending generation.',
        analysis.research_status || 'pending'
      );
    });

    console.log(`✅ Inserted ${marketAnalysis.length} market analysis records`);

    // Insert documents
    console.log('📄 Inserting documents...');
    const insertDocument = db.prepare(`
      INSERT INTO documents (
        startup_id, name, type, summary, kpis, red_flags, content, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    documents.forEach(document => {
      insertDocument.run(
        document.startup_id,
        document.name,
        document.type,
        document.summary,
        document.kpis,
        document.red_flags,
        document.content,
        document.created_at
      );
    });

    console.log(`✅ Inserted ${documents.length} documents`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${startups.length} startups`);
    console.log(`- ${competitors.length} competitors`);
    console.log(`- ${metrics.length} metrics records`);
    console.log(`- ${marketAnalysis.length} market analysis records`);
    console.log(`- ${documents.length} documents`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the seeding
seedDatabase(); 