

# Fix: Audit Binder Button Overflow

**Problem:** The "Generate HRSA OSV Audit Binder" button text is too long and breaks out of the card container.

**Solution:** In `src/pages/PDSALab.tsx` around line 104-107, shorten the button text to "Generate OSV Binder" and add `shrink-0` to the icon for safety.

**Change:**
```tsx
// Before
<Button size="sm" className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => onGenerateBinder(cycle)}>
  <FileText className="h-3 w-3 mr-1" />
  Generate HRSA OSV Audit Binder
</Button>

// After
<Button size="sm" className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground whitespace-normal h-auto py-2" onClick={() => onGenerateBinder(cycle)}>
  <FileText className="h-3 w-3 mr-1 shrink-0" />
  Generate OSV Binder
</Button>
```

Single file edit, ~4 lines changed.

