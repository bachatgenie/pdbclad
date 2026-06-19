# Phase 4 Testing Guide

## Quick Start
- **App URL**: http://localhost:3002
- **Login**: Use your test account (or register if first time)
- **Test Duration**: ~15-20 minutes for full walkthrough

---

## Test Scenario: Build a Real Project

### Step 1: Create a Project with Area Assignment
1. Go to **Projects** page
2. Click **+ New Project** button
3. Enter title: `"Build Personal Dashboard"`
4. Enter description: `"Create a life tracking app with gamification"`
5. Choose a color
6. Click **Create**
7. Now click the **detail button** (📄 icon) on the project card
8. In the detail panel, find **Area** dropdown
9. Select an area (e.g., "💼 Career" or "🚀 Side Hustle")
10. **Verify**: Area badge appears on the project card with emoji and name

### Step 2: Define Project Goals
1. In the detail panel, scroll to **Success Definition**
2. Click to edit and enter:
   ```
   A fully functional life dashboard where users can track todos, habits, 
   projects, and vault items with gamification (XP, levels, streaks, badges)
   ```
3. Click **Save**
4. Scroll to **First Step** field
5. Enter: `"Set up database schema and migrations"`
6. Click **Save**
7. **Verify**: A milestone is created for the first step
8. Add **Notes**: 
   ```
   Tech stack: Next.js, Tailwind, PostgreSQL, Prisma, NextAuth
   Deploy: Vercel
   ```

### Step 3: Use Planning Panel
1. Scroll down to **Planning** section
2. You should see 4 tabs: 📅 This Month, 📆 This Week, 📌 Today, ⚡ Right Now
3. Click the **⚡ Right Now** tab (default)
4. Click **+ Add milestone**
5. Enter: `"Design database schema"`
6. Click **Add**
7. Click **+ Add subtask** (below)
8. Enter: `"Draw ERD for todos and habits"`
9. Press Enter or click **+**
10. Add more subtasks:
    - `"Define user model fields"`
    - `"Plan authentication flow"`
11. **Verify**: Subtasks appear below the milestone with checkboxes

### Step 4: Complete Items & Track Progress
1. Click the **Today** tab
2. Add a milestone: `"Implement authentication"`
3. Add subtasks:
    - `"Set up NextAuth"`
    - `"Create login page"`
    - `"Add session management"`
4. Go back to **Right Now** tab
5. Check the box for `"Draw ERD for todos and habits"` subtask
6. **Verify**: 
   - ✅ Subtask is struck through
   - ✅ Progress bar increases
   - ✅ Check your XP bar (should increase by 10 XP)
7. Check the milestone: `"Design database schema"`
8. **Verify**:
   - ✅ Milestone shows as complete
   - ✅ Progress bar updates to ~50% (if only 1 milestone done)
   - ✅ XP bar increases by 50 XP

### Step 5: Switch Timeframes
1. Click **This Week** tab
2. Add a milestone: `"Implement Todos CRUD"`
3. Add subtasks under it
4. Move between tabs to see different views
5. **Verify**: Items persist and organize by timeframe

### Step 6: View "All Items" Section
1. Scroll down to **All Items** section
2. You should see all milestones and subtasks in a tree view
3. Check milestone and subtask completions here
4. **Verify**: 
   - Completed items are struck through
   - Tree structure shows milestones with nested subtasks
   - Progress percentage shown at top

### Step 7: Edit Project Details
1. Scroll back up to Success Definition
2. Click to edit and modify text
3. Click Save
4. Go to First Step and edit it
5. **Verify**: Changes are saved immediately and milestone title updates

---

## Detailed Feature Tests

### Test: Area Management
**What to verify:**
- [ ] Area dropdown shows all available areas (Home, Career, etc.)
- [ ] Selecting area saves immediately
- [ ] Area badge appears on project card with emoji
- [ ] Area badge shows color correctly
- [ ] Can change area in detail panel

**Steps:**
1. Open project detail panel
2. Try changing area to different options
3. Check project card to see badge update
4. Close and reopen panel to confirm it persists

### Test: Planning Panels
**What to verify:**
- [ ] All 4 tabs are clickable (This Month, This Week, Today, Right Now)
- [ ] Tab content changes when switching
- [ ] Can add milestones from each tab
- [ ] Can add subtasks from each tab
- [ ] Subtasks appear under their parent milestone
- [ ] Items can be moved to different timeframes

