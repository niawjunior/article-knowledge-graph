# AI & Graph Improvements for Better Insights

## Changes Made

### 1. **Enhanced OpenAI Prompt**
The AI now extracts much richer information:

#### **Before:**
- Generic entity types
- Simple "mentions" relationships
- No context or metadata

#### **After:**
- **7 Entity Types**: Person, Organization, Location, Concept, Event, Date, **Technology**
- **Sentiment Analysis**: positive/negative/neutral for each entity
- **Importance Ranking**: high/medium/low priority
- **Specific Relationships**: "attacked-by", "victim-of", "leaked-from", "uses", "affected-by" instead of generic "mentions"
- **Relationship Strength**: strong/medium/weak connections

### 2. **Visual Indicators**

#### **Color Coding by Sentiment:**
- 🔴 **Red (#dc2626)**: Negative sentiment (victims, problems, attacks)
- 🟢 **Green (#16a34a)**: Positive sentiment (good news, solutions)
- 🔵 **Blue/Purple/etc**: Neutral (type-based colors)

#### **Edge Styling by Strength:**
- **Thick animated edges (3px)**: Strong relationships
- **Medium edges (2.5px)**: Article connections
- **Thin edges (1.5px)**: Weak/supporting relationships

### 3. **Smarter Layout**
- **Layer 1 (Inner circle)**: Entities directly mentioned in article
- **Layer 2 (Outer circle)**: Related/secondary entities
- Auto-adjusts based on connection patterns

## For Your Red Hat Example

The improved AI will now extract:

### **Entities with Context:**
```json
{
  "name": "Red Hat",
  "type": "Organization",
  "sentiment": "negative",  // They're the victim
  "importance": "high"
}
{
  "name": "Crimson Collective",
  "type": "Organization",
  "sentiment": "negative",  // They're the attacker
  "importance": "high"
}
{
  "name": "GitLab",
  "type": "Technology",
  "sentiment": "neutral",
  "importance": "medium"
}
{
  "name": "Data Leak",
  "type": "Event",
  "sentiment": "negative",
  "importance": "high"
}
```

### **Specific Relationships:**
Instead of generic "MENTIONS":
- Red Hat → **"victim-of"** → Data Leak
- Crimson Collective → **"attacked"** → Red Hat
- Red Hat → **"uses"** → GitLab
- Data Leak → **"leaked-from"** → GitLab
- Telecommunications Companies → **"affected-by"** → Data Leak
- Financial Institutions → **"affected-by"** → Data Leak

## Benefits

1. **Immediate Visual Understanding**: Red nodes = victims/problems, see them instantly
2. **Relationship Clarity**: Know exactly HOW entities are connected
3. **Priority Focus**: High-importance entities stand out
4. **Better Analysis**: Understand attack vectors, impact chains, affected parties
5. **Actionable Intelligence**: See who to contact, what's at risk, severity levels

## Next Steps (Optional)

1. **Add Icons**: Different icons for each entity type
2. **Filtering**: Show only high-importance nodes, or filter by sentiment
3. **Timeline**: Show temporal progression of events
4. **Impact Score**: Calculate and display business impact
5. **Export Report**: Generate PDF summary with key findings
6. **Similar Articles**: Find related incidents in your database

## Test It!

Try your Red Hat article again. You should now see:
- Red Hat and victims in **red**
- Crimson Collective as attacker
- Clear "attacked-by", "leaked-from" relationships
- Strong connections animated
- Better organized layout

The graph will tell the story visually! 🎯
