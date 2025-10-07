# Mystery & Investigation Article Support

## Problem

The system couldn't properly extract information from mystery/investigation articles like murder mysteries, detective stories, or crime investigations.

### Example Article (Thai)
```
ฆาตกรรมในบ้าน ชายหนุ่มถูกฆาตกรรมเมื่อตอนกลางวันในวันอาทิตย์ 
ขณะที่เกิดเหตุนั้นมีคนอยู่ในบ้านจำนวน 4 คนคือ ภรรยา พ่อครัว คนใช้และคนทำสวน

ภรรยากล่าวว่า "ฉันกำลังอ่านหนังสือ"
พ่อครัวกล่าวว่า "ผมกำลังทำอาหารเช้าอยู่"
คนใช้กล่าวว่า "ฉันกำลังจัดโต๊ะอยู่"
คนทำสวนกล่าวว่า "ผมกำลังรดน้ำต้นไม้"

Answer: พ่อครัว (The cook is guilty - making breakfast at midday is suspicious)
```

### What Was Missing

The old system extracted:
- ✅ People (wife, cook, maid, gardener)
- ✅ Location (house)
- ❌ **Missing**: The murder event
- ❌ **Missing**: What each person was doing (activities/alibis)
- ❌ **Missing**: Time information (Sunday midday)
- ❌ **Missing**: The contradiction (breakfast at midday)

## Solution

Enhanced the General article prompt to support mystery/investigation articles with:

### 1. Enhanced Entity Extraction

```typescript
- **Event**: crimes, murders, investigations
- **Concept**: activities, alibis, statements, evidence, contradictions
- **Date**: time periods, days of week, times of day

IMPORTANT for mystery/investigation articles:
- Extract the EVENT (e.g., "murder", "investigation")
- Extract each person's ACTIVITY as a Concept (e.g., "cooking breakfast")
- Extract TIME information as Date (e.g., "Sunday midday")
- Extract STATEMENTS/ALIBIS as Concepts
- Extract CONTRADICTIONS or EVIDENCE as Concepts
```

### 2. Investigation-Specific Relationships

```typescript
- For investigations:
  * "was-doing" (Person → Activity/Concept)
  * "stated-that" (Person → Statement/Concept)
  * "contradicts" (Statement → Time/Fact)
  * "suspects" (Investigator → Suspect)
  * "arrested-for" (Person → Event)

IMPORTANT:
- Create "was-doing" relationships from each Person to their Activity
- Create "occurred-on" from Event to Date/Time
- Create "contradicts" relationships when statements don't match facts
- Use descriptions to explain WHY (e.g., "breakfast at midday is suspicious")
```

## Expected Graph Structure

### Entities
```json
{
  "entities": [
    // The Event
    { 
      "id": "murder", 
      "name": "ฆาตกรรม", 
      "type": "Event",
      "description": "ชายหนุ่มถูกฆาตกรรม",
      "importance": "high"
    },
    
    // Time
    { 
      "id": "sunday-midday", 
      "name": "กลางวันวันอาทิตย์", 
      "type": "Date",
      "importance": "high"
    },
    
    // Location
    { 
      "id": "house", 
      "name": "บ้าน", 
      "type": "Location"
    },
    
    // People (Suspects)
    { 
      "id": "wife", 
      "name": "ภรรยา", 
      "type": "Person",
      "description": "ภรรยาของเหยื่อ"
    },
    { 
      "id": "cook", 
      "name": "พ่อครัว", 
      "type": "Person",
      "description": "พ่อครัวในบ้าน",
      "sentiment": "negative"
    },
    { 
      "id": "maid", 
      "name": "คนใช้", 
      "type": "Person"
    },
    { 
      "id": "gardener", 
      "name": "คนทำสวน", 
      "type": "Person"
    },
    
    // Activities/Alibis
    { 
      "id": "reading-book", 
      "name": "อ่านหนังสือ", 
      "type": "Concept",
      "description": "กิจกรรมที่ภรรยาบอกว่ากำลังทำ"
    },
    { 
      "id": "cooking-breakfast", 
      "name": "ทำอาหารเช้า", 
      "type": "Concept",
      "description": "กิจกรรมที่พ่อครัวบอกว่ากำลังทำ - ขัดแย้งกับเวลา",
      "sentiment": "negative",
      "importance": "high"
    },
    { 
      "id": "setting-table", 
      "name": "จัดโต๊ะ", 
      "type": "Concept",
      "description": "กิจกรรมที่คนใช้บอกว่ากำลังทำ"
    },
    { 
      "id": "watering-plants", 
      "name": "รดน้ำต้นไม้", 
      "type": "Concept",
      "description": "กิจกรรมที่คนทำสวนบอกว่ากำลังทำ"
    },
    
    // The Contradiction
    { 
      "id": "time-contradiction", 
      "name": "ความขัดแย้งเรื่องเวลา", 
      "type": "Concept",
      "description": "พ่อครัวบอกว่ากำลังทำอาหารเช้าแต่เกิดเหตุตอนกลางวัน",
      "sentiment": "negative",
      "importance": "high"
    }
  ]
}
```

