# Article Editor Feature

## Overview

Added ability to **view and edit** article raw content directly from the graph view, with automatic graph regeneration after saving.

## Features

### 1. View Article Content
- Click "View/Edit Article" button in graph view
- See article title, type, and full content
- Read-only mode by default

### 2. Edit Article
- Click "Edit Article" button
- Modify title and content
- Cancel to discard changes

### 3. Save & Regenerate
- Click "Save & Regenerate"
- Updates article in database
- Extracts new entities and relationships
- Regenerates entire graph
- Page refreshes to show updated graph

## Components

### ArticleEditor Component
**Location:** `/components/ArticleEditor.tsx`

**Features:**
- Modal dialog with full-screen overlay
- Two modes: View and Edit
- Loading states
- Error handling
- Save with regeneration

**Props:**
```typescript
interface ArticleEditorProps {
  articleId: string;
  onClose: () => void;
  onSave: () => void;
}
```

## API Endpoints

### GET `/api/articles/[id]`
Fetch article details

**Response:**
```json
{
  "id": "article-id",
  "title": "Article Title",
  "content": "Article content...",
  "articleType": "general",
  "createdAt": "2024-..."
}
```

### PATCH `/api/articles/[id]`
Update article and regenerate graph

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Process:**
1. Validate content
2. Extract new entities/relationships using AI
3. Delete old entities
4. Update article
5. Create new entities
6. Create new relationships

**Response:**
```json
{
  "success": true,
  "message": "Article updated and graph regenerated"
}
```

## User Flow

### Viewing Article
```
1. User clicks "View/Edit Article" button
2. Modal opens showing article details
3. User can read title, type, and content
4. Click "Close" to dismiss
```

### Editing Article
```
1. User clicks "View/Edit Article" button
2. Modal opens in view mode
3. User clicks "Edit Article"
4. Title and content become editable
5. User makes changes
6. Options:
   - Click "Cancel" to discard changes
   - Click "Save & Regenerate" to save
```

### Saving Changes
```
1. User clicks "Save & Regenerate"
2. Loading spinner shows
3. API updates article
4. AI extracts new entities/relationships
5. Graph is regenerated
6. Page refreshes
7. Updated graph displayed
```

## UI Elements

### Button in Graph View
```tsx
<button className="bg-green-600 text-white...">
  <FileEdit className="w-4 h-4" />
  View/Edit Article
</button>
```

**Location:** Top-left panel, after "Tell Me The Story" button

### Modal Dialog
- **Header:** Title with FileText icon
- **Content:** 
  - Title field (editable in edit mode)
  - Article Type (read-only)
  - Content textarea (editable in edit mode)
- **Footer:**
  - Close button
  - Edit/Cancel/Save buttons

## Technical Details

### State Management
```typescript
const [showArticleEditor, setShowArticleEditor] = useState(false);
```

### Regeneration Process
```typescript
onSave={() => {
  setShowArticleEditor(false);
  window.location.reload(); // Refresh to show updated graph
}}
```

### Database Operations
```cypher
// Delete old entities
MATCH (a:Article {id: $articleId})-[r:MENTIONS]->(e:Entity)
DETACH DELETE e

// Update article
MATCH (a:Article {id: $articleId})
SET a.title = $title,
    a.content = $content,
    a.summary = $summary,
    a.updatedAt = datetime()

// Create new entities
CREATE (e:Entity {...})
CREATE (a)-[:MENTIONS]->(e)

// Create new relationships
CREATE (from)-[r:RELATES_TO {...}]->(to)
```

## Example Usage

### View Article
```
1. Open graph view
2. Click "View/Edit Article"
3. Read article content
4. Click "Close"
```

### Fix Typo
```
1. Click "View/Edit Article"
2. Click "Edit Article"
3. Fix typo in content
4. Click "Save & Regenerate"
5. Wait for regeneration
6. See updated graph
```

### Change Article Focus
```
1. Click "View/Edit Article"
2. Click "Edit Article"
3. Rewrite content with different focus
4. Click "Save & Regenerate"
5. Graph shows new entities/relationships
```

## Benefits

### 🔍 **Transparency**
- See raw article content
- Understand what AI extracted from
- Verify source material

### ✏️ **Editability**
- Fix typos or errors
- Update outdated information
- Refine content for better extraction

### 🔄 **Regeneration**
- Automatic graph update
- No need to delete and recreate
- Preserves article ID

### 🎯 **Iterative Improvement**
- Test different phrasings
- See how changes affect graph
- Optimize for better extraction

## Error Handling

### Fetch Errors
```tsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    {error}
  </div>
)}
```

### Save Errors
- Shows error message
- Doesn't close modal
- User can retry

### Validation
- Content required
- Title optional
- Article type read-only

## Styling

### Modal
- Full-screen overlay with backdrop
- Centered dialog
- Max width: 4xl
- Max height: 90vh
- Scrollable content

### Buttons
- **View/Edit:** Green background
- **Edit:** Blue background
- **Save:** Blue with loading spinner
- **Cancel:** Gray text
- **Close:** Hover effect

### Form Fields
- **View mode:** Gray background, read-only
- **Edit mode:** White background, editable
- **Content:** Monospace font for code-like appearance

## Future Enhancements

### 1. Version History
```typescript
// Track article versions
interface ArticleVersion {
  version: number;
  content: string;
  createdAt: Date;
}
```

### 2. Diff View
```tsx
// Show what changed
<DiffViewer
  oldContent={originalContent}
  newContent={editedContent}
/>
```

### 3. Auto-save Draft
```typescript
// Save draft every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    saveDraft(editedContent);
  }, 30000);
  return () => clearInterval(interval);
}, [editedContent]);
```

### 4. Collaborative Editing
```typescript
// Real-time collaboration
const { content, updateContent } = useCollaboration(articleId);
```

## Summary

### What Was Added
- ✅ ArticleEditor component
- ✅ GET /api/articles/[id] endpoint
- ✅ PATCH /api/articles/[id] endpoint
- ✅ "View/Edit Article" button in graph
- ✅ Modal with view/edit modes
- ✅ Automatic graph regeneration

### Result
Users can now:
- 📖 **View** article raw content
- ✏️ **Edit** title and content
- 💾 **Save** changes
- 🔄 **Regenerate** graph automatically
- 🎯 **Iterate** on content for better graphs

Perfect for refining articles and improving knowledge graph quality! 📝✨
