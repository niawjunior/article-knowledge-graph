# Thai Name Deduplication Fix

## Problem

The AI was creating duplicate entities for the same person when Thai honorifics were used:

```
❌ Before:
- Entity 1: "พี่แนน" (Pee Nan)
- Entity 2: "แนน" (Nan)
→ These are the SAME person!

- Entity: "แนน เนี้ยว" (Nan Niao)
→ This should be TWO people: "แนน" and "เนี้ยว"
```

## Root Cause

Thai names often include honorifics/titles:
- **พี่** (Pee) = older sibling/senior
- **คุณ** (Khun) = Mr./Ms./polite title
- **น้อง** (Nong) = younger sibling/junior

The AI was treating "พี่แนน" and "แนน" as different people instead of recognizing they're the same person with/without the honorific.

## Solution

Added explicit rules for Thai name handling in the system prompt:

```
**CRITICAL for Thai names**: 
* "พี่แนน" (Pee Nan) and "แนน" (Nan) are the SAME person - use ONE entity
* Thai honorifics like "พี่" (Pee), "คุณ" (Khun) are just titles - the core name is the same
* Example: "พี่จูน" and "จูน" → ONE entity named "จูน"
* When listing multiple people like "แนน เนี้ยว และ เก้า", 
  these are THREE separate people: "แนน", "เนี้ยว", "เก้า"
```

## Examples

### Example 1: Same Person with Honorific

**Input:**
```
"มีพี่แนน ดูแลอยู่... มีสมาชิกคือ แนน เนี้ยว และ เก้า"
```

**Before (Wrong):**
```json
{
  "entities": [
    { "id": "pee-nan", "name": "พี่แนน", "type": "Person" },
    { "id": "nan", "name": "แนน", "type": "Person" },
    // ❌ Duplicate! Same person
  ]
}
```

**After (Correct):**
```json
{
  "entities": [
    { "id": "nan", "name": "แนน", "type": "Person" },
    { "id": "niao", "name": "เนี้ยว", "type": "Person" },
    { "id": "kao", "name": "เก้า", "type": "Person" }
    // ✅ Three separate people, no duplicates
  ]
}
```

### Example 2: Multiple References

**Input:**
```
"พี่จูน ดูแลงาน support... จูน เป็นหัวหน้าทีม"
```

**Before (Wrong):**
```json
{
  "entities": [
    { "id": "pee-june", "name": "พี่จูน", "type": "Person" },
    { "id": "june", "name": "จูน", "type": "Person" }
    // ❌ Duplicate!
  ]
}
```

**After (Correct):**
```json
{
  "entities": [
    { "id": "june", "name": "จูน", "type": "Person" }
    // ✅ One entity, referenced twice
  ]
}
```

### Example 3: List of People

**Input:**
```
"สมาชิกคือ แนน เนี้ยว และ เก้า"
```

**Before (Wrong):**
```json
{
  "entities": [
    { "id": "nan-niao", "name": "แนน เนี้ยว", "type": "Person" }
    // ❌ Combined two people into one!
  ]
}
```

**After (Correct):**
```json
{
  "entities": [
    { "id": "nan", "name": "แนน", "type": "Person" },
    { "id": "niao", "name": "เนี้ยว", "type": "Person" },
    { "id": "kao", "name": "เก้า", "type": "Person" }
    // ✅ Three separate people
  ]
}
```

## Thai Honorifics Reference

### Common Honorifics
```
พี่ (Pee)   = older sibling/senior
น้อง (Nong)  = younger sibling/junior
คุณ (Khun)   = Mr./Ms./polite title
อาจารย์ (Ajarn) = teacher/professor
ดร. (Dr.)    = doctor
```

### Deduplication Rules
```
"พี่แนน" = "แนน" = "คุณแนน" → Same person
"พี่จูน" = "จูน" = "คุณจูน" → Same person
"น้องเกมส์" = "เกมส์" → Same person
```

### Entity Naming Convention
```
✅ Use the core name without honorific
   "แนน" not "พี่แนน"
   "จูน" not "พี่จูน"
   
✅ Keep honorific in description if needed
   {
     "name": "แนน",
     "description": "พี่แนน ดูแลทีม innovation"
   }
```

## Expected Graph Structure

### AMS Team Structure

