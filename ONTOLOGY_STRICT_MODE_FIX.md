# Ontology Strict Mode Fix

## Problem

When using Advanced Mode with custom ontology, the AI was extracting entities with types NOT defined in the ontology:

```
❌ Before:
Custom Ontology: TEAMNAME, PERSON
Extracted: TEAMNAME, PERSON, ORGANIZATION, LOCATION, DATE
→ Mixed custom + default types!
```

## Root Cause

The AI was falling back to generic entity types (Person, Organization, Location, Date) even though the ontology only defined specific types like "TEAMNAME" and "PERSON".

## Solution

### 1. Strengthened System Prompt
```typescript
STRICT RULES:
- You MUST use ONLY the entity types defined in the ontology
- The allowed entity types are: ${entityTypes.join(', ')}
- DO NOT use any other entity types
- If you try to use an entity type not in the list, the extraction will fail
```

### 2. Enhanced User Prompt
```typescript
CRITICAL INSTRUCTIONS:
1. You MUST use ONLY the entity types listed below - NO OTHER TYPES ARE ALLOWED
2. Do NOT use generic types like "Person", "Organization", "Location", "Date" 
   unless they are explicitly listed below
3. If something doesn't fit the defined types, DO NOT extract it
4. Keep all entity names in the SAME LANGUAGE as the original article
```

### 3. Explicit Type Listing
```typescript
**ALLOWED Entity Types (USE ONLY THESE):**
- **TEAMNAME**: Team or group name
  Examples: AMS, Innovation Team
- **PERSON**: Individual person
  Examples: แนน, เนี้ยว, เก้า
```

### 4. Lower Temperature
```typescript
temperature: 0.1  // Was 0.3, now more deterministic
```

## Expected Behavior

### Custom Ontology Example
```json
{
  "name": "Team Structure",
  "entities": [
    {
      "type": "TEAMNAME",
      "description": "Team or group name",
      "examples": ["AMS", "Innovation Team"]
    },
    {
      "type": "PERSON",
      "description": "Individual person",
      "examples": ["แนน", "เนี้ยว", "เก้า"]
    }
  ]
}
```

### Article
```
ทีม AMS มีสมาชิกคือ แนน เนี้ยว และ เก้า ทำงานที่ Bangkok
```

### Before (Wrong)
```json
{
  "entities": [
    { "type": "TEAMNAME", "name": "AMS" },
    { "type": "PERSON", "name": "แนน" },
    { "type": "PERSON", "name": "เนี้ยว" },
    { "type": "PERSON", "name": "เก้า" },
    { "type": "LOCATION", "name": "Bangkok" }  // ❌ Not in ontology!
  ]
}
```

### After (Correct)
```json
{
  "entities": [
    { "type": "TEAMNAME", "name": "AMS" },
    { "type": "PERSON", "name": "แนน" },
    { "type": "PERSON", "name": "เนี้ยว" },
    { "type": "PERSON", "name": "เก้า" }
    // ✅ Bangkok skipped - not in ontology
  ]
}
```

## Zod Schema Enforcement

The Zod schema already enforces strict types:

```typescript
type: z.enum(entityTypes as [string, ...string[]])
  .describe('Entity type - must be one of the allowed types')
```

This means:
- ✅ AI **cannot** return types not in the enum
- ✅ OpenAI's structured output will **reject** invalid types
- ✅ Only ontology-defined types are allowed

## Testing

### Test Case 1: Team Structure
```
Ontology: TEAMNAME, PERSON
Article: "ทีม AMS มีสมาชิกคือ แนน เนี้ยว และ เก้า"
Expected: Only TEAMNAME and PERSON entities
Result: ✅ No ORGANIZATION, LOCATION, or DATE
```

### Test Case 2: Healthcare
```
Ontology: Patient, Doctor, Diagnosis
Article: "John visited Dr. Smith in Bangkok. Diagnosed with diabetes."
Expected: Patient, Doctor, Diagnosis only
Result: ✅ Bangkok skipped (no Location type in ontology)
```

### Test Case 3: Strict Filtering
```
Ontology: Product, Price
Article: "iPhone costs $999 in USA, released on Jan 1"
Expected: Product (iPhone), Price ($999)
Result: ✅ USA and Jan 1 skipped (no Location/Date in ontology)
```

## Benefits

### ✅ **Strict Adherence**
- Only extracts what's defined
- No mixing with default types
- Clean, focused graphs

### 🎯 **Domain-Specific**
- Extract exactly what you need
- Ignore irrelevant information
- Precise control

### 📊 **Consistent Results**
- Same ontology = same entity types
- Predictable output
- Easier to analyze

### 🔒 **Schema-Enforced**
- Zod validates at runtime
- OpenAI validates at generation
- Double protection

## Summary

### What Changed
- ✅ Strengthened system prompt with explicit type list
- ✅ Enhanced user prompt with critical instructions
- ✅ Lowered temperature for more deterministic output
- ✅ Added explicit warnings about generic types

### Result
Advanced Mode now:
- 🎯 **Strictly follows** custom ontology
- ❌ **Rejects** default/generic types
- ✅ **Extracts only** defined entity types
- 🔒 **Schema-enforced** validation

No more mixed entity types! The AI will now use ONLY the types you define in your custom ontology. 🎉
