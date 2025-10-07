# Revenue Analysis Visualization Layout

## Problem

The revenue analysis graph was showing all entities in a single vertical column, making it impossible to see the hierarchical structure:

```
❌ Before:
Article → Everything in one column
- All entities at same level
- No clear hierarchy
- Hard to understand revenue breakdown
```

## Solution

Added **column ordering** and **priority types** to create a proper hierarchical left-to-right layout.

## Column Structure

### Horizontal Flow (Left to Right)

```
Column 1: ARTICLE
    ↓
Column 2: Organization (NVIDIA)
    ↓
Column 3: TimePeriod (Q3 FY25) / Date (October 2024)
    ↓
Column 4: RevenueMetric ($35.1B, $30.8B, etc.)
    ↓
Column 5: RevenueStream (Data Center, Gaming, etc.)
    ↓
Column 6: Product / Service (R&D, SG&A)
    ↓
Column 7: CustomerSegment / GeographicMarket / Channel
    ↓
Column 8: Concept / Metric (margins, growth rates)
```

## Configuration

### Column Order
```typescript
columnOrder: {
  ARTICLE: 1,           // Start: Article node
  Organization: 2,      // Company (NVIDIA)
  TimePeriod: 3,        // Q3 FY25
  Date: 3,              // October 2024 (same level as TimePeriod)
  RevenueMetric: 4,     // $35.1B, $30.8B, etc.
  RevenueStream: 5,     // Data Center, Gaming, etc.
  Product: 6,           // Individual products
  Service: 6,           // R&D, SG&A (same level as Product)
  CustomerSegment: 7,   // Enterprise, SMB, etc.
  GeographicMarket: 7,  // Regions (same level)
  Channel: 7,           // Sales channels (same level)
  Market: 7,            // Markets (same level)
  Concept: 8,           // End: Margins, growth rates
  Metric: 8,            // KPIs (same level as Concept)
}
```

### Priority Types
```typescript
priorityTypes: [
  "Organization",       // Highest priority
  "RevenueMetric",      // Main revenue figures
  "RevenueStream",      // Business segments
  "Product",
  "Service",
  "CustomerSegment",
  "GeographicMarket",
  "TimePeriod",
  "Date",
  "Concept",            // Lowest priority
]
```

### Spacing
```typescript
spacing: {
  nodeHorizontal: 300,  // Space between columns
  nodeVertical: 120,    // Space between nodes in same column
  sectionGap: 100,      // Gap between sections
  articleGap: 250,      // Extra space after article node
}
```

## Example Layout

### NVIDIA Q3 FY25 Revenue

