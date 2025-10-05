# Entity Type Naming Standardization

## Problem Fixed

**Issue:** Revenue entity types had inconsistent naming formats:
- ❌ `"REVENUE METRIC"` - Uppercase with spaces
- ❌ `"CUSTOMER SEGMENT"` - Uppercase with spaces
- ❌ `"DATE"` - All uppercase
- ❌ `"TIME PERIOD"` - Uppercase with spaces
- ✅ `"Product"` - PascalCase (good!)
- ✅ `"Organization"` - PascalCase (good!)

This inconsistency made the code confusing and harder to maintain.

## Solution

Standardized ALL entity types to use **PascalCase** format for consistency.

## Naming Convention

### ✅ Standard: PascalCase
- Single words: `Person`, `Product`, `Service`
- Multiple words: `RevenueMetric`, `CustomerSegment`, `TimePeriod`
- No spaces, no underscores, no hyphens
- First letter of each word capitalized

### Examples
```typescript
// ✅ Correct
"Person"
"Organization"
"RevenueMetric"
"CustomerSegment"
"GeographicMarket"
"TimePeriod"

// ❌ Incorrect
"PERSON"
"REVENUE METRIC"
"CUSTOMER SEGMENT"
"TIME PERIOD"
"revenue_metric"
"customer-segment"
```

## Updated Entity Type Enums

### General Entity Types (No Changes)
```typescript
export const GENERAL_ENTITY_TYPES = [
  "Person",           // ✅ Already PascalCase
  "Organization",     // ✅ Already PascalCase
  "Location",         // ✅ Already PascalCase
  "Technology",       // ✅ Already PascalCase
  "Event",            // ✅ Already PascalCase
  "Concept",          // ✅ Already PascalCase
  "Date",             // ✅ Already PascalCase
] as const;
```

### Investment Entity Types (No Changes)
```typescript
export const INVESTMENT_ENTITY_TYPES = [
  "Company",          // ✅ Already PascalCase
  "Investor",         // ✅ Already PascalCase
  "Person",           // ✅ Already PascalCase
  "Fund",             // ✅ Already PascalCase
  "Valuation",        // ✅ Already PascalCase
  "Investment",       // ✅ Already PascalCase
  "Round",            // ✅ Already PascalCase
  "Sector",           // ✅ Already PascalCase
  "Date",             // ✅ Already PascalCase
  "Location",         // ✅ Already PascalCase
  "Metric",           // ✅ Already PascalCase
] as const;
```

### Revenue Entity Types (UPDATED)
```typescript
export const REVENUE_ENTITY_TYPES = [
  "RevenueMetric",      // ✅ Changed from "REVENUE METRIC"
  "RevenueStream",      // ✅ Changed from "REVENUE STREAM"
  "Product",            // ✅ Already PascalCase
  "Service",            // ✅ Already PascalCase
  "Customer",           // ✅ Already PascalCase
  "CustomerSegment",    // ✅ Changed from "CUSTOMER SEGMENT"
  "Channel",            // ✅ Already PascalCase
  "Market",             // ✅ Already PascalCase
  "GeographicMarket",   // ✅ Changed from "GEOGRAPHIC MARKET"
  "Organization",       // ✅ Already PascalCase
  "Date",               // ✅ Changed from "DATE"
  "TimePeriod",         // ✅ Changed from "TIME PERIOD"
  "Concept",            // ✅ Already PascalCase
  "Metric",             // ✅ Already PascalCase
] as const;
```

## Updated Color Mappings

### Before
```typescript
const BASE_COLORS = {
  "REVENUE METRIC": "#10b981",
  "REVENUE STREAM": "#14b8a6",
  "CUSTOMER SEGMENT": "#a855f7",
  "GEOGRAPHIC MARKET": "#f97316",
  "TIME PERIOD": "#6366f1",
};
```

### After
```typescript
const BASE_COLORS = {
  RevenueMetric: "#10b981",      // ✅ PascalCase
  RevenueStream: "#14b8a6",      // ✅ PascalCase
  CustomerSegment: "#a855f7",    // ✅ PascalCase
  GeographicMarket: "#f97316",   // ✅ PascalCase
  TimePeriod: "#6366f1",         // ✅ PascalCase
};
```

## Updated System Prompt

