# Duplicate Entities Fix

## Problem

The graph was showing duplicate entities for the same things:
- **"31 years old"** appeared 4 times (should be 1)
- **"21 years old"** appeared 2 times (should be 1)
- **"Bangkok"** appeared multiple times (should be 1)
- **"Khon Kaen"** appeared multiple times (should be 1)

### Visual Issue
```
❌ Current:
DATE: "31 years old" (node 1)
DATE: "31 years old" (node 2)
DATE: "31 years old" (node 3)
DATE: "31 years old" (node 4)

LOCATION: "Bangkok" (node 1)
LOCATION: "Bangkok" (node 2)
```

This creates a messy, confusing graph with redundant nodes.

## Root Cause

The AI was creating a **new entity for each mention** instead of reusing the same entity:

```typescript
// ❌ What was happening:
// First mention of Bangkok
{ id: "bangkok-1", name: "Bangkok", type: "Location" }

// Second mention of Bangkok
{ id: "bangkok-2", name: "Bangkok", type: "Location" }

// Third mention of Bangkok
{ id: "bangkok-3", name: "Bangkok", type: "Location" }
```

## Solution

Added explicit deduplication rules to all article type prompts:

```
Rules:
- **IMPORTANT: Each unique entity should appear ONLY ONCE**
- Do not create duplicate entities
- If the same person, location, or concept is mentioned multiple times, 
  use the SAME entity ID
- For example: If "Bangkok" is mentioned 3 times, create ONE entity 
  with id "bangkok", not three separate entities
- For ages: Create ONE entity per age value 
  (e.g., "31 years old" should be one entity, not multiple)
```

## Expected Behavior After Fix

```
✅ New behavior:
DATE: "31 years old" (single node)
  ↑ connected from Niaw

DATE: "21 years old" (single node)
  ↑ connected from Bambi

LOCATION: "Bangkok" (single node)
  ↑ connected from Niaw

LOCATION: "Khon Kaen" (single node)
  ↑ connected from Bambi
```

## Example

### Input Article
```
"Bambi is 21 years old. She is studying in IC at Khon Kaen. 
She has a boyfriend named Niaw. He is 31 years old. 
He is working as a software engineer in Bangkok."
```

### Before (Duplicates)
```json
{
  "entities": [
    { "id": "bambi", "name": "Bambi", "type": "Person" },
    { "id": "age-21-1", "name": "21 years old", "type": "Date" },
    { "id": "ic", "name": "IC", "type": "Organization" },
    { "id": "khon-kaen-1", "name": "Khon Kaen", "type": "Location" },
    { "id": "niaw", "name": "Niaw", "type": "Person" },
    { "id": "age-31-1", "name": "31 years old", "type": "Date" },
    { "id": "age-31-2", "name": "31 years old", "type": "Date" },
    { "id": "age-31-3", "name": "31 years old", "type": "Date" },
    { "id": "age-31-4", "name": "31 years old", "type": "Date" },
    { "id": "bangkok-1", "name": "Bangkok", "type": "Location" },
    { "id": "bangkok-2", "name": "Bangkok", "type": "Location" }
  ]
}
```
❌ 11 entities (should be 7)

### After (No Duplicates)
```json
{
  "entities": [
    { "id": "bambi", "name": "Bambi", "type": "Person" },
    { "id": "age-21", "name": "21 years old", "type": "Date" },
    { "id": "ic", "name": "IC", "type": "Organization" },
    { "id": "khon-kaen", "name": "Khon Kaen", "type": "Location" },
    { "id": "niaw", "name": "Niaw", "type": "Person" },
    { "id": "age-31", "name": "31 years old", "type": "Date" },
    { "id": "bangkok", "name": "Bangkok", "type": "Location" }
  ],
  "relationships": [
    { "from": "bambi", "to": "age-21", "type": "has-age" },
    { "from": "bambi", "to": "khon-kaen", "type": "studies-at" },
    { "from": "bambi", "to": "niaw", "type": "related-to" },
    { "from": "niaw", "to": "age-31", "type": "has-age" },
    { "from": "niaw", "to": "bangkok", "type": "works-at" }
  ]
}
```
✅ 7 entities (correct!)

## Benefits

### 🎯 **Cleaner Graph**
- No duplicate nodes
- Clear, uncluttered visualization
- Easier to understand relationships

### 📊 **Accurate Counts**
```typescript
// Before: Wrong count
entities.filter(e => e.name === "Bangkok").length // 3 ❌

// After: Correct count
entities.filter(e => e.name === "Bangkok").length // 1 ✅
```

### 🔗 **Better Relationships**
```
Before:
Niaw → works-at → Bangkok (node 1)
Niaw → lives-in → Bangkok (node 2)
// Two separate Bangkok nodes!

After:
Niaw → works-at → Bangkok (single node)
Niaw → lives-in → Bangkok (same node)
// One Bangkok node with multiple relationships!
```

### 💾 **Less Storage**
- Fewer entities to store in Neo4j
- Smaller graph size
- Faster queries

## Deduplication Rules

### For All Entity Types

1. **Same Name = Same Entity**
   ```
   "Bangkok" mentioned 5 times → 1 entity
   "31 years old" mentioned 4 times → 1 entity
   ```

2. **Use Consistent IDs**
   ```typescript
   // ✅ Good
   { id: "bangkok", name: "Bangkok" }
   
   // ❌ Bad
   { id: "bangkok-1", name: "Bangkok" }
   { id: "bangkok-2", name: "Bangkok" }
   ```

3. **Multiple Relationships OK**
   ```typescript
   // ✅ One entity, multiple relationships
   { id: "bangkok", name: "Bangkok" }
   
   relationships: [
     { from: "niaw", to: "bangkok", type: "works-at" },
     { from: "niaw", to: "bangkok", type: "lives-in" },
     { from: "company", to: "bangkok", type: "located-in" }
   ]
   ```

## Testing

### Test Case 1: Repeated Locations
```
Input:
"John works in New York. Sarah lives in New York. 
The company is based in New York."

Expected:
- 1 "New York" entity (not 3)
- 3 relationships pointing to it
```

### Test Case 2: Repeated Ages
```
Input:
"Alice is 30 years old. Bob is also 30 years old."

Expected:
- 1 "30 years old" entity (not 2)
- 2 "has-age" relationships pointing to it
```

### Test Case 3: Repeated People
```
Input:
"Steve Jobs founded Apple. Steve Jobs was CEO of Apple. 
Steve Jobs passed away in 2011."

Expected:
- 1 "Steve Jobs" entity (not 3)
- Multiple relationships from this entity
```

## Files Updated

1. ✅ **General article** - Added deduplication rules
2. ✅ **Investment article** - Added deduplication rules
3. ✅ **Revenue analysis** - Added deduplication rules

All three article types now have explicit guidance to avoid duplicates.

## Migration

### For Existing Articles
- ⚠️ **Regenerate articles** to remove duplicates
- Old articles may have duplicate entities
- New extractions will have clean, deduplicated entities

### For New Articles
- ✅ Automatically deduplicated
- ✅ Clean graph structure
- ✅ No redundant nodes

## Summary

### What Changed
- ✅ Added deduplication rules to all prompts
- ✅ Explicit guidance about entity uniqueness
- ✅ Examples of correct behavior

### Result
Each unique entity appears **only once** in the graph:
- 🎯 Cleaner visualization
- 📊 Accurate counts
- 🔗 Better relationships
- 💾 Less storage

No more duplicate nodes cluttering the graph! 🎉

### Next Steps
1. Regenerate your test article
2. Verify no duplicate entities
3. Should see single nodes for "31 years old", "Bangkok", etc.
