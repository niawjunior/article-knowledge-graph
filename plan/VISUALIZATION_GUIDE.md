# Visualization Configuration Guide

## Overview
The graph visualization now adapts dynamically based on article type, with specialized colors, layouts, and styling for each domain.

## Architecture

### Type-Specific Visualization
Each article type has its own visualization configuration that controls:
- **Node Colors**: Semantic colors based on entity types
- **Layout**: Spacing and arrangement patterns
- **Edge Styling**: Line thickness, colors, and animation
- **Priority Types**: Which entities to emphasize

### File Structure

```
lib/
  ├── article-types.ts          # Article type definitions & extraction prompts
  ├── visualization-config.ts   # NEW: Visualization configurations
  └── graph-operations.ts       # Updated: Stores/retrieves article type

components/
  └── GraphVisualization.tsx    # Updated: Uses type-specific configs
```

## Visualization Configurations

### 1. General Article
**Layout**: Grid layout grouped by entity type
**Colors**: Standard entity type colors
**Edge Style**: Moderate thickness, no animation by default
**Best for**: Mixed content, news articles

### 2. Financial Statement ⭐
**Layout**: Hierarchical (Top-to-Bottom) showing financial flow
**Colors**: Semantic financial colors
- Revenue/Profit: Green shades
- Costs/Expenses: Red/Orange shades
- Segments: Purple shades
- Metrics: Blue
- Margins: Teal

**Edge Style**: Thicker lines, animated to show flow
**Spacing**: Tighter vertical spacing (120px) for compact financial hierarchy
**Best for**: Income statements, quarterly reports, balance sheets

**Example for NVIDIA Q3 FY25**:
```
Organization (NVIDIA) → Revenue ($35.1B) → Segments
                      ↓
                   Costs ($8.9B)
                      ↓
                Gross Profit ($26.2B, 75% margin)
                      ↓
              Operating Expenses ($4.3B)
                      ↓
              Operating Profit ($21.9B, 62% margin)
                      ↓
                   Taxes ($3.0B)
                      ↓
                Net Profit ($19.3B, 55% margin)
```

### 3. Investment Analysis
**Layout**: Force-directed network showing investment relationships
**Colors**: 
- Investors: Purple
- Companies: Blue
- Valuations: Green
- Investment Rounds: Cyan

**Edge Style**: Thick animated lines for investment flows
**Spacing**: Wide spacing (350px horizontal) for clear network view
**Best for**: Funding rounds, M&A, venture capital

### 4. Revenue Analysis
**Layout**: Hierarchical showing revenue breakdown
**Colors**:
- Revenue streams: Green shades
- Products: Blue
- Customers: Purple
- Channels: Amber
- Markets: Pink

**Edge Style**: Animated green-tinted flows
**Best for**: Sales performance, customer segmentation, revenue composition

### 5. Organizational Chart
**Layout**: Hierarchical (Top-to-Bottom) showing org structure
**Colors**:
- Executives: Red (high importance)
- Managers: Amber
- Divisions: Purple
- Departments: Purple-500
- Teams: Purple-400
- People: Green

**Edge Style**: Non-animated structural lines
**Spacing**: Tight spacing (100px vertical) for compact org chart
**Best for**: Company structure, team hierarchies, reporting lines

### 6. Security Incident
**Layout**: Hierarchical (Left-to-Right) showing attack progression
**Colors**:
- Attackers/Threats: Red shades (negative)
- Victims: Amber/Orange (warning)
- Vulnerabilities: Red
- Systems: Blue
- Security Tools: Green (positive)

**Edge Style**: Thick animated red-tinted lines showing attack flow
**Direction**: Left-to-Right to show temporal progression
**Best for**: Cybersecurity breaches, attack analysis, incident reports

### 7. Market Analysis
**Layout**: Force-directed network showing competitive landscape
**Colors**:
- Companies: Blue
- Competitors: Purple
- Market Leaders: Green
- Products: Cyan
- Markets: Pink
- Trends: Teal

**Edge Style**: Moderate thickness, non-animated
**Spacing**: Wide spacing (320px) for clear competitive view
**Best for**: Competitive analysis, market research, industry reports

## Technical Details

### Node Color Resolution
```typescript
// Priority order:
1. Sentiment override (if enabled in config)
   - negative → Red (#dc2626)
   - positive → Green (#16a34a)
   
2. Type-specific color from config
   - Uses nodeColors map for the article type
   
3. Fallback to neutral gray (#64748b)
```

### Edge Style Resolution
```typescript
// Factors considered:
- isHighlighted: User clicked on key insight
- isFromArticle: Edge from article node to entity
- strength: 'strong' | 'medium' | 'weak'
- config.edgeStyle: Type-specific defaults

// Width hierarchy:
highlightWidth > strongWidth > defaultWidth
```

### Layout Spacing
Each config defines:
```typescript
spacing: {
  nodeHorizontal: number,  // Horizontal distance between nodes
  nodeVertical: number,    // Vertical distance between nodes
  sectionGap: number       // Gap between type sections
}
```

## Configuration API

### getVisualizationConfig(articleType)
Returns the complete visualization configuration for an article type.

```typescript
import { getVisualizationConfig } from '@/lib/visualization-config';

const config = getVisualizationConfig('financial-statement');
// Returns: VisualizationConfig with colors, layout, edge styles
```

### getNodeColor(type, sentiment, config)
Gets the appropriate color for a node based on type, sentiment, and config.

```typescript
import { getNodeColor } from '@/lib/visualization-config';

const color = getNodeColor('Revenue', 'positive', config);
// Returns: '#10b981' (green for financial revenue)
```