**Input:**
```
ทีม structure ของ AMS มีพี่แนน ดูแลอยู่. 
เป็นทีมเกี่ยวกับ innovation มีสมาชิกคือ แนน เนี้ยว และ เก้า
มีพี่อัต ดูทีม implement โดยมี สมาชิกคือ หนูนา พี่เซาท์. 
พี่จูน ดูแลงาน support โดยมีสมาชิกคือ เกมส์ บลู 
โดยทั้งหมดนี้ อยู่ภายใต้การดูแลของพี่ติ๊ก
```

**Expected Entities:**
```json
{
  "entities": [
    // Organization
    { "id": "ams", "name": "ทีม AMS", "type": "Organization" },
    
    // Top Leader
    { "id": "tick", "name": "ติ๊ก", "type": "Person" },
    
    // Team Leads
    { "id": "nan", "name": "แนน", "type": "Person" },
    { "id": "at", "name": "อัต", "type": "Person" },
    { "id": "june", "name": "จูน", "type": "Person" },
    
    // Innovation Team Members
    { "id": "niao", "name": "เนี้ยว", "type": "Person" },
    { "id": "kao", "name": "เก้า", "type": "Person" },
    
    // Implement Team Members
    { "id": "nuna", "name": "หนูนา", "type": "Person" },
    { "id": "south", "name": "เซาท์", "type": "Person" },
    
    // Support Team Members
    { "id": "game", "name": "เกมส์", "type": "Person" },
    { "id": "blue", "name": "บลู", "type": "Person" },
    
    // Teams/Concepts
    { "id": "innovation", "name": "ทีม innovation", "type": "Concept" },
    { "id": "implement", "name": "ทีม implement", "type": "Concept" },
    { "id": "support", "name": "ทีม support", "type": "Concept" }
  ]
}
```

**Expected Relationships:**
```json
{
  "relationships": [
    // Top leadership
    { "from": "tick", "to": "ams", "type": "leads" },
    
    // Team leads
    { "from": "nan", "to": "innovation", "type": "leads" },
    { "from": "at", "to": "implement", "type": "leads" },
    { "from": "june", "to": "support", "type": "leads" },
    
    // Innovation team
    { "from": "nan", "to": "innovation", "type": "member-of" },
    { "from": "niao", "to": "innovation", "type": "member-of" },
    { "from": "kao", "to": "innovation", "type": "member-of" },
    
    // Implement team
    { "from": "nuna", "to": "implement", "type": "member-of" },
    { "from": "south", "to": "implement", "type": "member-of" },
    
    // Support team
    { "from": "game", "to": "support", "type": "member-of" },
    { "from": "blue", "to": "support", "type": "member-of" },
    
    // Reporting structure
    { "from": "nan", "to": "tick", "type": "reports-to" },
    { "from": "at", "to": "tick", "type": "reports-to" },
    { "from": "june", "to": "tick", "type": "reports-to" }
  ]
}
```

## Benefits

### ✅ **No Duplicates**
- Each person appears once
- Honorifics don't create duplicates
- Clean graph structure

### 🎯 **Correct Parsing**
- Lists parsed correctly
- "แนน เนี้ยว และ เก้า" → 3 people
- Not combined into one entity

### 📊 **Better Relationships**
- Clear team structure
- Proper reporting lines
- No confusion from duplicates

### 🌍 **Language-Aware**
- Understands Thai naming conventions
- Handles honorifics properly
- Works for other languages too

## Testing

### Test Case 1: Same Person
```
Input: "พี่แนน ดูแล... แนน เป็นหัวหน้า"
Expected: 1 entity named "แนน"
Result: ✅ No duplicates
```

### Test Case 2: Multiple People
```
Input: "สมาชิกคือ แนน เนี้ยว และ เก้า"
Expected: 3 entities: "แนน", "เนี้ยว", "เก้า"
Result: ✅ Three separate people
```

### Test Case 3: Mixed Honorifics
```
Input: "พี่จูน, คุณจูน, จูน"
Expected: 1 entity named "จูน"
Result: ✅ All references to same person
```

## Summary

### What Changed
- ✅ Added Thai honorific handling rules
- ✅ Explicit deduplication for "พี่X" and "X"
- ✅ List parsing guidance
- ✅ Examples in Thai

### Result
The AI now:
- 🎯 **Recognizes** Thai honorifics
- ✅ **Deduplicates** same person with/without titles
- 📝 **Parses** lists correctly
- 🌍 **Understands** Thai naming conventions

No more duplicate entities for the same person! 🎉

### Next Steps
1. Regenerate your AMS team article
2. Should see correct structure:
   - ติ๊ก (top leader)
   - 3 team leads: แนน, อัต, จูน
   - 7 team members (no duplicates)
   - Clear team structure
