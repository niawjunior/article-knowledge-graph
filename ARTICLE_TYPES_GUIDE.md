# Article Types Feature Guide

## Overview
The application now supports **7 specialized article types**, each with tailored system prompts for optimal entity extraction and relationship mapping.

## Available Article Types

### 1. **General Article** (Default)
- **Use for**: General news, business intelligence, any other content
- **Extracts**: Organizations, people, technology, events, concepts, locations, dates
- **Best for**: Mixed content, general news articles, blog posts

### 2. **Financial Statement** ⭐ Recommended for NVIDIA Example
- **Use for**: Income statements, balance sheets, quarterly/annual reports
- **Extracts**:
  - Financial metrics (Revenue, Gross Profit, Operating Profit, Net Profit, EBITDA, EPS)
  - Business segments (Data Center, Gaming, Professional Visualization, Automotive)
  - Cost centers (Cost of Revenue, R&D, SG&A, Operating Expenses, Taxes)
  - Financial periods (Q3 FY25, Year-over-Year, Quarter-over-Quarter)
  - Margins and growth rates
- **Relationships**: 
  - `generates-revenue`, `contributes-to`, `deducts-from`, `results-in`, `grows-by`, `has-margin`
- **Special features**: 
  - Extracts complete financial flow: Revenue → Costs → Gross Profit → Operating Expenses → Operating Profit → Taxes → Net Profit
  - Captures all percentage changes and growth metrics
  - Links metrics to time periods

### 3. **Investment Analysis**
- **Use for**: Investment opportunities, funding rounds, M&A, valuations
- **Extracts**: Companies, investors, investment rounds, valuations, investment amounts, sectors
- **Relationships**: `invests-in`, `raises-funding`, `leads-round`, `valued-at`, `acquires`, `owns-stake`

### 4. **Revenue Analysis**
- **Use for**: Revenue breakdowns, sales performance, customer segments
- **Extracts**: Revenue streams, customer segments, sales channels, revenue metrics, growth metrics
- **Relationships**: `generates-revenue`, `sells-through`, `targets-segment`, `serves-customers`, `has-ARPU`

### 5. **Organizational Chart**
- **Use for**: Company structure, departments, teams, reporting lines
- **Extracts**: ALL people, divisions, departments, teams, sub-teams, roles
- **Relationships**: `part-of`, `works-at`, `leads`, `reports-to`, `manages`, `member-of`
- **Special features**: Extracts complete organizational hierarchy

### 6. **Security Incident**
- **Use for**: Cybersecurity breaches, attacks, vulnerabilities
- **Extracts**: Victims, attackers, attack vectors, vulnerabilities, affected systems, compromised data
- **Relationships**: `attacked-by`, `exploits`, `uses-method`, `compromises`, `leaked-from`, `detected-by`

### 7. **Market Analysis**
- **Use for**: Market trends, competitive analysis, industry reports
- **Extracts**: Companies, products, market segments, market metrics, trends, competitors
- **Relationships**: `competes-with`, `leads-market`, `has-market-share`, `operates-in`, `disrupts`, `partners-with`

## How to Use

### In the UI:
1. Navigate to the home page
2. Select the appropriate **Article Type** from the dropdown (first field)
3. The description will update to show what the type is best for
4. Enter your article title (optional) and content
5. Click "Generate Knowledge Graph"

### For Your NVIDIA Example:
**Select**: "Financial Statement"

This will extract:
- ✅ All revenue figures ($35.1B total, $30.8B Data Center, $3.3B Gaming, etc.)
- ✅ All business segments and their growth rates
- ✅ Cost structure (Cost of Revenue $8.9B, R&D $3.4B, SG&A $0.9B)
- ✅ Profit metrics (Gross Profit $26.2B, Operating Profit $21.9B, Net Profit $19.3B)
- ✅ All margins (75% gross margin, 62% operating margin, 55% net margin)
- ✅ Growth rates (Q/Q percentages)
- ✅ Relationships showing the financial flow

## Technical Implementation

### Files Modified:
1. **`lib/article-types.ts`** (NEW)
   - Defines all article types and their system prompts
   - Exports `ArticleType` type and `ARTICLE_TYPES` array
   - Provides `getArticleTypeConfig()` helper function

2. **`components/ArticleInput.tsx`**
   - Added article type dropdown as first field
   - Shows dynamic description based on selected type
   - Sends `articleType` to API

3. **`app/api/articles/route.ts`**
   - Accepts `articleType` parameter
   - Passes it to OpenAI extraction function

4. **`lib/openai.ts`**
   - Updated `extractEntitiesFromArticle()` to accept `articleType` parameter
   - Uses type-specific system prompts via `getArticleTypeConfig()`
   - Maintains backward compatibility with default 'general' type

## System Prompt Architecture

Each article type has a specialized system prompt that:
1. **Defines specific entity types** to extract (e.g., "Financial Metrics" for financial statements)
2. **Specifies relationship types** appropriate for that domain (e.g., "generates-revenue" for financial data)
3. **Provides extraction rules** tailored to the content type
4. **Sets metadata guidelines** for sentiment and importance

## Example: Financial Statement Prompt

The Financial Statement type will:
- Extract EVERY financial metric with exact values
- Extract ALL business segments with individual performance
- Create relationships showing financial flow
- Connect metrics to time periods
- Show growth comparisons (Q/Q, Y/Y)
- Extract margin percentages
- Mark positive/negative sentiment based on growth/decline

## Testing Your NVIDIA Example

Try pasting your NVIDIA Q3 FY25 content with:
- **Article Type**: Financial Statement
- **Article Title**: NVIDIA Q3 FY25 Financial Overview
- **Article Content**: [Your financial data]

Expected results:
- 30-50+ entities (all metrics, segments, periods, costs)
- 50-100+ relationships showing financial flows
- Proper sentiment (positive for growth, neutral for stable metrics)
- Complete financial hierarchy visualization

## Benefits

✅ **More accurate extraction** - Specialized prompts understand domain-specific terminology
✅ **Better relationships** - Domain-appropriate relationship types (e.g., "generates-revenue" vs generic "related-to")
✅ **Complete data capture** - Type-specific rules ensure nothing is missed
✅ **Improved graph quality** - More meaningful and queryable knowledge graphs
✅ **Better Q&A** - AI can answer domain-specific questions with complete context

## Future Enhancements

Potential additions:
- Custom article types (user-defined)
- Article type auto-detection
- Type-specific visualization layouts
- Domain-specific query templates
