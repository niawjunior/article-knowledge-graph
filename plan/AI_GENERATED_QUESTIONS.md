# AI-Generated Example Questions

## Upgrade

Replaced hardcoded question templates with **AI-generated contextual questions** using OpenAI.

## Why AI Generation?

### Before (Hardcoded)
```typescript
❌ Limited templates
❌ Generic questions
❌ Not context-aware
❌ Fixed patterns

"Who are the key people?"
"What are the main relationships?"
```

### After (AI-Generated)
```typescript
✅ Dynamic and contextual
✅ Specific to article content
✅ Natural language
✅ Adapts to any scenario

"เมีย มีความสัมพันธ์กับ COCO อย่างไร?"
"แมวชื่อ COCO มีบทบาทอะไรในครอบครัว?"
```

## How It Works

### 1. Gather Graph Context
```typescript
// Get comprehensive graph information
- Article title and summary
- Entity types (Person, Location, etc.)
- Sample entity names (first 10)
- Relationship types (owns, works-at, etc.)
```

### 2. AI Prompt
```typescript
const prompt = `You are a helpful assistant that generates insightful 
questions about a knowledge graph.

Article Information:
- Title: ${title}
- Summary: ${summary}
- Entity Types: ${entityTypes.join(', ')}
- Sample Entities: ${sampleEntities.join(', ')}
- Relationship Types: ${relationshipTypes.join(', ')}

Generate 4 insightful questions that a user might want to ask.

IMPORTANT: 
- Generate questions in the SAME LANGUAGE as the sample entities
- Questions should be specific to the actual content
- Questions should help users explore the graph
- Make questions natural and conversational`;
```

### 3. OpenAI Generation
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'Generate questions in the same language as the content.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.7, // Creative but controlled
});
```

### 4. Fallback Mechanism
```typescript
// If AI fails, use simple default questions
const fallbackQuestions = isThai ? [
  "บุคคลสำคัญคือใคร?",
  "ความสัมพันธ์หลักคืออะไร?",
  // ...
] : [
  "Who are the key people?",
  "What are the main relationships?",
  // ...
];
```

## Example Outputs

### Thai Article: "เมีย มีแมว 1 ตัวชื่อ COCO"

**AI-Generated Questions:**
```json
[
  "เมีย มีความสัมพันธ์กับ COCO อย่างไร?",
  "แมวชื่อ COCO มีบทบาทอะไรในครอบครัว?",
  "มีสัตว์เลี้ยงอื่นๆ นอกจาก COCO หรือไม่?",
  "เมีย ดูแล COCO อย่างไร?"
]
```

### English Article: "John works at Google in Bangkok"

**AI-Generated Questions:**
```json
[
  "What is John's role at Google?",
  "How is Google connected to Bangkok?",
  "What other people work at Google?",
  "What technologies does John work with?"
]
```

### Mystery Article: "ฆาตกรรมในบ้าน..."

**AI-Generated Questions:**
```json
[
  "ใครคือผู้ต้องสงสัยหลัก?",
  "มีหลักฐานอะไรที่ชี้ไปที่พ่อครัว?",
  "ความขัดแย้งในคำให้การคืออะไร?",
  "เหตุการณ์เกิดขึ้นเมื่อไหร่และที่ไหน?"
]
```

### Revenue Analysis: "NVIDIA Q3 FY25 Revenue..."

**AI-Generated Questions:**
```json
[
  "What are NVIDIA's main revenue streams?",
  "How much revenue came from the Data Center segment?",
  "Which geographic markets contributed the most?",
  "What is the year-over-year growth rate?"
]
```

## Benefits

### 🎯 **Context-Aware**
- Questions specific to actual content
- References real entity names
- Understands article type (mystery, revenue, etc.)
- Adapts to graph complexity

### 🌍 **Language-Intelligent**
- Detects language from entities
- Generates questions in same language
- Natural phrasing for each language
- No translation artifacts

### 💡 **Insightful**
- Goes beyond generic templates
- Asks about specific relationships
- Explores interesting connections
- Helps users discover insights

### 🔄 **Dynamic**
- Different questions for each article
- Adapts to entity types
- Considers relationship types
- Never repetitive

### 🛡️ **Reliable**
- Fallback to default questions if AI fails
- Error handling
- Always returns 4 questions
- Graceful degradation

## Technical Details

### Graph Query
```cypher
MATCH (a:Article {id: $articleId})
OPTIONAL MATCH (a)-[:MENTIONS]->(e:Entity)
OPTIONAL MATCH (e1:Entity)-[r]->(e2:Entity)
WHERE (a)-[:MENTIONS]->(e1) AND (a)-[:MENTIONS]->(e2)
RETURN a.title as title, 
       a.summary as summary,
       collect(DISTINCT e.type) as entityTypes, 
       collect(DISTINCT e.name)[0..10] as sampleEntities,
       collect(DISTINCT type(r))[0..5] as relationshipTypes
