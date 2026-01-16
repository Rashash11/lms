# API Response Format Audit

## Standard Format
All APIs using `apiResponse()` return:
```typescript
{
  data: T,
  pagination?: { page, limit, total, totalPages }
}
```

## Issues Found

### Frontend expecting old formats:
- `data.users` instead of `data.data`
- `data.courses` instead of `data.data`  
- `data.groups` instead of `data.data`
- `data.skills` instead of `data.data`
- `data.paths` instead of `data.data`
- `data.categories` instead of `data.data`
- `data.assignments` instead of `data.data`

### Files to Fix:

**Admin Pages:**
1. `admin/assignments/page.tsx` - line 83: `data.courses`
2. `admin/groups/page.tsx` - lines 46-52: `data.groups`
3. `admin/courses/page.tsx` - line 67: `data.courses`
4. `admin/courses/[id]/UserEnrollmentDialog.tsx` - line 54: `data.users`
5. `admin/learning-paths/[id]/edit/page.tsx` - line 98: `data.courses`
6. `admin/learning-paths/[id]/edit/page-new.tsx` - line 75: `data.courses`
7. `admin/learning-paths/[id]/edit/components/LearningPathOptionsPanel.tsx` - line 85: `data.categories`
8. `admin/learning-paths/[id]/edit/components/UsersPanel.tsx` - line 81: `data.users`

**Super Instructor Pages:**
9. `(super-instructor)/super-instructor/users/page.tsx` - line 65: `data.users`
10. `(super-instructor)/super-instructor/groups/page.tsx` - line 41: `data.groups`
11. `(super-instructor)/super-instructor/courses/page.tsx` - line 41: `data.courses`
12. `(super-instructor)/super-instructor/assignments/page.tsx` - line 57: `data.courses`
13. `(super-instructor)/super-instructor/learning-paths/[id]/edit/page.tsx` - line 98: `data.courses`
14. `(super-instructor)/super-instructor/learning-paths/[id]/edit/page-new.tsx` - line 75: `data.courses`
15. `(super-instructor)/super-instructor/learning-paths/[id]/edit/components/LearningPathOptionsPanel.tsx` - line 85: `data.categories`
16. `(super-instructor)/super-instructor/learning-paths/[id]/edit/components/UsersPanel.tsx` - line 81: `data.users`

**Instructor Pages:**
17. `(instructor)/instructor/page.tsx` - lines 51-53: `data.courses`
18. `(instructor)/instructor/courses/page.tsx` - line 60: `data.courses`
19. `(instructor)/instructor/groups/page.tsx` - lines 46-47: `data.groups`
20. `(instructor)/instructor/skills/page.tsx` - lines 86-88: `data.skills`
21. `(instructor)/instructor/learning-paths/page.tsx` - line 55: `data.paths`
22. `(instructor)/instructor/assignments/page.tsx` - line 77: `data.courses`

**Learner Pages:**
23. `(learner)/learner/catalog/page.tsx` - lines 52-53: `data.courses`, `data.categories`

## Fix Strategy
Replace all instances of:
- `data.users` → `data.data`
- `data.courses` → `data.data`
- `data.groups` → `data.data`
- `data.skills` → `data.data`
- `data.paths` → `data.data`
- `data.categories` → `data.data`
- `data.assignments` → `data.data`

Keep fallback patterns like:
- `Array.isArray(data) ? data : (data.data || [])`
