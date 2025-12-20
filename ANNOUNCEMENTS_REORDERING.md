# Announcements Reordering Implementation

## Overview
Admin-only drag-and-drop reordering for announcements has been implemented. Members view announcements in the saved order but cannot reorder them.

## Database Changes

### Migration SQL
Run `add-announcements-order-index.sql` in Supabase SQL Editor:

1. **Adds `order_index` column** to announcements table
2. **Backfills existing announcements** - newest announcements get order_index 0, next gets 1, etc.
3. **Creates index** for performance
4. **Updates RLS policies** (maintains current pattern - security enforced in API routes)

### Column Details
- `order_index INTEGER NOT NULL DEFAULT 0`
- Indexed for fast sorting
- Defaults to 0 for new announcements

## API Changes

### Updated Routes
1. **GET /api/admin/announcements** - Now orders by `order_index ASC, created_at DESC`
2. **GET /api/member/announcements** - Now orders by `order_index ASC, created_at DESC`

### New Route
**PUT /api/admin/announcements/reorder**
- Admin-only endpoint (verifies `members.role = 'admin'`)
- Accepts: `{ announcementIds: string[], userId: string }`
- Updates `order_index` for all announcements in the new order
- Returns success/error response

## Admin UI Changes

### Drag-and-Drop Reordering
- **Location**: `/admin/announcements`
- **How it works**:
  1. Drag the grip icon (⋮⋮) on the left of each announcement row
  2. Drop to reorder
  3. Order saves automatically
  4. Shows "Saving order..." indicator during save
  5. Reverts on error with error message

### Features
- ✅ Visual drag handle (grip icon)
- ✅ Optimistic UI updates (instant feedback)
- ✅ Automatic persistence to database
- ✅ Error handling with rollback
- ✅ Loading states
- ✅ Keyboard accessible (arrow keys)

### UI Elements
- Drag handle column added to table
- "Saving order..." banner during save
- Help text at bottom: "💡 Drag the grip icon (⋮⋮) to reorder announcements..."

## Member Side

### No Changes Required
- Members already use `/api/member/announcements` which now orders by `order_index`
- No reorder UI shown to members
- Members see announcements in admin-defined order automatically

## Security

### Admin Verification
- API route `/api/admin/announcements/reorder` verifies:
  1. User exists in `members` table
  2. User has `role = 'admin'`
  3. Returns 403 if not admin

### RLS Policies
- SELECT: All authenticated users can view
- UPDATE: Allowed (admin check in API routes)
- Security primarily enforced in API layer (current pattern)

## Testing Checklist

### Admin Testing
- [ ] Go to `/admin/announcements`
- [ ] Drag an announcement to a new position
- [ ] Verify "Saving order..." appears
- [ ] Refresh page - order should persist
- [ ] Drag multiple announcements - all should save correctly
- [ ] Verify error handling (disconnect network, should show error)

### Member Testing
- [ ] Go to `/member/home` (or member dashboard)
- [ ] Verify announcements appear in admin-defined order
- [ ] Verify no drag handles or reorder controls visible
- [ ] Verify announcements update when admin reorders them

### Security Testing
- [ ] Try to call `/api/admin/announcements/reorder` as non-admin (should fail)
- [ ] Verify members cannot update `order_index` directly

## Files Changed

1. **Database Migration**
   - `add-announcements-order-index.sql` (NEW)

2. **API Routes**
   - `src/app/api/admin/announcements/route.ts` (updated ordering)
   - `src/app/api/member/announcements/route.ts` (updated ordering)
   - `src/app/api/admin/announcements/reorder/route.ts` (NEW)

3. **Admin UI**
   - `src/app/admin/announcements/page.tsx` (added drag-and-drop)

4. **Dependencies**
   - `package.json` (added @dnd-kit packages)

## Dependencies Added

```json
{
  "@dnd-kit/core": "^latest",
  "@dnd-kit/sortable": "^latest",
  "@dnd-kit/utilities": "^latest"
}
```

## Next Steps

1. **Run Migration**: Execute `add-announcements-order-index.sql` in Supabase
2. **Test**: Verify drag-and-drop works for admins
3. **Verify**: Check member side shows correct order

## Notes

- New announcements default to `order_index = 0` (appear first)
- If multiple announcements have same `order_index`, they're sorted by `created_at DESC`
- Drag-and-drop uses `@dnd-kit` library (modern, accessible, performant)
- Order persists immediately on drag end
- Error handling reverts to previous order if save fails