```
┌─────────┐
│ ARTICLE │
│ NVIDIA  │
│ Q3 FY25 │
└────┬────┘
     │
     ├──────────────────────────────────────────────────────────┐
     │                                                          │
     ▼                                                          ▼
┌──────────┐                                              ┌──────────┐
│   ORG    │                                              │   TIME   │
│  NVIDIA  │                                              │ Q3 FY25  │
└────┬─────┘                                              │ Oct 2024 │
     │                                                    └────┬─────┘
     │                                                         │
     ▼                                                         │
┌─────────────┐                                               │
│   REVENUE   │◄──────────────────────────────────────────────┘
│  $35.1B     │
│  Total      │
└──────┬──────┘
       │
       ├────────────────┬────────────────┬────────────────┐
       │                │                │                │
       ▼                ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  STREAM  │    │  STREAM  │    │  STREAM  │    │  STREAM  │
│   Data   │    │  Gaming  │    │   Pro    │    │   Auto   │
│  Center  │    │  $3.3B   │    │   Viz    │    │  $0.4B   │
│  $30.8B  │    │          │    │  $0.5B   │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ CONCEPT  │    │ CONCEPT  │    │ CONCEPT  │    │ CONCEPT  │
│ +17% Q/Q │    │ +14% Q/Q │    │  +7% Q/Q │    │ +30% Q/Q │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## Visual Hierarchy

### Level 1: Article (Column 1)
- Starting point
- Article title and summary

### Level 2: Organization (Column 2)
- Company name (NVIDIA)
- Main entity being analyzed

### Level 3: Time Context (Column 3)
- TimePeriod: Q3 FY25
- Date: October 2024
- When the data is from

### Level 4: Total Revenue (Column 4)
- RevenueMetric: $35.1 billion
- Top-level revenue figure
- Gross profit, net profit

### Level 5: Revenue Breakdown (Column 5)
- RevenueStream: Data Center, Gaming, etc.
- How revenue is segmented
- Business divisions

### Level 6: Products/Services (Column 6)
- Product: Specific products
- Service: R&D, SG&A
- What generates the revenue

### Level 7: Markets/Segments (Column 7)
- CustomerSegment: Enterprise, SMB
- GeographicMarket: Regions
- Channel: Sales channels
- Who buys and where

### Level 8: Metrics/Concepts (Column 8)
- Concept: Growth rates, margins
- Metric: KPIs, percentages
- Performance indicators

## Benefits

### 📊 **Clear Hierarchy**
```
Before: Everything in one column
After: 8 distinct levels showing flow
```

### 🎯 **Logical Flow**
```
Company → Time → Total Revenue → Segments → Products → Markets → Metrics
```

### 👁️ **Easy to Read**
- Left-to-right progression
- Natural reading order
- Clear parent-child relationships

### 🔍 **Better Analysis**
- See revenue composition at a glance
- Understand segment contributions
- Track metrics per segment

## Example Queries

### "What are NVIDIA's revenue streams?"
```
Follow: Article → Organization → RevenueMetric → RevenueStream
See: Data Center ($30.8B), Gaming ($3.3B), etc.
```

### "How much did Data Center grow?"
```
Follow: RevenueStream (Data Center) → Concept (+17% Q/Q)
See: 17% quarter-over-quarter growth
```

### "What's the revenue breakdown by time?"
```
Follow: TimePeriod (Q3 FY25) → RevenueMetric → RevenueStream
See: All segments for Q3 FY25
```

## Spacing Explanation

### nodeHorizontal: 300px
- Space between columns
- Prevents overlap
- Allows room for labels

### nodeVertical: 120px
- Space between nodes in same column
- Prevents vertical crowding
- Readable even with many nodes

### sectionGap: 100px
- Gap between different sections
- Visual separation
- Groups related items

### articleGap: 250px
- Extra space after article node
- Emphasizes starting point
- Clear entry to the graph

## Priority Types Explanation

Priority determines which nodes appear first when there are multiple types:

```typescript
1. Organization    // Most important - the company
2. RevenueMetric   // Main revenue figures
3. RevenueStream   // Business segments
4. Product         // What's being sold
5. Service         // Services offered
6. CustomerSegment // Who's buying
7. GeographicMarket// Where they're buying
8. TimePeriod      // When
9. Date            // Specific dates
10. Concept        // Supporting metrics
```

## Testing

### Test Case 1: NVIDIA Revenue
```
Input: NVIDIA Q3 FY25 revenue data
Expected Layout:
- Column 1: Article
- Column 2: NVIDIA
- Column 3: Q3 FY25, October 2024
- Column 4: $35.1B total revenue
- Column 5: Data Center, Gaming, etc.
- Column 6: R&D, SG&A services
- Column 8: Growth rates, margins
```

### Test Case 2: Multi-Segment Company
```
Input: Company with 10 revenue streams
Expected:
- All streams in Column 5
- Vertically stacked
- 120px spacing between them
- Clear hierarchy maintained
```

## Summary

### What Changed
- ✅ Added columnOrder (8 levels)
- ✅ Added priorityTypes (10 types)
- ✅ Adjusted spacing for clarity
- ✅ Hierarchical left-to-right flow

### Result
Revenue graphs now show:
- 📊 **Clear hierarchy** - 8 distinct levels
- 🎯 **Logical flow** - Company → Time → Revenue → Segments
- 👁️ **Easy to read** - Left-to-right progression
- 🔍 **Better analysis** - See composition at a glance

Perfect for financial analysis and revenue breakdowns! 💰
