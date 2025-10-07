# Entity Type Enums - Schema-Enforced Control

## Problem Solved

**Before:** Dynamic color generation with unpredictable entity types
- ❌ AI could return any entity type string
- ❌ Hard to control output consistency
- ❌ Difficult to predict colors
- ❌ No validation of entity types

**After:** Schema-enforced entity type enums per article type
- ✅ AI MUST use predefined entity types
- ✅ Zod schema validates at API level
- ✅ Predictable, consistent output
- ✅ Better color control

## Entity Type Enums

### General Article (7 types)
```typescript
const GENERAL_ENTITY_TYPES = [
  "Person",
  "Organization",
  "Location",
  "Technology",
  "Event",
  "Concept",
  "Date",
] as const;
```

**Use Cases:**
- News articles
- Security incidents
- Business intelligence
- General content

### Investment Article (11 types)
```typescript
const INVESTMENT_ENTITY_TYPES = [
  "Company",
  "Investor",
  "Person",
  "Fund",
  "Valuation",
  "Investment",
  "Round",
  "Sector",
  "Date",
  "Location",
  "Metric",
] as const;
```

**Use Cases:**
- Funding announcements
- M&A news
- Venture capital
- Private equity

### Revenue Analysis (14 types)
```typescript
const REVENUE_ENTITY_TYPES = [
  "REVENUE METRIC",
  "REVENUE STREAM",
  "Product",
  "Service",
  "Customer",
  "CUSTOMER SEGMENT",
  "Channel",
  "Market",
  "GEOGRAPHIC MARKET",
  "Organization",
  "DATE",
  "TIME PERIOD",
  "Concept",
  "Metric",
] as const;
```

**Use Cases:**
- Financial reports
- Earnings calls
- Revenue breakdowns
- Sales performance

## How It Works

### 1. Dynamic Schema Creation
```typescript
function createEntitySchema(entityTypes: readonly string[]) {
  return z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(entityTypes as [string, ...string[]]), // ✅ Enforced!
    description: z.string().optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    importance: z.enum(['high', 'medium', 'low']).optional(),
  });
}
```

### 2. Article Type Selection
```typescript
const typeConfig = getArticleTypeConfig(articleType);
// typeConfig.entityTypes contains the allowed types
```

### 3. Schema Enforcement
```typescript
const ExtractedDataSchema = createExtractedDataSchema(typeConfig.entityTypes);

// OpenAI MUST return entities with types from the enum
const completion = await openai.beta.chat.completions.parse({
  response_format: zodResponseFormat(ExtractedDataSchema, 'extracted_data'),
  // ...
});
```

### 4. Validation
```typescript
// ✅ Valid: Entity type in enum
{ type: "Person" } // Allowed for general article

// ❌ Invalid: Entity type not in enum
{ type: "Stakeholder" } // Rejected by schema!
```

## Benefits

### 🎯 **Controlled Output**
```typescript
// Before: AI could return anything
{ type: "Stakeholder" }
{ type: "Board Member" }
{ type: "Key Person" }
// Unpredictable!

// After: AI must use enum
{ type: "Person" }
{ type: "Person" }
{ type: "Person" }
// Consistent!
```

### 🛡️ **Schema Validation**
```typescript
// OpenAI API validates before returning
// Invalid types are rejected at API level
// No need for post-processing validation
```

### 🎨 **Predictable Colors**
```typescript
// With controlled entity types, colors are predictable
"Person" → Always green
"Company" → Always blue
"REVENUE METRIC" → Always green

// No more random hash-generated colors for unknown types
```

### 📊 **Better Analytics**
```typescript
// Can count entity types accurately
const personCount = entities.filter(e => e.type === "Person").length;

// Can group by type reliably
const byType = groupBy(entities, 'type');
```

## Updated System Prompts

### General Article
```
1. **Entities** - Use ONLY these entity types (enforced by schema):
   - **Person**: Individuals mentioned by name
   - **Organization**: Companies, institutions, departments
   - **Location**: Countries, cities, regions
   - **Technology**: Software, systems, platforms
   - **Event**: Breaches, announcements, incidents
   - **Concept**: Roles, positions, business functions
   - **Date**: When events occurred
   
   CRITICAL: Use ONLY the exact entity type names listed above. 
   The schema will reject other types.
```

### Investment Article
```
1. **Investment Entities** - Use ONLY these entity types (enforced by schema):
   - **Company**: Target companies, portfolio companies
   - **Investor**: VC firms, PE firms, angel investors
   - **Person**: CEOs, founders, investment partners
   - **Fund**: Investment funds, venture funds
   - **Valuation**: Pre-money, post-money valuations
   - **Investment**: Funding amounts, deal sizes
   - **Round**: Seed, Series A/B/C, IPO
   - **Sector**: Industry sectors, market segments
   - **Date**: Investment dates, announcement dates
   - **Location**: Geographic locations, headquarters
   - **Metric**: Revenue multiples, P/E ratios
   
   CRITICAL: Use ONLY the exact entity type names listed above.
   The schema will reject other types.
```