### Before
```
- **REVENUE METRIC**: Total Revenue, Net Revenue, ARR, MRR
- **REVENUE STREAM**: Business segments, product lines
- **CUSTOMER SEGMENT**: Customer categories, market segments
- **GEOGRAPHIC MARKET**: Geographic regions, country markets
- **TIME PERIOD**: Quarters, fiscal years, months
```

### After
```
- **RevenueMetric**: Total Revenue, Net Revenue, ARR, MRR
- **RevenueStream**: Business segments, product lines
- **CustomerSegment**: Customer categories, market segments
- **GeographicMarket**: Geographic regions, country markets
- **TimePeriod**: Quarters, fiscal years, months

CRITICAL: Use ONLY the exact entity type names listed above (PascalCase).
```

## Benefits

### 🎯 **Consistency**
- All entity types follow the same naming convention
- Easy to remember and use
- Professional code style

### 📝 **Readability**
```typescript
// ✅ Clear and consistent
RevenueMetric
CustomerSegment
TimePeriod

// ❌ Confusing mix
"REVENUE METRIC"
"Customer"
"TIME PERIOD"
```

### 🔧 **Maintainability**
- Easier to search and replace
- Less prone to typos
- Clear pattern to follow

### 💻 **Developer Experience**
```typescript
// ✅ Autocomplete works better
entity.type === "RevenueMetric"

// ❌ Need to remember exact spacing
entity.type === "REVENUE METRIC"
```

### 🎨 **Color Mapping**
```typescript
// ✅ Clean object keys
BASE_COLORS.RevenueMetric
BASE_COLORS.CustomerSegment

// ❌ Need quotes for spaces
BASE_COLORS["REVENUE METRIC"]
BASE_COLORS["CUSTOMER SEGMENT"]
```

## Migration Impact

### Files Modified
1. `/lib/article-types.ts` - Updated REVENUE_ENTITY_TYPES enum
2. `/lib/visualization-config.ts` - Updated BASE_COLORS keys
3. `/lib/article-types.ts` - Updated system prompt

### Breaking Changes
- ⚠️ **Existing revenue articles** will need to be regenerated
- Old entity types like "REVENUE METRIC" won't match new schema
- Schema validation will reject old format

### Migration Steps
1. ✅ Update entity type enums
2. ✅ Update color mappings
3. ✅ Update system prompts
4. ⚠️ Regenerate existing revenue analysis articles

## Validation

### Schema Enforcement
```typescript
// ✅ Valid - matches enum
{ type: "RevenueMetric" }

// ❌ Invalid - old format rejected
{ type: "REVENUE METRIC" }
```

### Color Lookup
```typescript
// ✅ Works - exact match
BASE_COLORS["RevenueMetric"] → "#10b981"

// ✅ Works - normalization
"revenuemetric" → normalize → "RevenueMetric" → "#10b981"

// ❌ Fails - old format not in BASE_COLORS
BASE_COLORS["REVENUE METRIC"] → undefined
```

## Naming Rules

### For Future Entity Types

1. **Single Word**: Capitalize first letter
   ```typescript
   "Product"
   "Service"
   "Channel"
   ```

2. **Multiple Words**: PascalCase (no spaces)
   ```typescript
   "RevenueMetric"    // Not "REVENUE METRIC"
   "CustomerSegment"  // Not "CUSTOMER SEGMENT"
   "TimePeriod"       // Not "TIME PERIOD"
   ```

3. **Abbreviations**: Treat as single word
   ```typescript
   "Roi"    // Not "ROI"
   "Arr"    // Not "ARR"
   "Kpi"    // Not "KPI"
   ```

4. **Geographic Terms**: PascalCase
   ```typescript
   "GeographicMarket"  // Not "GEOGRAPHIC MARKET"
   "CountryRegion"     // Not "COUNTRY REGION"
   ```

## Summary

### What Changed
- ✅ Standardized all entity types to PascalCase
- ✅ Updated 5 revenue entity types
- ✅ Updated color mappings
- ✅ Updated system prompts

### Result
- 🎯 **100% consistent** naming across all entity types
- 📝 **Clear convention** for future additions
- 🔧 **Easier maintenance** with uniform format
- 💻 **Better DX** with cleaner code

All entity types now follow the **PascalCase** convention! 🎉
