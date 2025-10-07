# Story Chapter Count - Dynamic Update

## Changes Made

### Problem
Previously, the story generation was hardcoded to create **4-6 chapters** regardless of article complexity. This didn't make sense for:
- **Short articles** with only 2-3 entities (forced into 4 chapters)
- **Long articles** with 50+ entities (limited to only 6 chapters)

### Solution
Implemented **dynamic chapter count** based on content complexity.

## New Logic

### Chapter Count Algorithm
```typescript
function determineChapterCount(entityCount: number, relationshipCount: number) {
  // Simple articles: 1-5 entities → 2-3 chapters
  if (entityCount <= 5) {
    return { min: 2, max: 3, recommended: "2-3" };
  }
  // Medium articles: 6-15 entities → 3-5 chapters
  if (entityCount <= 15) {
    return { min: 3, max: 5, recommended: "3-5" };
  }
  // Complex articles: 16-30 entities → 4-6 chapters
  if (entityCount <= 30) {
    return { min: 4, max: 6, recommended: "4-6" };
  }
  // Very complex articles: 30+ entities → 5-8 chapters
  return { min: 5, max: 8, recommended: "5-8" };
}
```

### Dynamic Schema
- Created `createStorySchema(min, max)` factory function
- Zod schema now validates based on actual content complexity
- AI is instructed to use appropriate chapter count

## Benefits

1. **Better UX for short articles** - No padding with unnecessary chapters
2. **Better coverage for complex articles** - More chapters to properly explain
3. **Faster audio generation** - Fewer chapters for simple content
4. **More natural storytelling** - Chapter count matches content depth

## Example Scenarios

| Article Type | Entities | Old Chapters | New Chapters |
|--------------|----------|--------------|--------------|
| Simple news  | 3        | 4-6 (forced) | 2-3 (natural)|
| Medium blog  | 12       | 4-6          | 3-5          |
| Complex report| 25      | 4-6          | 4-6          |
| Research paper| 45      | 4-6 (limited)| 5-8 (better) |

## Files Modified
- `/app/api/articles/[id]/story/route.ts`

## Testing Recommendations
1. Test with a short article (2-3 entities) - should generate 2-3 chapters
2. Test with a medium article (10 entities) - should generate 3-5 chapters
3. Test with a complex article (40+ entities) - should generate 5-8 chapters