### Revenue Analysis
```
1. **Revenue Entities** - Use ONLY these entity types (enforced by schema):
   - **REVENUE METRIC**: Total Revenue, Net Revenue, ARR, MRR
   - **REVENUE STREAM**: Business segments, product lines
   - **Product**: Individual products
   - **Service**: Individual services
   - **Customer**: Specific customer names
   - **CUSTOMER SEGMENT**: Customer categories
   - **Channel**: Sales channels
   - **Market**: Geographic markets
   - **GEOGRAPHIC MARKET**: Geographic regions
   - **Organization**: The main company name
   - **DATE**: Specific dates
   - **TIME PERIOD**: Quarters, fiscal years
   - **Concept**: Revenue metrics, growth rates
   - **Metric**: Financial metrics and KPIs
   
   CRITICAL: Use ONLY the exact entity type names listed above.
   The schema will reject other types.
```

## Example Validation

### Valid Extraction ✅
```json
{
  "entities": [
    { "type": "Person", "name": "John Doe" },
    { "type": "Organization", "name": "Acme Corp" },
    { "type": "Location", "name": "San Francisco" }
  ]
}
```
✅ All types in GENERAL_ENTITY_TYPES enum → Accepted

### Invalid Extraction ❌
```json
{
  "entities": [
    { "type": "Stakeholder", "name": "John Doe" },
    { "type": "Company", "name": "Acme Corp" },
    { "type": "City", "name": "San Francisco" }
  ]
}
```
❌ Types not in enum → Rejected by Zod schema → OpenAI API error

## Color System Integration

With controlled entity types, the color system becomes more predictable:

### Before (Dynamic Generation)
```typescript
// Unknown types got random colors
"Stakeholder" → hash → color (unpredictable)
"Board Member" → hash → different color
"Key Person" → hash → another color
```

### After (Enum-Based)
```typescript
// All map to "Person" → consistent color
"Person" → green (from BASE_COLORS or hash)
"Person" → green (always same)
"Person" → green (predictable)
```

## Migration Impact

### Files Modified
- `/lib/article-types.ts` - Added entity type enums
- `/lib/openai.ts` - Dynamic schema creation

### Breaking Changes
- ✅ **None!** - External API unchanged
- ✅ **Backward compatible** - Existing code works

### New Capabilities
- ✅ Schema-enforced entity types
- ✅ Predictable output
- ✅ Better validation
- ✅ Type safety

## Testing

### Test Each Article Type
```typescript
// General article
const result = await extractEntitiesFromArticle(text, title, 'general');
// All entities should have types from GENERAL_ENTITY_TYPES

// Investment article
const result = await extractEntitiesFromArticle(text, title, 'investment');
// All entities should have types from INVESTMENT_ENTITY_TYPES

// Revenue analysis
const result = await extractEntitiesFromArticle(text, title, 'revenue-analysis');
// All entities should have types from REVENUE_ENTITY_TYPES
```

### Verify Validation
```typescript
// Try to extract with wrong entity type
// OpenAI API should reject and retry with correct types
```

## Future Enhancements

### 1. Add More Article Types
```typescript
export const SECURITY_ENTITY_TYPES = [
  "Attacker",
  "Victim",
  "Vulnerability",
  "Exploit",
  "System",
  // ...
] as const;
```

### 2. Relationship Type Enums
```typescript
export const GENERAL_RELATIONSHIP_TYPES = [
  "works-at",
  "leads",
  "member-of",
  // ...
] as const;
```

### 3. Dynamic Relationship Validation
```typescript
function createRelationshipSchema(relationshipTypes: readonly string[]) {
  return z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(relationshipTypes),
    // ...
  });
}
```

## Summary

### What We Achieved
1. ✅ **Schema-enforced entity types** per article type
2. ✅ **Predictable, controlled output** from AI
3. ✅ **Better validation** at API level
4. ✅ **Consistent colors** with known entity types
5. ✅ **Type safety** with TypeScript enums

### Result
A **robust, controlled extraction system** where entity types are:
- 🎯 **Predefined** - No surprises
- 🛡️ **Validated** - Schema enforced
- 🎨 **Predictable** - Consistent colors
- 📊 **Analyzable** - Easy to count/group
- 🚀 **Maintainable** - Clear structure

No more unpredictable entity types! 🎉
