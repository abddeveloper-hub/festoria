# FestFlow — Professional Fest Management Web App & Admin Panel

A modern, professional, fully responsive **Fest Management Web Application** engineered with a clean, executive aesthetic:
- **Plain white background throughout the application**
- Subtle light-grey borders and dividers
- Restrained shadows and typography
- Clean, consistent iconography (`lucide-react`)
- Pure client/server data modeling with reactive state, conflict detection, and server-side scoring algorithms

---

## Architecture & Navigation Sections

The application implements persistent desktop sidebar navigation and a collapsible mobile navigation menu featuring the 11 modules in exact required order:

1. **Dashboard / Total Analysis**:
   - 8 dynamic summary cards: Total Participants, Total Teams, Total Programmes, Total Judges, Completed Programmes, Upcoming Programmes, Pending Scores, Published Results.
   - Dynamic filters by Date, Category, Team/House, and Programme.
   - Dynamic Team Points Leaderboard and Progress completion bars.
   - Category participation distribution, upcoming schedule timetable, recent score submissions, and administrative activity audits.
   - Interactive navigation: clicking any summary card navigates directly to the filtered sub-page.

2. **Participants**:
   - Searchable, sortable, paginated directory with real-time text matching.
   - Filters by Team, Programme, Category (Junior, Senior, Sub-Junior, Open), and Status (Verified, Registered, Disqualified, Inactive).
   - Add, edit, view, and delete participants.
   - Assign participants to multiple eligible programmes.
   - CSV bulk import and export with duplicate detection.
   - Detailed participant profile drawer showing registrations and awarded results.

3. **Judges**:
   - Empanel and manage adjudicators and jurors.
   - Assign judges to competitions and track pending vs completed assignments.
   - Detailed judge dossier with contact info, area of expertise, and private internal notes.

4. **Programmes**:
   - Competition roster management with unique codes (e.g. `MUS-01`, `LIT-01`).
   - Dynamic criteria builder with customizable marks for each judging rubric.
   - Configure venue, stage, capacity, and individual vs. group event multipliers.
   - Clone/duplicate and cancel actions.

5. **Scores**:
   - Criteria-based evaluation sheets with boundary validation (0 to max marks).
   - Full status lifecycle: `Pending` &rarr; `Submitted` &rarr; `Reviewed` &rarr; `Approved` &rarr; `Published`.
   - Score revision history tracking who made edits, when, and prior totals.
   - Trusted result ratification engine: calculates average marks across judges, breaks ties, updates the public leaderboard, and awards points using configurable multipliers (2x on group events).

6. **Teams**:
   - House and college contingent management.
   - Configurable color identifiers while maintaining the strict white interface background.
   - Automatic team leaderboard computation with gold/silver/bronze breakdown and point rules.
   - Detailed contingent roster view.

7. **Schedule**:
   - Agenda list view and Timetable venue matrix view.
   - Automated conflict detection engine: detects overlapping bookings at the same venue, double-booked judges, and clashing participant registrations.
   - Filter by date, stage, venue, and status.
   - Print-ready schedule export.

8. **Users & Access Control (RBAC)**:
   - Role-based accounts: Super Admin, Admin, Programme Manager, Score Manager, Judge, Team Leader.
   - Link user accounts directly to judge records or team leadership profiles.
   - One-click role session switcher to test permission levels.
   - Password reset workflow and complete administrative audit trail.

9. **Public Page**:
   - Separate visitor-facing portal with plain white styling.
   - Welcome hero, about the fest, participating contingents, published timetable, live results, leaderboard standings, announcements bulletin, and approved photo gallery.
   - Quick one-click toggle between Public Website and Admin Portal.

10. **Reports & Exports**:
    - Dedicated reports covering all 8 sub-domains.
    - One-click CSV export for any dataset.
    - Clean print-friendly CSS layouts.

11. **Settings**:
    - Fest metadata, venue, edition, contact details, and timezone.
    - Configurable point allocation rules (1st, 2nd, 3rd, 4th, 5th, group multiplier).
    - Public visibility toggles and registration windows.
    - Broadcast announcement publisher.
    - One-click seed database reset.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom white theme design system and typography tokens
- **Icons**: Lucide React
- **Data Engine**: Reactive Context API with LocalStorage persistence and seed fallback

---

## Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