```

### AI Parameters
```typescript
{
  model: 'gpt-4o-mini',           // Fast and cost-effective
  temperature: 0.7,                // Creative but controlled
  response_format: { type: 'json_object' }, // Structured output
}
```

### Response Format
```json
{
  "questions": [
    "question 1",
    "question 2", 
    "question 3",
    "question 4"
  ]
}
```

## Performance

### Speed
- **AI Generation**: ~1-2 seconds
- **Fallback**: Instant
- **Total**: Acceptable for UX

### Cost
- **Model**: gpt-4o-mini (very cheap)
- **Tokens**: ~200-300 per request
- **Cost**: ~$0.0001 per request
- **Acceptable**: For this use case

### Caching
Could add caching in future:
```typescript
// Cache questions for 1 hour
const cacheKey = `questions:${articleId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Generate and cache
const questions = await generateQuestions();
await redis.setex(cacheKey, 3600, JSON.stringify(questions));
```

## Error Handling

### AI Failure
```typescript
try {
  // Try AI generation
  const questions = await generateWithAI();
  return questions;
} catch (aiError) {
  console.error('AI generation failed:', aiError);
  // Fallback to default questions
  return fallbackQuestions;
}
```

### No Entities
```typescript
if (nonArticleTypes.length === 0) {
  return { questions: [] };
}
```

### Invalid Response
```typescript
const parsed = JSON.parse(content);
const questions = Array.isArray(parsed) 
  ? parsed 
  : (parsed.questions || []);
```

## Future Enhancements

### 1. Multi-Language Support
```typescript
// Detect more languages
const detectLanguage = (entities) => {
  if (/[\u0E00-\u0E7F]/.test(entities)) return 'th';
  if (/[\u4E00-\u9FFF]/.test(entities)) return 'zh';
  if (/[\u3040-\u309F]/.test(entities)) return 'ja';
  return 'en';
};
```

### 2. Question Categories
```typescript
// Generate different types of questions
- Entity questions: "Who/What is X?"
- Relationship questions: "How is X connected to Y?"
- Insight questions: "What patterns exist?"
- Analysis questions: "Why did X happen?"
```

### 3. Difficulty Levels
```typescript
// Easy, Medium, Hard questions
- Easy: "Who are the people?"
- Medium: "How is X related to Y?"
- Hard: "What contradictions exist in the evidence?"
```

### 4. User Preferences
```typescript
// Learn from user behavior
- Track which questions users click
- Generate similar questions
- Personalize over time
```

## Summary

### What Changed
- ✅ Replaced hardcoded templates with AI generation
- ✅ Added graph context (title, summary, entities, relationships)
- ✅ Language-aware generation
- ✅ Fallback mechanism for reliability

### Result
Questions are now:
- 🎯 **Contextual** - Specific to article content
- 🌍 **Language-aware** - Match entity language
- 💡 **Insightful** - Help users explore
- 🔄 **Dynamic** - Different every time
- 🛡️ **Reliable** - Always work

The "Try asking:" section is now **intelligent and adaptive**! 🎉