### Relationships
```json
{
  "relationships": [
    // Event details
    { 
      "from": "murder", 
      "to": "sunday-midday", 
      "type": "occurred-on",
      "description": "เหตุการณ์เกิดขึ้นเมื่อ",
      "strength": "strong"
    },
    { 
      "from": "murder", 
      "to": "house", 
      "type": "happened-at",
      "description": "สถานที่เกิดเหตุ",
      "strength": "strong"
    },
    
    // People's activities (alibis)
    { 
      "from": "wife", 
      "to": "reading-book", 
      "type": "was-doing",
      "description": "กิจกรรมที่ภรรยาบอกว่ากำลังทำขณะเกิดเหตุ",
      "strength": "medium"
    },
    { 
      "from": "cook", 
      "to": "cooking-breakfast", 
      "type": "was-doing",
      "description": "กิจกรรมที่พ่อครัวบอกว่ากำลังทำขณะเกิดเหตุ",
      "strength": "strong"
    },
    { 
      "from": "maid", 
      "to": "setting-table", 
      "type": "was-doing",
      "description": "กิจกรรมที่คนใช้บอกว่ากำลังทำขณะเกิดเหตุ",
      "strength": "medium"
    },
    { 
      "from": "gardener", 
      "to": "watering-plants", 
      "type": "was-doing",
      "description": "กิจกรรมที่คนทำสวนบอกว่ากำลังทำขณะเกิดเหตุ",
      "strength": "medium"
    },
    
    // The critical contradiction
    { 
      "from": "cooking-breakfast", 
      "to": "sunday-midday", 
      "type": "contradicts",
      "description": "ทำอาหารเช้าตอนกลางวันไม่สมเหตุสมผล - อาหารเช้าควรทำตอนเช้า",
      "strength": "strong"
    },
    { 
      "from": "cook", 
      "to": "time-contradiction", 
      "type": "related-to",
      "description": "พ่อครัวเป็นผู้ที่มีคำให้การขัดแย้ง",
      "strength": "strong"
    },
    { 
      "from": "cook", 
      "to": "murder", 
      "type": "arrested-for",
      "description": "ถูกจับกุมเนื่องจากคำให้การขัดแย้ง",
      "strength": "strong"
    }
  ]
}
```

## Key Insights Generated

With this structure, the system can answer:

### 1. "Who was arrested?"
```
Query: Find Person with "arrested-for" relationship
Answer: พ่อครัว (Cook)
```

### 2. "Why was the cook arrested?"
```
Query: Follow relationships from Cook
Cook → was-doing → cooking-breakfast
cooking-breakfast → contradicts → sunday-midday
Description: "ทำอาหารเช้าตอนกลางวันไม่สมเหตุสมผล"
```

