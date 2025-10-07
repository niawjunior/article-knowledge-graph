# Zod Structured Output Implementation

## Changes Made

Migrated from manual JSON parsing to **Zod-based structured outputs** using OpenAI's `beta.chat.completions.parse()` API for better type safety and validation.

## Before vs After

### ❌ Before (Manual JSON Parsing)
```typescript
// Manual interfaces
export interface Entity {
  id: string;
  name: string;
  type: string;
  // ...
}

// Manual JSON parsing
const response = await openai.chat.completions.create({
  response_format: { type: 'json_object' },
  // ...
});

const extracted = JSON.parse(content) as ExtractedData; // ⚠️ No validation!
```

### ✅ After (Zod Structured Output)
```typescript
// Zod schemas with validation
const EntitySchema = z.object({
  id: z.string().describe('Unique kebab-case identifier'),
  name: z.string().describe('Entity name in original language'),
  type: z.string().describe('Entity type from system prompt'),
  // ...
});

// Types inferred from schemas
export type Entity = z.infer<typeof EntitySchema>;

// Structured output with automatic validation
const completion = await openai.beta.chat.completions.parse({
  response_format: zodResponseFormat(ExtractedDataSchema, 'extracted_data'),
  // ...
});

const extracted = completion.choices[0].message.parsed; // ✅ Validated!
```

## Benefits

### 🛡️ **Type Safety**
- **Compile-time checking**: TypeScript knows the exact shape of the data
- **Runtime validation**: Zod validates the OpenAI response automatically
- **No manual casting**: Types are inferred directly from schemas

### 🎯 **Better AI Output**
- **Structured outputs**: OpenAI's API enforces the schema
- **Fewer errors**: AI must return valid data matching the schema
- **Consistent format**: No more malformed JSON or missing fields

### 🔍 **Improved DX**
- **Single source of truth**: Schema defines both validation and types
- **Better autocomplete**: IDE knows exact field types
- **Easier refactoring**: Change schema, types update automatically

### 📝 **Self-Documenting**
- **Field descriptions**: Each field has a `.describe()` explanation
- **Clear constraints**: Enums show valid values (`positive|negative|neutral`)
- **Better prompts**: Descriptions help the AI understand requirements

## Schema Structure

### Entity Schema
```typescript
const EntitySchema = z.object({
  id: z.string(),                                    // Required
  name: z.string(),                                  // Required
  type: z.string(),                                  // Required
  description: z.string().optional(),                // Optional
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  importance: z.enum(['high', 'medium', 'low']).optional(),
});
```

### Relationship Schema
```typescript
const RelationshipSchema = z.object({
  from: z.string(),                                  // Required
  to: z.string(),                                    // Required
  type: z.string(),                                  // Required
  description: z.string().optional(),                // Optional
  strength: z.enum(['strong', 'medium', 'weak']).optional(),
});
```

### Extracted Data Schema
```typescript
const ExtractedDataSchema = z.object({
  summary: z.string(),                               // Required
  entities: z.array(EntitySchema),                   // Required array
  relationships: z.array(RelationshipSchema),        // Required array
});
```

## Error Handling

### Before
```typescript
// ❌ Could fail silently or throw generic errors
const extracted = JSON.parse(content) as ExtractedData;
```

### After
```typescript
// ✅ Explicit error handling
const extracted = completion.choices[0].message.parsed;

if (!extracted) {
  throw new Error('Failed to parse structured output from OpenAI');
}
// extracted is guaranteed to match ExtractedData type
```

## API Changes

### Old API (json_object mode)
```typescript
const response = await openai.chat.completions.create({
  response_format: { type: 'json_object' },
  // ...
});
```

### New API (structured outputs)
```typescript
const completion = await openai.beta.chat.completions.parse({
  response_format: zodResponseFormat(ExtractedDataSchema, 'extracted_data'),
  // ...
});
```

## Validation Examples

### Valid Response ✅
```json
{
  "summary": "Article about...",
  "entities": [
    {
      "id": "john-doe",
      "name": "John Doe",
      "type": "Person",
      "sentiment": "positive",
      "importance": "high"
    }
  ],
  "relationships": [
    {
      "from": "john-doe",
      "to": "company-x",
      "type": "works-at",
      "strength": "strong"
    }
  ]
}
```
✅ Passes validation, returns typed data

### Invalid Response ❌
```json
{
  "summary": "Article about...",
  "entities": [
    {
      "id": "john-doe",
      "name": "John Doe",
      "type": "Person",
      "sentiment": "very-positive",  // ❌ Invalid enum value
      "importance": "critical"        // ❌ Invalid enum value
    }
  ]
}
```
❌ Fails validation, throws error

## Migration Impact

### Files Modified
- `/lib/openai.ts` - Complete rewrite with Zod schemas

### Breaking Changes
- ✅ **None!** - External API remains the same
- Function signature: `extractEntitiesFromArticle()` unchanged
- Return type: `Promise<ExtractedData>` unchanged
- Consumers don't need to change any code

### Internal Changes
- Added Zod dependency (already in project from story route)
- Using `openai.beta.chat.completions.parse()` instead of `create()`
- Automatic validation instead of manual parsing

## Future Enhancements

With Zod schemas in place, we can easily:

1. **Add field validation**
   ```typescript
   id: z.string().regex(/^[a-z0-9-]+$/) // Enforce kebab-case
   ```

2. **Add custom transformations**
   ```typescript
   name: z.string().trim().min(1) // Trim whitespace
   ```

3. **Add conditional validation**
   ```typescript
   z.object({...}).refine(data => data.entities.length > 0)
   ```

4. **Export schemas for testing**
   ```typescript
   export { EntitySchema, RelationshipSchema }
   ```

## Testing

To verify the implementation:

1. ✅ **Test with valid article** - Should extract entities successfully
2. ✅ **Test with empty article** - Should handle gracefully
3. ✅ **Test with different article types** - General, Investment, Revenue Analysis
4. ✅ **Check TypeScript types** - Autocomplete should work perfectly
5. ✅ **Verify validation** - Invalid data should throw clear errors

## Performance

- **No performance impact** - Validation happens at OpenAI API level
- **Potentially faster** - Structured outputs may be more efficient than json_object mode
- **Better reliability** - Fewer retries needed due to malformed responses

## Conclusion

This migration provides:
- 🛡️ **Better type safety** with compile-time and runtime validation
- 🎯 **More reliable AI outputs** with enforced schemas
- 📝 **Self-documenting code** with field descriptions
- 🚀 **Future-proof architecture** ready for enhancements

All with **zero breaking changes** to the external API! 🎉
