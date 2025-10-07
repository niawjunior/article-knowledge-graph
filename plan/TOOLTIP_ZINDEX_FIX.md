# Tooltip Z-Index Fix

## Problem

When hovering over a node to show its tooltip/description, the tooltip was appearing **behind other nodes** instead of on top.

### Visual Issue
```
❌ Before:
Node A (hover) → Tooltip appears
Node B (nearby) → Covers the tooltip
Result: Can't read the tooltip
```

## Root Cause

The tooltip had `z-50` but the **parent container** didn't have a z-index, so it was still at the default stacking level (z-0). Other nodes at the same level would overlap it.

### Code Issue
```tsx
// ❌ Before
<div className="relative">  {/* No z-index! */}
  <div className="...">Node content</div>
  
  {showTooltip && (
    <div className="absolute z-50 ...">  {/* z-50 doesn't help */}
      Tooltip
    </div>
  )}
</div>
```

## Solution

Added dynamic z-index to the parent container that increases when hovering:

```tsx
// ✅ After
<div className={`relative ${showTooltip ? 'z-50' : 'z-0'}`}>
  <div className="...">Node content</div>
  
  {showTooltip && (
    <div className="absolute z-50 ...">
      Tooltip
    </div>
  )}
</div>
```

## How It Works

### Default State (Not Hovering)
```tsx
<div className="relative z-0">
  {/* Node at default stacking level */}
</div>
```

### Hover State (Showing Tooltip)
```tsx
<div className="relative z-50">
  {/* Entire node + tooltip elevated to z-50 */}
  <div className="absolute z-50 ...">
    Tooltip
  </div>
</div>
```

## Z-Index Stacking

### Before Fix
```
Layer 0: All nodes (default)
  ├─ Node A (z-0)
  │  └─ Tooltip (z-50) ← Still behind other nodes!
  ├─ Node B (z-0) ← Covers Node A's tooltip
  └─ Node C (z-0)
```

### After Fix
```
Layer 0: Default nodes (z-0)
  ├─ Node B (z-0)
  └─ Node C (z-0)

Layer 50: Hovered node (z-50)
  └─ Node A (z-50)
     └─ Tooltip (z-50) ← Now on top!
```

## Code Changes

### File: `/components/CustomNode.tsx`

**Before:**
```tsx
return (
  <div className="relative">
    <Handle type="target" position={targetPosition || Position.Top} />
    {/* ... */}
  </div>
);
```

**After:**
```tsx
return (
  <div className={`relative ${showTooltip ? 'z-50' : 'z-0'}`}>
    <Handle type="target" position={targetPosition || Position.Top} />
    {/* ... */}
  </div>
);
```

## Benefits

### ✅ **Tooltip Always Visible**
- Appears on top of all other nodes
- No more hidden tooltips
- Readable even in dense graphs

### 🎯 **Dynamic Stacking**
- Only elevates when needed (on hover)
- Doesn't affect layout when not hovering
- Minimal performance impact

### 🔄 **Smooth Transitions**
- Z-index changes instantly
- No visual glitches
- Clean hover experience

## Testing

### Test Case 1: Dense Graph
```
Scenario: Many nodes close together
Action: Hover over a node in the middle
Expected: Tooltip appears on top
Result: ✅ Tooltip visible above all nodes
```

### Test Case 2: Overlapping Nodes
```
Scenario: Two nodes partially overlapping
Action: Hover over the back node
Expected: Entire node + tooltip come to front
Result: ✅ Both node and tooltip elevated
```

### Test Case 3: Edge Cases
```
Scenario: Hover then move to another node quickly
Action: Rapid hover changes
Expected: Z-index updates correctly
Result: ✅ Smooth transitions, no stacking issues
```

## Alternative Solutions Considered

### Option 1: Portal (Rejected)
```tsx
// Use React Portal to render tooltip at document root
createPortal(<Tooltip />, document.body)
```
**Why not:**
- More complex
- Positioning becomes harder
- Overkill for this use case

### Option 2: Fixed z-50 (Rejected)
```tsx
<div className="relative z-50">
```
**Why not:**
- All nodes would be at z-50
- No stacking order between nodes
- Wastes z-index space

### Option 3: Dynamic z-index (✅ Chosen)
```tsx
<div className={`relative ${showTooltip ? 'z-50' : 'z-0'}`}>
```
**Why yes:**
- Simple and effective
- Only elevates when needed
- Clean and performant

## Z-Index Hierarchy

### Application Z-Index Levels
```
z-0:   Default nodes (not hovering)
z-10:  (Reserved for future use)
z-20:  (Reserved for future use)
z-30:  (Reserved for future use)
z-40:  (Reserved for future use)
z-50:  Hovered nodes + tooltips
z-60:  (Reserved for modals)
z-70:  (Reserved for dropdowns)
z-80:  (Reserved for notifications)
z-90:  (Reserved for overlays)
z-100: (Reserved for critical UI)
```

## Performance

### Impact
- **Minimal**: Only changes CSS class
- **No re-renders**: Just className update
- **No layout shift**: Z-index doesn't affect layout
- **Instant**: No transition delay

### Memory
- **No additional state**: Uses existing `showTooltip`
- **No extra DOM**: Same structure
- **Clean**: No memory leaks

## Accessibility

### Screen Readers
- Tooltip still accessible
- No impact on ARIA attributes
- Focus order unchanged

### Keyboard Navigation
- Tab order unaffected
- Z-index doesn't impact focus
- Still keyboard accessible

## Summary

### What Changed
- ✅ Added dynamic z-index to node container
- ✅ Elevates to z-50 when hovering
- ✅ Returns to z-0 when not hovering

### Result
Tooltips now:
- ✅ **Always visible** - Never hidden behind other nodes
- 🎯 **Smart stacking** - Only elevates when needed
- 🔄 **Smooth** - Clean hover experience
- 🚀 **Performant** - Minimal overhead

No more hidden tooltips! 🎉