### 3. "What was everyone doing?"
```
Query: All "was-doing" relationships
- ภรรยา → อ่านหนังสือ
- พ่อครัว → ทำอาหารเช้า (suspicious!)
- คนใช้ → จัดโต๊ะ
- คนทำสวน → รดน้ำต้นไม้
```

### 4. "When did the murder happen?"
```
Query: murder → occurred-on → ?
Answer: กลางวันวันอาทิตย์ (Sunday midday)
```

### 5. "What's the contradiction?"
```
Query: Find "contradicts" relationships
cooking-breakfast contradicts sunday-midday
Reason: "อาหารเช้าควรทำตอนเช้า ไม่ใช่ช่วงกลางวัน"
```

## Benefits

### 🔍 **Mystery Solving**
- Captures all clues and contradictions
- Shows logical connections
- Highlights suspicious behavior

### 📊 **Complete Investigation**
- All suspects and their alibis
- Timeline of events
- Evidence and contradictions

### 🎯 **Reasoning Support**
- "Why" explanations in descriptions
- Contradiction relationships
- Sentiment markers for suspicious items

### 💡 **Interactive Analysis**
- Ask questions about the graph
- Follow relationship chains
- Discover the solution

## Testing

### Test Case 1: Murder Mystery (Thai)
```
Input: ฆาตกรรมในบ้าน... (as above)

Expected Entities:
- Event: ฆาตกรรม
- Date: กลางวันวันอาทิตย์
- Location: บ้าน
- 4 People: ภรรยา, พ่อครัว, คนใช้, คนทำสวน
- 4 Activities: อ่านหนังสือ, ทำอาหารเช้า, จัดโต๊ะ, รดน้ำต้นไม้
- Concept: ความขัดแย้งเรื่องเวลา

Expected Relationships:
- Each person → was-doing → their activity
- murder → occurred-on → sunday-midday
- cooking-breakfast → contradicts → sunday-midday
- cook → arrested-for → murder

✅ Can answer: "Who is guilty and why?"
```

### Test Case 2: Detective Story (English)
```
Input:
"A theft occurred at the museum on Friday night. 
Three guards were on duty: John said he was patrolling the east wing,
Mary said she was monitoring cameras, and Bob said he was checking
the main entrance. However, the cameras show Bob was actually
in the vault room when the theft occurred."

Expected:
- Event: theft
- Date: Friday night
- Location: museum, vault room
- 3 People with activities
- Contradiction: Bob's statement vs camera evidence
- Bob → arrested-for → theft
```

### Test Case 3: Alibi Verification
```
Input:
"The robbery happened at 3 PM. Suspect A claims he was at work,
Suspect B claims she was at the gym, Suspect C claims he was
sleeping. Police verified A's and B's alibis, but C's neighbor
said C left home at 2:30 PM."

Expected:
- Event: robbery
- Date: 3 PM
- 3 Suspects with alibis
- Contradiction: C's alibi vs neighbor's testimony
- Verified vs unverified alibis
```

## Use Cases

### 1. Murder Mysteries
- Extract suspects and alibis
- Find contradictions in statements
- Identify guilty party

### 2. Detective Stories
- Map investigation progress
- Track clues and evidence
- Show logical deductions

### 3. Crime Investigations
- Document witness statements
- Compare alibis with facts
- Highlight inconsistencies

### 4. Logic Puzzles
- Capture all constraints
- Show relationships
- Support reasoning

## Summary

### What Changed
- ✅ Enhanced entity types for investigations
- ✅ Added investigation-specific relationships
- ✅ Support for activities/alibis
- ✅ Support for contradictions
- ✅ Time-based reasoning

### Result
The system can now:
- 🔍 Extract complete investigation details
- 📊 Map suspects and their alibis
- 🎯 Identify contradictions
- 💡 Support mystery solving
- 🗣️ Answer "who, what, when, why" questions

Perfect for mystery articles, detective stories, and investigation reports! 🕵️‍♂️

### Next Steps
1. Regenerate your murder mystery article
2. Verify all entities and relationships are extracted
3. Ask the graph: "Who is guilty and why?"
4. The graph should show the contradiction clearly!
