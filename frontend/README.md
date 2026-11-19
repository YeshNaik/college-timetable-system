# College Timetable – Administration Portal (frontend)

React + Vite + TypeScript + Tailwind frontend for the Smart College Timetable Management & Teacher Substitution System.

## Run

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL to your Express API
npm run dev              # http://localhost:5173
npm run build            # type-check + production build
```

Your backend must allow CORS from `http://localhost:5173`.

## IMPORTANT: API contract is assumed

This frontend was written without access to the existing Express backend, so the endpoints, query
parameters and JSON field names below are **assumptions**. Nothing is mocked: every page calls the real API.
Where your routes differ, edit only `src/api/*.api.ts` (paths/params) and `src/types/index.ts` (field names).

Responses may be a bare JSON array/object or wrapped as `{ "data": ... }` (also `rows`/`items` for lists).
Errors should return `{ "message": "..." }`; timetable conflicts may also return `{ "message", "conflicts": ["..."] }`
(HTTP 400/409) and are shown to the user verbatim. Field names are MySQL-style snake_case.

| Area | Method & path | Notes |
|---|---|---|
| Dashboard | `GET /dashboard/summary` | `{ stats:{total_teachers,total_departments,total_courses,total_classrooms,todays_classes,teachers_on_leave,substitutions_assigned,pending_leaves}, today_timetable[], teachers_on_leave[], recent_substitutions[], pending_leaves[], weekly_distribution[{day,count}], department_distribution[{department_name,teacher_count}] }` |
| Departments | `GET/POST /departments`, `GET/PUT/DELETE /departments/:id` | list rows include `teacher_count`, `course_count`; `GET /teachers?department_id=`, `GET /courses?department_id=` used for details |
| Teachers | `GET/POST /teachers`, `GET/PUT/DELETE /teachers/:id` | joined `department_name` |
| | `GET /teachers/:id/courses`, `PUT /teachers/:id/courses` body `{course_ids:number[]}` | Teacher_Courses |
| | `GET /teachers/:id/timetable`, `/leaves`, `/substitutions` | profile tabs |
| | `GET /teachers/availability?date=YYYY-MM-DD` | rows: `teacher_id, teacher_name, department_name, qualified_courses[], scheduled_classes, on_leave, available_slots[]` |
| Courses | `GET/POST /courses`, `GET/PUT/DELETE /courses/:id`, `GET /courses/:id/teachers` | optional `teacher_count`, `teacher_names` |
| Classrooms | `GET/POST /classrooms`, `GET/PUT/DELETE /classrooms/:id` | classroom timetable uses `GET /timetable?classroom_id=` |
| Time slots | `GET/POST /time-slots`, `GET/PUT/DELETE /time-slots/:id` | `day_of_week, start_time, end_time` |
| Timetable | `GET/POST /timetable`, `GET/PUT/DELETE /timetable/:id` | filters: `teacher_id, department_id, classroom_id, section, semester, academic_year`; rows joined with `course_name, course_code, teacher_name, room_number, day_of_week, start_time, end_time, department_id` |
| Leaves | `GET/POST /leaves` (`?status=`), `GET /leaves/:id`, `PATCH /leaves/:id/approve`, `PATCH /leaves/:id/reject`, `GET /leaves/:id/affected-entries` | joined `teacher_name`; status `Pending/Approved/Rejected` |
| Substitutions | `GET /substitutions` | joined names, course, room, slot |
| | `GET /substitutions/affected?teacher_id=&date=` | timetable entries on that date |
| | `GET /substitutions/candidates?timetable_id=&date=` | `{teacher_id, teacher_name, department_name, qualified_course, is_available, existing_classes, is_eligible, reason}` – eligibility decided by the backend |
| | `POST /substitutions` body `{timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date}` | |
| | `PATCH /substitutions/:id/confirm`, `PATCH /substitutions/:id/cancel` | |
| Reports | `GET /reports/{workload,department-timetable,leaves,substitutions,frequent-substitutes,course-allocation}` | `from_date`/`to_date` sent for leaves, substitutions, frequent-substitutes. Any row shape works: columns are derived from the keys (keys ending `_id` are hidden) |
| Audit | `GET /audit` | `audit_id, substitution_id, action, action_description, performed_at` |
| Archive | `GET /archive` | `archive_id, substitution_id, timetable_id, absent_teacher_name, substitute_teacher_name, substitution_date, status, archived_at` |

If any of these do not exist in your backend, they are the backend changes required (notably `/dashboard/summary`,
`/teachers/availability`, `/substitutions/candidates`, `/substitutions/affected` and `/reports/*`).

## Known gaps

- No authentication: the project's auth (if any) was not visible, so the top-bar profile is a static
  "Administrator" label and every action is shown to every user. Add a token interceptor in `src/api/client.ts` when ready.
- No academic-year/semester selector in the top bar; semester and academic year are filters on the Timetable page.
- Lists are paginated, sorted and searched in the browser after one fetch (fine for college-sized data).
- Not yet exercised against a live backend, so first-run mismatches in field names are expected.
