# New Article Type: Mystery & Investigation

## What Changed

Created a dedicated **"Mystery & Investigation"** article type specifically for:
- Murder mysteries
- Detective stories  
- Crime investigations
- Logic puzzles
- Whodunit scenarios

## Why Separate Article Type?

Mystery articles have unique requirements that don't fit general articles:
- ✅ Need special entity types (Evidence, Clue)
- ✅ Need investigation-specific relationships (contradicts, guilty-of, arrested-for)
- ✅ Need to track alibis and contradictions
- ✅ Need to identify guilty parties
- ✅ Need logical reasoning support

## New Entity Types

```typescript
export const MYSTERY_ENTITY_TYPES = [
  "Person",      // Suspects, victims, witnesses, detectives
  "Location",    // Crime scenes, rooms, buildings
  "Event",       // Crimes, murders, thefts, investigations
  "Concept",     // Activities, alibis, statements, motives
  "Date",        // When events occurred, times of day
  "Evidence",    // Physical evidence, contradictions ← NEW!
  "Clue",        // Information that helps solve ← NEW!
] as const;
```

### New Entity Types Explained

**Evidence** 🔴
- Physical evidence
- Contradictions
- Proof of guilt/innocence
- Color: Red (#ef4444) - critical importance

**Clue** 🟠
- Information that helps solve the mystery
- Suspicious details
- Hints and patterns
- Color: Amber (#f59e0b) - important

## Investigation-Specific Relationships

```typescript
// People relationships
- "was-doing" (Person → Activity/Concept)
- "stated-that" (Person → Statement/Concept)
- "witnessed" (Person → Event)
- "suspects" (Person → Person)

// Event relationships
- "occurred-on" (Event → Date)
- "happened-at" (Event → Location)
- "involves" (Event → Person)
- "investigated-by" (Event → Person)

// Evidence relationships
- "contradicts" (Evidence/Clue → Concept/Date) ← KEY!
- "points-to" (Evidence → Person)
- "proves" (Evidence → Concept)
- "reveals" (Clue → Person)

// Investigation outcomes
- "arrested-for" (Person → Event)
- "guilty-of" (Person → Event)
- "accused-of" (Person → Event)
```

## System Prompt Features

### 1. Detective Persona
```
You are an expert detective and logic analyst specializing in 
mysteries, investigations, and crime solving.
```

### 2. Explicit Contradiction Instructions
```
**CRITICAL for solving mysteries**:
- Create "contradicts" relationships when statements don't match facts
- ALWAYS include detailed description explaining:
  * What the contradiction is
  * Why it's suspicious or impossible
  * How it reveals the guilty party
```

### 3. Example in Thai
```
Example: "ทำอาหารเช้าตอนกลางวันเป็นไปไม่ได้ เพราะอาหารเช้า
ควรทำตอนเช้า ไม่ใช่ตอนกลางวัน ทำให้พ่อครัวเป็นผู้ต้องสงสัย"
```

### 4. Sentiment Markers
```
- Mark suspicious activities with negative sentiment and high importance
- Mark the guilty person with negative sentiment
```

## Visualization Configuration

```typescript
"mystery-investigation": {
  name: "Mystery Investigation",
  description: "Network layout for solving mysteries",
  nodeColors: {
    ...BASE_COLORS,
    Evidence: "#ef4444",  // red - critical
    Clue: "#f59e0b",      // amber - important
  },
  layout: {
    type: "force",        // Network layout
    groupBy: "importance", // Group by importance
  },
  edgeStyle: {
    strongColor: "#ef4444", // Red for contradictions
    animated: true,
  },
  sentimentOverride: true, // Highlight guilty parties
}
```

## Usage

### In the UI

Users can now select "Mystery & Investigation" as an article type when creating articles.

### Example Article

```
Article Type: Mystery & Investigation

Content:
ฆาตกรรมในบ้าน ชายหนุ่มถูกฆาตกรรมเมื่อตอนกลางวันในวันอาทิตย์...
```

### Expected Graph

**Entities:**
- Event: ฆาตกรรม
- Date: กลางวันวันอาทิตย์
- 4 People: ภรรยา, พ่อครัว, คนใช้, คนทำสวน
- 4 Concepts: อ่านหนังสือ, ทำอาหารเช้า, จัดโต๊ะ, รดน้ำต้นไม้
- Evidence: ความขัดแย้งเรื่องเวลา (red node)

**Key Relationships:**
```
พ่อครัว → was-doing → ทำอาหารเช้า
ทำอาหารเช้า → contradicts → กลางวันวันอาทิตย์
  (description: detailed explanation)
พ่อครัว → guilty-of → ฆาตกรรม
```

## Benefits

### 🎯 **Specialized for Mysteries**
- Dedicated entity types
- Investigation-specific relationships
- Logic-focused extraction

### 🔍 **Better Clue Tracking**
- Evidence and Clue entities
- Contradiction relationships
- Clear reasoning paths

### 🎨 **Visual Distinction**
- Red for evidence (critical)
- Amber for clues (important)
- Sentiment highlights guilty parties

### 💡 **Question Answering**
Can answer:
- "Who is guilty?"
- "Why are they guilty?"
- "What's the contradiction?"
- "What was everyone doing?"

### 🧹 **Cleaner General Type**
- General articles no longer cluttered with mystery logic
- Each type focused on its domain
- Better separation of concerns

## Files Modified

1. ✅ `/lib/article-types.ts`
   - Added `"mystery-investigation"` to ArticleType
   - Added MYSTERY_ENTITY_TYPES enum
   - Added mystery article config with specialized prompt

2. ✅ `/lib/visualization-config.ts`
   - Added mystery visualization config
   - Added Evidence and Clue colors
   - Configured for network layout

3. ✅ `/lib/openai.ts`
   - No changes needed (dynamic schema handles new type)

## Testing

### Test Case 1: Murder Mystery
```
Article Type: Mystery & Investigation
Content: ฆาตกรรมในบ้าน...

Expected:
- ✅ All suspects extracted
- ✅ All alibis as Concepts
- ✅ Time contradiction as Evidence
- ✅ "contradicts" relationship with explanation
- ✅ Guilty party identified
```

### Test Case 2: Detective Story
```
Article Type: Mystery & Investigation
Content: English detective story

Expected:
- ✅ Evidence entities
- ✅ Clue entities
- ✅ Investigation relationships
- ✅ Solution path visible
```

### Test Case 3: Logic Puzzle
```
Article Type: Mystery & Investigation
Content: Logic puzzle with constraints

Expected:
- ✅ All constraints as Evidence
- ✅ Logical contradictions
- ✅ Solution derivable from graph
```

## Migration

### For Existing Mystery Articles
1. Change article type from "general" to "mystery-investigation"
2. Regenerate the article
3. Graph will use specialized extraction

### For New Articles
1. Select "Mystery & Investigation" type
2. Paste mystery content
3. System automatically uses detective logic

## Summary

### What We Created
- ✅ New article type: "mystery-investigation"
- ✅ 2 new entity types: Evidence, Clue
- ✅ Investigation-specific relationships
- ✅ Specialized system prompt
- ✅ Custom visualization config

### Result
A **dedicated article type** for mysteries that:
- 🕵️‍♂️ Extracts clues and evidence
- 🔍 Tracks contradictions
- 🎯 Identifies guilty parties
- 💡 Supports logical reasoning
- 📊 Visualizes investigation clearly

Perfect for murder mysteries, detective stories, and logic puzzles! 🎉
