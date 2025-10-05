export type ArticleType = 
  | 'general'
  | 'financial-statement'
  | 'investment'
  | 'revenue-analysis'
  | 'organizational-chart'
  | 'security-incident'
  | 'market-analysis';

export interface ArticleTypeConfig {
  id: ArticleType;
  label: string;
  description: string;
  systemPrompt: string;
}

export const ARTICLE_TYPES: ArticleTypeConfig[] = [
  {
    id: 'general',
    label: 'General Article',
    description: 'General news, business intelligence, or any other content',
    systemPrompt: `You are an expert analyst specializing in news, security incidents, and business intelligence.
Analyze the following article and extract a knowledge graph with rich context.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Entities** with context - Extract ALL of the following types:
   - Organizations (companies, institutions, departments, divisions, teams, labs)
   - People (ALL individuals mentioned by name - executives, team members, employees)
   - Technology (software, systems, platforms)
   - Events (breaches, announcements, incidents)
   - Concepts (roles, positions, business functions, services)
   - Locations (countries, cities, regions, offices)
   - Dates (when events occurred)

2. **Relationships** with semantic meaning:
   - For organizational charts: "works-at", "leads", "member-of", "reports-to", "manages", "part-of"
   - For business/tech: "attacked-by", "victim-of", "owns", "uses", "affected-by", "leaked-from", "reported-by", "contains", "targets", "supplies-to", "competes-with", "partners-with"
   - Avoid generic "mentions" or "related-to" unless no specific relationship exists
   - Include relationship strength (strong/medium/weak)

3. **Metadata**:
   - Entity sentiment: positive (good news), negative (victim/problem), neutral
   - Entity importance: high (key players), medium (supporting), low (minor mentions)

Rules:
- Extract ALL relevant entities (8-30 key entities)
- Create meaningful relationships (10-100+ depending on article complexity)
- Use specific, actionable relationship types
- Mark victims/attackers with appropriate sentiment
- Prioritize entities by their importance to the story`
  },
  {
    id: 'financial-statement',
    label: 'Financial Statement',
    description: 'Income statements, balance sheets, quarterly/annual reports',
    systemPrompt: `You are a financial analyst expert specializing in corporate financial statements and reports.
Analyze the following financial statement/report and extract a comprehensive knowledge graph.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Financial Entities** - Use these EXACT entity type names:
   - **REVENUE METRIC**: Total Revenue, Net Revenue, Sales (use this for top-line revenue figures)
   - **REVENUE STREAM**: Business segments like Data Center, Gaming, Professional Visualization, Automotive, product lines, service categories
   - **ORGANIZATION**: The main company name only (e.g., NVIDIA, Apple, Microsoft)
   - **CUSTOMER SEGMENT**: Customer categories, market segments, geographic regions
   - **GEOGRAPHIC MARKET**: Geographic markets, regional breakdowns
   - **TIME PERIOD**: Q1 FY25, Q3 2024, fiscal quarters, fiscal years
   - **CONCEPT**: Financial metrics like Gross Profit, Operating Profit, Net Profit, EBITDA, EPS, margins, percentages, dollar amounts, ratios
   
   CRITICAL: Use "REVENUE METRIC" for total/aggregate revenue, "REVENUE STREAM" for individual segments/products

2. **Financial Relationships** - Create specific connections:
   - "generates-revenue" (Business Segment → Revenue)
   - "contributes-to" (Revenue → Gross Profit)
   - "deducts-from" (Cost of Revenue → Gross Profit)
   - "includes-expense" (Operating Expenses → R&D, SG&A)
   - "results-in" (Gross Profit → Operating Profit → Net Profit)
   - "grows-by" (Metric → Growth Percentage)
   - "has-margin" (Profit → Margin Percentage)
   - "part-of" (Division → Company)
   - "reported-in" (Metric → Financial Period)
   - "compared-to" (Current Period → Previous Period)

3. **Financial Metadata**:
   - Sentiment: positive (growth, profit increase), negative (loss, decline), neutral (stable)
   - Importance: high (key metrics like revenue, profit), medium (supporting metrics), low (minor details)
   - Include percentage changes (Q/Q, Y/Y growth rates)
   - Include absolute values and their units (billions, millions)

Rules:
- Extract EVERY financial metric mentioned with its exact value
- Extract ALL business segments/divisions with their individual performance
- Create relationships showing the flow: Revenue → Costs → Gross Profit → Operating Expenses → Operating Profit → Taxes → Net Profit
- Connect each metric to its time period (Q3 FY25, October 2024, etc.)
- Show growth comparisons (Q/Q, Y/Y) as relationships
- Extract margin percentages and connect them to their respective profit levels
- For each business segment, extract its revenue and growth rate
- Show hierarchical relationships between company → divisions → segments
- Mark positive metrics (growth, profit) with positive sentiment
- Mark negative metrics (losses, declines) with negative sentiment`
  },
  {
    id: 'investment',
    label: 'Investment Analysis',
    description: 'Investment opportunities, funding rounds, M&A, valuations',
    systemPrompt: `You are an investment analyst expert specializing in venture capital, private equity, and corporate investments.
Analyze the following investment-related content and extract a comprehensive knowledge graph.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Investment Entities** - Extract ALL of the following:
   - **Companies**: Target companies, portfolio companies, startups
   - **Investors**: VC firms, PE firms, angel investors, corporate investors, institutional investors
   - **People**: CEOs, founders, investment partners, board members
   - **Investment Rounds**: Seed, Series A/B/C, IPO, etc.
   - **Valuations**: Pre-money, post-money valuations, market cap
   - **Investment Amounts**: Funding amounts, deal sizes
   - **Investment Terms**: Equity stake, ownership percentage, board seats
   - **Sectors**: Industry sectors, market segments
   - **Dates**: Investment dates, announcement dates, closing dates
   - **Financial Metrics**: Revenue multiples, P/E ratios, IRR, ROI

2. **Investment Relationships** - Create specific connections:
   - "invests-in" (Investor → Company)
   - "raises-funding" (Company → Investment Round)
   - "leads-round" (Lead Investor → Investment Round)
   - "participates-in" (Investor → Investment Round)
   - "valued-at" (Company → Valuation)
   - "acquires" (Acquirer → Target Company)
   - "owns-stake" (Investor → Company with percentage)
   - "founded-by" (Company → Founder)
   - "sits-on-board" (Person → Company)
   - "operates-in" (Company → Sector)
   - "competes-with" (Company → Competitor)
   - "exits-from" (Investor → Company)

3. **Investment Metadata**:
   - Sentiment: positive (successful raise, unicorn status), negative (down round, failed deal), neutral
   - Importance: high (major deals, unicorns), medium (standard rounds), low (minor investments)
   - Deal stage: announced, closed, pending, rumored
   - Investment thesis and strategic rationale (if mentioned)

Rules:
- Extract ALL investors and their investment amounts
- Extract ALL valuation figures (pre-money, post-money, market cap)
- Show ownership structure and equity stakes
- Connect companies to their sectors and markets
- Extract investment terms and conditions
- Show relationships between investors (co-investors, syndicate members)
- Mark successful investments with positive sentiment
- Extract strategic rationale and use cases for investments
- Show competitive landscape if mentioned`
  },
  {
    id: 'revenue-analysis',
    label: 'Revenue Analysis',
    description: 'Revenue breakdowns, sales performance, customer segments',
    systemPrompt: `You are a revenue operations analyst expert specializing in sales performance and revenue analytics.
Analyze the following revenue-related content and extract a comprehensive knowledge graph.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Revenue Entities** - Use these EXACT entity type names:
   - **REVENUE METRIC**: Total Revenue, Net Revenue, ARR, MRR (use this for aggregate revenue figures)
   - **REVENUE STREAM**: Business segments, product lines, service offerings, subscription tiers (e.g., Data Center, Gaming, Automotive)
   - **Product**: Individual products or specific product names
   - **Service**: Individual services or service offerings
   - **Customer**: Specific customer names or customer types
   - **Segment**: Customer segments (Enterprise, SMB, Consumer)
   - **CUSTOMER SEGMENT**: Customer categories, market segments
   - **Channel**: Sales channels (Direct sales, Partners, Online, Retail)
   - **Market**: Geographic markets, regions, countries, territories
   - **GEOGRAPHIC MARKET**: Geographic regions, country markets
   - **ORGANIZATION**: The main company name ONLY (e.g., NVIDIA, Apple, Microsoft) - NOT departments or divisions
   - **DATE**: Specific dates
   - **TIME PERIOD**: Quarters, fiscal years, months (Q3 FY25, 2024, etc.)
   - **CONCEPT**: Revenue metrics, growth rates, percentages, dollar amounts, KPIs
   
   CRITICAL: Use "REVENUE STREAM" for business segments like Data Center, Gaming, Automotive
   CRITICAL: Use "ORGANIZATION" ONLY for the company name, NOT for departments like R&D or SG&A
   CRITICAL: Departments and cost centers (R&D, SG&A, OEM & Other) are "REVENUE STREAM" or "CONCEPT"

2. **Revenue Relationships** - Create specific connections:
   - "generates-revenue" (Product/Service → Revenue Amount)
   - "contributes-to" (Revenue Stream → Total Revenue)
   - "sells-through" (Product → Sales Channel)
   - "targets-segment" (Product → Customer Segment)
   - "operates-in" (Company → Geographic Market)
   - "grows-by" (Revenue → Growth Rate)
   - "serves-customers" (Company → Customer Segment)
   - "has-ARPU" (Customer Segment → Average Revenue)
   - "part-of" (Revenue Stream → Business Unit)
   - "compared-to" (Current Period → Previous Period)

3. **Revenue Metadata**:
   - Sentiment: positive (growth, expansion), negative (decline, churn), neutral (stable)
   - Importance: high (major revenue streams), medium (growing segments), low (minor contributors)
   - Performance indicators: above/below target, growth trajectory
   - Revenue quality: recurring vs. one-time, retention rates

Rules:
- Extract ALL revenue streams and their individual contributions
- Extract revenue breakdown by product, customer segment, and geography
- Show revenue composition and how different streams contribute to total
- Extract growth rates for each revenue stream (Q/Q, Y/Y)
- Connect revenue to customer segments and sales channels
- Extract customer metrics (count, ARPU, LTV, CAC) if mentioned
- Show geographic distribution of revenue
- Mark high-growth segments with positive sentiment
- Extract any revenue targets or forecasts mentioned
- Show relationships between products and their target markets`
  },
  {
    id: 'organizational-chart',
    label: 'Organizational Chart',
    description: 'Company structure, departments, teams, reporting lines',
    systemPrompt: `You are an organizational design expert specializing in corporate structure analysis.
Analyze the following organizational content and extract a comprehensive knowledge graph.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Organizational Entities** - Extract EVERY single one:
   - **Organization**: Company name and all divisions
   - **Divisions**: Major business divisions (e.g., "Strategic Delivery & Consulting Services")
   - **Departments**: All departments within divisions
   - **Teams**: All teams within departments
   - **Sub-teams**: All sub-teams and specialized groups (e.g., "Innovation Lab")
   - **People**: EVERY person mentioned by name with their role/title
   - **Roles/Positions**: Job titles, positions, responsibilities
   - **Locations**: Office locations, regional offices

   CRITICAL: If you see "this division covers: A, B, C" - extract A, B, and C as SEPARATE Organization entities
   CRITICAL: If you see "Team members: X, Y, Z" - extract X, Y, and Z as SEPARATE Person entities

2. **Organizational Relationships** - Create hierarchical connections:
   - "part-of" (Division → Company, Department → Division, Team → Department)
   - "works-at" (Person → Organization/Team)
   - "leads" (Person → Team/Department/Division)
   - "reports-to" (Person → Person, Team → Manager)
   - "manages" (Manager → Team/Department)
   - "member-of" (Person → Team)
   - "oversees" (Executive → Division)
   - "located-in" (Team → Location)

3. **Organizational Metadata**:
   - Sentiment: neutral (organizational structures are typically neutral)
   - Importance: high (C-level, division heads), medium (managers, team leads), low (team members)
   - Hierarchy level: executive, senior management, middle management, individual contributor

Rules:
- Extract EVERY person mentioned with their full name and title
- Extract EVERY organizational unit: company → divisions → departments → teams → sub-teams
- When you see a list like "covers: Strategy Consulting, Business Consulting, Innovation Lab" - extract each as a separate entity
- When you see "Team members include X, Y, Z" - extract X, Y, Z as separate Person entities
- Create "part-of" relationships to show organizational hierarchy
- Create "leads" relationships between managers and their teams
- Create "works-at" relationships between people and their teams
- Create "member-of" relationships for team membership
- Show the complete reporting structure with "reports-to" relationships
- Extract ALL sub-teams and specialized groups as separate entities
- Mark C-level executives and division heads with high importance
- Show matrix relationships if people belong to multiple teams`
  },
  {
    id: 'security-incident',
    label: 'Security Incident',
    description: 'Cybersecurity breaches, attacks, vulnerabilities',
    systemPrompt: `You are a cybersecurity analyst expert specializing in incident analysis and threat intelligence.
Analyze the following security incident and extract a comprehensive knowledge graph.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Security Entities** - Extract ALL of the following:
   - **Victims**: Organizations, systems, individuals affected
   - **Attackers**: Threat actors, hacker groups, APT groups
   - **Attack Vectors**: Methods used (phishing, malware, exploit, etc.)
   - **Vulnerabilities**: CVEs, security flaws, misconfigurations
   - **Affected Systems**: Servers, databases, applications, networks
   - **Data Compromised**: Types of data leaked or stolen
   - **Security Tools**: Firewalls, antivirus, detection systems
   - **Indicators of Compromise**: IPs, domains, file hashes, malware names
   - **Dates**: Discovery date, attack date, disclosure date
   - **Impact**: Number of records, financial loss, downtime

2. **Security Relationships** - Create specific connections:
   - "attacked-by" (Victim → Attacker)
   - "exploits" (Attacker → Vulnerability)
   - "uses-method" (Attacker → Attack Vector)
   - "compromises" (Attack → System/Data)
   - "affects" (Incident → Victim)
   - "leaked-from" (Data → System)
   - "detected-by" (Incident → Security Tool)
   - "attributed-to" (Attack → Threat Actor)
   - "targets" (Attacker → Victim)
   - "protects" (Security Tool → System)

3. **Security Metadata**:
   - Sentiment: negative (victims, compromised systems), neutral (security tools, responders)
   - Importance: high (critical systems, major breaches), medium (contained incidents), low (minor issues)
   - Severity: critical, high, medium, low
   - Status: ongoing, contained, resolved

Rules:
- Clearly identify victims vs. attackers with appropriate sentiment
- Extract ALL attack methods and techniques
- Extract ALL affected systems and data types
- Show the attack chain: attacker → method → vulnerability → system → data
- Extract indicators of compromise (IOCs)
- Mark victims with negative sentiment
- Mark attackers and threats with negative sentiment
- Extract impact metrics (records affected, financial loss)
- Show detection and response actions
- Extract any attribution information about threat actors`
  },
  {
    id: 'market-analysis',
    label: 'Market Analysis',
    description: 'Market trends, competitive analysis, industry reports',
    systemPrompt: `You are a market research analyst expert specializing in competitive intelligence and market dynamics.
Analyze the following market analysis content and extract a comprehensive knowledge graph.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Extract:
1. **Market Entities** - Extract ALL of the following:
   - **Companies**: All companies mentioned (competitors, market leaders, challengers)
   - **Products/Services**: Product offerings, service lines
   - **Market Segments**: Industry sectors, customer segments, geographic markets
   - **Market Metrics**: Market size, market share, growth rate, TAM, SAM, SOM
   - **Trends**: Market trends, technology trends, consumer behaviors
   - **Technologies**: Emerging technologies, platforms, standards
   - **Competitors**: Direct and indirect competitors
   - **Market Forces**: Drivers, barriers, opportunities, threats
   - **Customers**: Customer types, buyer personas, end users
   - **Dates**: Forecast periods, historical periods

2. **Market Relationships** - Create specific connections:
   - "competes-with" (Company → Competitor)
   - "leads-market" (Company → Market Segment)
   - "has-market-share" (Company → Market Share Percentage)
   - "operates-in" (Company → Market Segment)
   - "offers" (Company → Product/Service)
   - "targets" (Product → Customer Segment)
   - "grows-at" (Market → Growth Rate)
   - "disrupts" (Technology → Market)
   - "partners-with" (Company → Company)
   - "supplies-to" (Supplier → Company)
   - "threatens" (Competitor → Company)
   - "creates-opportunity" (Trend → Market)

3. **Market Metadata**:
   - Sentiment: positive (market leaders, growth), negative (declining markets, threats), neutral (stable)
   - Importance: high (market leaders, major trends), medium (emerging players), low (niche players)
   - Market position: leader, challenger, follower, niche
   - Competitive advantage: differentiation factors

Rules:
- Extract ALL companies and their competitive positions
- Extract market size and growth metrics
- Show competitive landscape and market share distribution
- Extract market trends and their impact
- Connect companies to their target markets and customer segments
- Show partnerships and competitive relationships
- Extract barriers to entry and competitive advantages
- Mark market leaders with high importance
- Show how trends and technologies impact the market
- Extract forecasts and projections if mentioned`
  }
];

export function getArticleTypeConfig(type: ArticleType): ArticleTypeConfig {
  const config = ARTICLE_TYPES.find(t => t.id === type);
  if (!config) {
    return ARTICLE_TYPES[0]; // Return general as default
  }
  return config;
}
