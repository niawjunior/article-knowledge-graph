# Zod Schema for Question Generation

## Update

Converted AI question generation from manual JSON parsing to **Zod-based structured outputs** for better type safety and validation.

## Before vs After

### ❌ Before (Manual JSON Parsing)
```typescript
const completion = await openai.chat.completions.create({
  response_format: { type: 'json_object' },
  // ...
});

const content = completion.choices[0].message.content;
const parsed = JSON.parse(content); // ⚠️ No validation!
const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
```

**Problems:**
- No type validation
- Manual parsing
- Unpredictable structure
- Error-prone

### ✅ After (Zod Structured Output)
```typescript
const QuestionsSchema = z.object({
  questions: z.array(z.string()).length(4).describe('Array of exactly 4 questions'),
});

const completion = await openai.beta.chat.completions.parse({
  response_format: zodResponseFormat(QuestionsSchema, 'questions'),
  // ...
});

const parsed = completion.choices[0].message.parsed; // ✅ Validated!
```

**Benefits:**
- Type-safe
- Automatic validation
- Guaranteed structure
- Reliable

## Zod Schema Definition

```typescript
const QuestionsSchema = z.object({
  questions: z
    .array(z.string())
    .length(4)
    .describe('Array of exactly 4 insightful questions about the knowledge graph'),
});
```

### Schema Breakdown

1. **Object Structure**
   ```typescript
   z.object({ ... })
   ```
   Ensures response is an object

2. **Questions Array**
   ```typescript
   questions: z.array(z.string())
   ```
   - Field name: `questions`
   - Type: Array of strings
   - Each item must be a string

3. **Exact Length**
   ```typescript
   .length(4)
   ```
   - Must have exactly 4 questions
   - Not 3, not 5, exactly 4

4. **Description**
   ```typescript
   .describe('...')
   ```
   - Helps AI understand the requirement
   - Improves generation quality

## API Usage

### OpenAI Beta API
```typescript
const completion = await openai.beta.chat.completions.parse({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: zodResponseFormat(QuestionsSchema, 'questions'),
  temperature: 0.7,
});
```

**Key Points:**
- Use `openai.beta.chat.completions.parse()` (not `create()`)
- Pass Zod schema via `zodResponseFormat()`
- Second parameter is the name: `'questions'`

### Accessing Parsed Data
```typescript
const parsed = completion.choices[0].message.parsed;

if (!parsed || !parsed.questions) {
  throw new Error('Failed to parse questions from OpenAI');
}

return { questions: parsed.questions };
```

**Type Safety:**
- `parsed` is typed as `z.infer<typeof QuestionsSchema>`
- TypeScript knows `parsed.questions` is `string[]`
- Autocomplete works perfectly

## Validation Examples

### ✅ Valid Response
```json
{
  "questions": [
    "บุคคลสำคัญคือใคร?",
    "ความสัมพันธ์หลักคืออะไร?",
    "เมีย เชื่อมโยงกับ COCO อย่างไร?",
    "มีเอนทิตีอื่นๆ อีกไหม?"
  ]
}
```
✅ Passes validation:
- Has `questions` field
- Is an array
- Contains 4 strings
- Returns successfully

### ❌ Invalid Response: Wrong Count
```json
{
  "questions": [
    "question 1",
    "question 2"
  ]
}
```
❌ Fails validation:
- Only 2 questions (needs 4)
- Zod throws error
- Falls back to default questions

### ❌ Invalid Response: Wrong Type
```json
{
  "questions": [
    "question 1",
    123,
    "question 3",
    "question 4"
  ]
}
```
❌ Fails validation:
- Second item is number (needs string)
- Zod throws error
- Falls back to default questions

### ❌ Invalid Response: Missing Field
```json
{
  "items": ["question 1", "question 2", "question 3", "question 4"]
}
```
❌ Fails validation:
- Field is `items` not `questions`
- Zod throws error
- Falls back to default questions

## Error Handling

### Validation Failure
```typescript
try {
  const completion = await openai.beta.chat.completions.parse({
    response_format: zodResponseFormat(QuestionsSchema, 'questions'),
    // ...
  });

  const parsed = completion.choices[0].message.parsed;
  
  if (!parsed || !parsed.questions) {
    throw new Error('Failed to parse questions');
  }

  return { questions: parsed.questions };
} catch (aiError) {
  console.error('AI generation failed:', aiError);
  
  // Fallback to default questions
  return { questions: fallbackQuestions };
}
```

### Graceful Degradation
```typescript
// If AI fails, use simple defaults
const fallbackQuestions = isThai ? [
  "บุคคลสำคัญคือใคร?",
  "ความสัมพันธ์หลักคืออะไร?",
  `${sampleEntities[0]} เชื่อมโยงกับ ${sampleEntities[1] || 'อื่นๆ'} อย่างไร?`,
  "แสดงเอนทิตีที่สำคัญ",
] : [
  "Who are the key people?",
  "What are the main relationships?",
  `How is ${sampleEntities[0]} connected to ${sampleEntities[1] || 'others'}?`,
  "Show me important entities",
];
```

## Benefits

### 🛡️ **Type Safety**
```typescript
// TypeScript knows the exact type
const parsed: {
  questions: string[];
} = completion.choices[0].message.parsed;

// Autocomplete works
parsed.questions.map(q => q.toUpperCase());
```

### ✅ **Validation**
- OpenAI API enforces schema
- Invalid responses rejected
- No manual checking needed

### 📝 **Self-Documenting**
```typescript
.describe('Array of exactly 4 insightful questions')
// Description helps AI understand requirement
```

### 🔒 **Guaranteed Structure**
- Always get `{ questions: string[] }`
- Always exactly 4 questions
- No surprises

### 🚀 **Better AI Output**
- Schema guides AI generation
- More consistent results
- Fewer errors

## Comparison with Entity Extraction

This follows the same pattern as entity extraction:

### Entity Extraction (from openai.ts)
```typescript
const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([...]),
  // ...
});

const ExtractedDataSchema = z.object({
  summary: z.string(),
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
});
```

### Question Generation (this file)
```typescript
const QuestionsSchema = z.object({
  questions: z.array(z.string()).length(4),
});
```

**Consistent Architecture** across the codebase! 🎨

## Testing

### Test Case 1: Valid Generation
```typescript
Input: Thai article with entities
Expected: 4 Thai questions
Result: ✅ Validated and returned
```

### Test Case 2: Invalid Generation
```typescript
Input: Article with entities
AI Returns: Only 2 questions
Result: ❌ Validation fails → Fallback used
```

### Test Case 3: AI Error
```typescript
Input: Article with entities
AI: Network error
Result: ❌ Catch error → Fallback used
```

## Summary

### What Changed
- ✅ Added Zod schema for questions
- ✅ Using `openai.beta.chat.completions.parse()`
- ✅ Automatic validation
- ✅ Type-safe parsing
- ✅ Consistent with entity extraction

### Result
Question generation now has:
- 🛡️ **Type safety** - Compile-time + runtime
- ✅ **Validation** - Schema enforced
- 📝 **Documentation** - Self-describing
- 🔒 **Reliability** - Guaranteed structure
- 🚀 **Quality** - Better AI output

**Consistent Zod usage across the entire codebase!** 🎉