### getEdgeStyle(isFromArticle, strength, isHighlighted, config)
Gets the appropriate edge styling based on context and config.

```typescript
import { getEdgeStyle } from '@/lib/visualization-config';

const style = getEdgeStyle(false, 'strong', false, config);
// Returns: { strokeWidth: 3.5, stroke: '#3b82f6', opacity: 1 }
```

## Customization

### Adding a New Article Type

1. **Add to article-types.ts**:
```typescript
export type ArticleType = 
  | 'existing-types'
  | 'your-new-type';

export const ARTICLE_TYPES: ArticleTypeConfig[] = [
  // ... existing types
  {
    id: 'your-new-type',
    label: 'Your New Type',
    description: 'Description of what this type is for',
    systemPrompt: `Your extraction prompt...`
  }
];
```

2. **Add visualization config to visualization-config.ts**:
```typescript
export const VISUALIZATION_CONFIGS: Record<ArticleType, VisualizationConfig> = {
  // ... existing configs
  'your-new-type': {
    articleType: 'your-new-type',
    name: 'Your Layout Name',
    description: 'Layout description',
    nodeColors: {
      YourEntityType: '#hexcolor',
      // ... more colors
    },
    layout: {
      type: 'hierarchical', // or 'grid', 'force', 'circular'
      direction: 'TB',      // if hierarchical
      spacing: {
        nodeHorizontal: 300,
        nodeVertical: 150,
        sectionGap: 50,
      },
      groupBy: 'type',
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 3.5,
      highlightWidth: 5,
      defaultColor: '#94a3b8',
      strongColor: '#3b82f6',
      highlightColor: '#fbbf24',
      animated: true,
    },
    priorityTypes: ['ImportantType1', 'ImportantType2'],
    sentimentOverride: false,
  }
};
```

### Modifying Existing Configs

To change colors, spacing, or behavior for an existing type:

1. Open `lib/visualization-config.ts`
2. Find the config for your article type
3. Modify the relevant properties:
   - `nodeColors`: Change entity type colors
   - `layout.spacing`: Adjust node spacing
   - `edgeStyle`: Change line thickness/colors
   - `priorityTypes`: Change which entities are emphasized

## Color Palette Reference

### Base Colors (from Tailwind)
- Blue: `#3b82f6` - Primary, technology, metrics
- Green: `#10b981` - Positive, revenue, profit, success
- Purple: `#8b5cf6` - Organizations, investors, segments
- Red: `#ef4444` - Negative, costs, threats, attackers
- Amber: `#f59e0b` - Warning, locations, channels
- Cyan: `#06b6d4` - Technology, products, rounds
- Pink: `#ec4899` - Concepts, markets
- Indigo: `#6366f1` - Dates, periods, strong relationships
- Teal: `#14b8a6` - Margins, trends, metrics
- Orange: `#f97316` - Expenses, victims

### Sentiment Colors
- Positive: `#16a34a` (green-600)
- Negative: `#dc2626` (red-600)
- Neutral: `#64748b` (slate-500)

## Best Practices

1. **Use semantic colors**: Match colors to domain meaning
   - Financial: Green for revenue/profit, red for costs
   - Security: Red for threats, green for defenses
   - Org charts: Hierarchy-based colors

2. **Adjust spacing for density**:
   - Financial statements: Tighter (120px vertical)
   - Org charts: Very tight (100px vertical)
   - Market analysis: Wider (180px vertical)

3. **Animation for flow**:
   - Enable for: Financial flows, attack chains, investment flows
   - Disable for: Static structures (org charts, market landscapes)

4. **Sentiment override**:
   - Enable for: General articles, investment, market analysis
   - Disable for: Domain-specific types with semantic colors

5. **Priority types**:
   - List 3-5 most important entity types
   - These may receive special treatment in future enhancements

## Example: NVIDIA Financial Statement

When you select "Financial Statement" and input NVIDIA Q3 FY25 data:

**Extraction** (from article-types.ts):
- Extracts all financial metrics with exact values
- Extracts all business segments
- Creates financial flow relationships

**Visualization** (from visualization-config.ts):
- Uses hierarchical top-to-bottom layout
- Revenue nodes: Green (#10b981)
- Cost nodes: Red (#ef4444)
- Profit nodes: Emerald (#059669)
- Segment nodes: Purple (#8b5cf6)
- Animated edges showing flow
- Tight 120px vertical spacing

**Result**:
Clear financial waterfall showing:
Revenue → Costs → Gross Profit → Operating Expenses → Operating Profit → Taxes → Net Profit

With all business segments (Data Center, Gaming, etc.) connected to their revenue contributions.

## Troubleshooting

### Colors not showing correctly
- Check that entity types in extraction match nodeColors keys
- Verify articleType is being passed through API
- Check browser console for config loading

### Layout looks cramped/sparse
- Adjust `layout.spacing` values in config
- Increase `nodeHorizontal` for wider spread
- Increase `nodeVertical` for more vertical space
- Increase `sectionGap` for more space between type groups

### Edges not animating
- Check `edgeStyle.animated` is `true` in config
- Animation also triggers for strong relationships and highlights

### Wrong colors being used
- Check `sentimentOverride` setting
- If true, sentiment colors override type colors
- If false, type-specific colors are used

## Future Enhancements

Potential improvements:
- [ ] Auto-layout algorithms (force-directed, hierarchical)
- [ ] Custom node shapes per type
- [ ] Collapsible sections
- [ ] Type-specific node sizes
- [ ] Custom edge types (dashed, dotted)
- [ ] Export layouts as templates
- [ ] User-customizable color schemes