**Steps:**
1. Go through each tab
2. Add items to each timeframe
3. Click each item's checkbox to toggle completion
4. Watch progress bar update

### Test: Progress Calculation
**What to verify:**
- [ ] Progress bar shows correct percentage
- [ ] Formula: 50% milestones + 50% subtasks
- [ ] Progress updates when items completed
- [ ] Reaches 100% when all items done

**Example:**
- 2 milestones (1 completed = 50% × 0.5 = 25%)
- 4 subtasks (2 completed = 50% × 0.5 = 25%)
- Total = 50% progress ✓

### Test: Gamification (XP Rewards)
**What to verify:**
- [ ] Completing subtask awards 10 XP
- [ ] Completing milestone awards 50 XP
- [ ] XP bar increases visibly
- [ ] Activity appears in activity log (if visible)

**Steps:**
1. Note current XP before completing items
2. Complete several subtasks and milestones
3. Verify XP increases correctly:
   - 1 subtask = +10 XP
   - 1 milestone = +50 XP

### Test: Editable Fields
**What to verify:**
- [ ] Success Definition is editable
- [ ] First Step is editable and creates/updates milestone
- [ ] Notes field is editable
- [ ] Changes persist after closing panel

**Steps:**
1. Edit each field
2. Click Save
3. Close detail panel
4. Reopen project detail panel
5. Verify all changes are still there

### Test: Next Step Indicator
**What to verify:**
- [ ] Shows first incomplete milestone or subtask
- [ ] Updates when items are completed
- [ ] Displays in highlighted box at top

**Steps:**
1. Create a project with several milestones
2. Complete first milestone
3. Verify Next Step updates to show second milestone
4. Complete items and watch it update

---

## Potential Issues to Watch For

### Issue 1: Area Not Showing
**Test**: Create project → Assign area → Check card
**Fix**: Refresh page if area badge doesn't appear

### Issue 2: Progress Not Calculating
**Test**: Add 1 milestone, 1 subtask → Complete both → Check progress
**Expected**: Should show 100%
**Fix**: Check browser console for errors

### Issue 3: XP Not Increasing
**Test**: Complete subtask → Check XP bar
**Expected**: +10 XP
**Fix**: Check activity log in Dashboard home page

### Issue 4: Planning Panel Not Showing
**Test**: Open detail panel → Scroll to Planning section
**Expected**: Should see 4 tabs
**Fix**: Panel might need scroll - try scrolling within detail panel

### Issue 5: Subtasks Under Milestone
**Test**: Add milestone → Add subtask → Check tree view
**Expected**: Subtask should appear indented under milestone
**Fix**: May need to complete milestone first to see structure clearly

---

## Success Criteria

Phase 4 is working correctly if you can:

- ✅ Create projects and assign them to areas
- ✅ See area badges on project cards
- ✅ Open detail panel and edit all fields
- ✅ Create milestones and subtasks
- ✅ Toggle item completion with checkboxes
- ✅ Watch progress bar update (0-100%)
- ✅ Earn XP for completing items
- ✅ Switch between 4 timeframe tabs
- ✅ View all items in tree structure
- ✅ Changes persist after closing panel

If all of these work, **Phase 4 is production-ready!**

---

## Screenshots to Capture (Optional)
1. Projects page with area badges
2. Detail panel with all fields filled
3. Planning panel tabs with items
4. XP increase after completion
5. Progress bar at different percentages

---

## Troubleshooting

**App won't load?**
- Check http://localhost:3002
- Run `npm run dev` in terminal

**Database errors?**
- Check browser console (F12)
- Open Network tab to see failed requests

**Changes not saving?**
- Check console for error messages
- Try refreshing the page

**Detail panel not opening?**
- Click the 📄 icon on project card
- Not the edit ✏️ or delete 🗑️ buttons

---

## Time Breakdown
- **Setup & Create Project**: 2 min
- **Define Goals & Details**: 3 min
- **Planning Panel Walkthrough**: 5 min
- **Complete Items & Verify XP**: 3 min
- **Feature Tests**: 5-10 min
- **Troubleshooting (if needed)**: Variable

**Total**: ~15-20 minutes for comprehensive test

---

**Happy Testing! 🚀**

Report any issues or unexpected behavior and we can fix them immediately.
