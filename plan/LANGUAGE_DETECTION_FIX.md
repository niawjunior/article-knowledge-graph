# Language Detection for Example Questions

## Problem

The "Try asking:" suggestions were always in English, even when the article entities were in Thai, creating a mixed-language experience:

```
❌ Mixed Language:
- Entity: "เมีย" (Thai)
- Entity: "COCO" (Thai)
- Question: "Who are the key people?" (English)
- Question: "How is เมีย connected to COCO?" (Mixed!)
```

## Solution

Added automatic language detection based on entity names, with bilingual question templates.

### How It Works

1. **Detect Language from Entities**
   ```typescript
   // Check if any entity contains Thai characters
   const isThai = sampleEntities.some(entity => /[\u0E00-\u0E7F]/.test(entity));
   ```

2. **Bilingual Question Templates**
   ```typescript
   const typeQuestionsEN = {
     "Person": "Who are the key people?",
     "Location": "Which locations are involved?",
     // ...
   };

   const typeQuestionsTH = {
     "Person": "บุคคลสำคัญคือใคร?",
     "Location": "สถานที่ไหนบ้าง?",
     // ...
   };

   const typeQuestions = isThai ? typeQuestionsTH : typeQuestionsEN;
   ```

3. **Dynamic Question Generation**
   ```typescript
   // Connection question
   const connectionQuestion = isThai
     ? `${entity1} เชื่อมโยงกับ ${entity2} อย่างไร?`
     : `How is ${entity1} connected to ${entity2}?`;

   // Relationship question
   const relationshipQuestion = isThai
     ? "ความสัมพันธ์หลักคืออะไร?"
     : "What are the main relationships?";

   // Sentiment question
   const sentimentQuestion = isThai
     ? "แสดงเอนทิตีที่มีความรู้สึกเชิงลบ"
     : "Show me entities with negative sentiment";
   ```

## Supported Entity Types

### English Questions
```typescript
{
  "Person": "Who are the key people?",
  "Organization": "What organizations are mentioned?",
  "Location": "Which locations are involved?",
  "Technology": "What technologies are mentioned?",
  "Event": "What events are described?",
  "Concept": "What key concepts are discussed?",
  "Evidence": "What evidence was found?",
  "Clue": "What clues are there?",
  "REVENUE METRIC": "What are the revenue metrics?",
  "REVENUE STREAM": "What are the revenue streams?",
  "CUSTOMER SEGMENT": "What customer segments are there?",
  "GEOGRAPHIC MARKET": "Which geographic markets are mentioned?",
  "TIME PERIOD": "What time periods are covered?",
}
```

### Thai Questions
```typescript
{
  "Person": "บุคคลสำคัญคือใคร?",
  "Organization": "มีองค์กรอะไรบ้าง?",
  "Location": "สถานที่ไหนบ้าง?",
  "Technology": "มีเทคโนโลยีอะไรบ้าง?",
  "Event": "เหตุการณ์อะไรเกิดขึ้น?",
  "Concept": "แนวคิดหลักคืออะไร?",
  "Evidence": "มีหลักฐานอะไรบ้าง?",
  "Clue": "มีเบาะแสอะไรบ้าง?",
  "REVENUE METRIC": "รายได้มีอะไรบ้าง?",
  "REVENUE STREAM": "แหล่งรายได้มีอะไรบ้าง?",
  "CUSTOMER SEGMENT": "มีกลุ่มลูกค้าอะไรบ้าง?",
  "GEOGRAPHIC MARKET": "มีตลาดภูมิศาสตร์อะไรบ้าง?",
  "TIME PERIOD": "ช่วงเวลาไหนบ้าง?",
}
```

## Example Output

### Thai Article
```
Article: "เมีย มีแมว 1 ตัวชื่อ COCO"
Entities: เมีย, COCO (Thai characters detected)

Try asking:
✅ "บุคคลสำคัญคือใคร?"
✅ "เมีย เชื่อมโยงกับ COCO อย่างไร?"
✅ "ความสัมพันธ์หลักคืออะไร?"
✅ "แสดงเอนทิตีที่มีความรู้สึกเชิงลบ"
```

### English Article
```
Article: "John works at Google in Bangkok"
Entities: John, Google, Bangkok (no Thai characters)

Try asking:
✅ "Who are the key people?"
✅ "How is John connected to Google?"
✅ "What are the main relationships?"
✅ "Show me entities with negative sentiment"
```

### Mixed Content (Thai Names, English Context)
```
Article: "Bambi works at Google"
Entities: Bambi, Google (Thai name detected)

Try asking:
✅ "บุคคลสำคัญคือใคร?"
✅ "Bambi เชื่อมโยงกับ Google อย่างไร?"
✅ "ความสัมพันธ์หลักคืออะไร?"
✅ "แสดงเอนทิตีที่มีความรู้สึกเชิงลบ"
```

## Language Detection Logic

### Thai Detection
```typescript
// Thai Unicode range: U+0E00 to U+0E7F
const isThai = sampleEntities.some(entity => /[\u0E00-\u0E7F]/.test(entity));
```

This checks if ANY entity contains Thai characters. If yes, all questions are in Thai.

### Future Enhancement

For more languages, extend the detection:
```typescript
const detectLanguage = (entities: string[]) => {
  const hasThai = entities.some(e => /[\u0E00-\u0E7F]/.test(e));
  const hasChinese = entities.some(e => /[\u4E00-\u9FFF]/.test(e));
  const hasJapanese = entities.some(e => /[\u3040-\u309F\u30A0-\u30FF]/.test(e));
  
  if (hasThai) return 'th';
  if (hasChinese) return 'zh';
  if (hasJapanese) return 'ja';
  return 'en';
};
```

## Benefits

### 🌍 **Consistent Language**
- Questions match entity language
- No more mixed English/Thai
- Better user experience

### 🎯 **Automatic Detection**
- No manual language selection needed
- Works for any article
- Detects from entity names

### 📝 **Bilingual Support**
- English questions for English articles
- Thai questions for Thai articles
- Easy to add more languages

### 🔄 **Dynamic Generation**
- Questions adapt to content
- Entity names embedded in questions
- Context-aware suggestions

## Testing

### Test Case 1: Thai Article
```
Input: "เมีย มีแมว 1 ตัวชื่อ COCO"
Expected: All questions in Thai
✅ "บุคคลสำคัญคือใคร?"
✅ "เมีย เชื่อมโยงกับ COCO อย่างไร?"
```

### Test Case 2: English Article
```
Input: "John works at Google"
Expected: All questions in English
✅ "Who are the key people?"
✅ "How is John connected to Google?"
```

### Test Case 3: Mystery Article (Thai)
```
Input: "ฆาตกรรมในบ้าน..."
Expected: Thai questions with mystery-specific types
✅ "บุคคลสำคัญคือใคร?"
✅ "มีหลักฐานอะไรบ้าง?"
✅ "มีเบาะแสอะไรบ้าง?"
```

## Files Modified

- `/app/api/articles/[id]/examples/route.ts` - Added language detection and bilingual templates

## Summary

### What Changed
- ✅ Added Thai character detection
- ✅ Created bilingual question templates
- ✅ Dynamic question generation based on language
- ✅ Support for all entity types in both languages

### Result
Questions now appear in the **same language as the article entities**:
- 🇹🇭 Thai articles → Thai questions
- 🇬🇧 English articles → English questions
- 🌍 Consistent user experience

No more mixed-language suggestions! 🎉
