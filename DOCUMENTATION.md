# CampusCare — Project Documentation

> Milestone 2 · INCS 617  
> Sections 4.2 API Documentation · 4.3 Database Schema · 4.4 Setup Guide · 4.5 Project Structure

---

## Table of Contents

1. [4.2 API Documentation](#42-api-documentation)
2. [4.3 Database Schema Documentation](#43-database-schema-documentation)
3. [4.4 Setup & Installation Guide](#44-setup--installation-guide)
4. [4.5 Project Structure Overview](#45-project-structure-overview)

---

# 4.2 API Documentation

> Base URL: `http://localhost:3000/api`  
> All protected endpoints require `Authorization: Bearer <token>` in the request header.  
> Detailed endpoint reference: [`API.md`](./API.md)

---

## Authentication & Role Permissions

| Role | Description |
|---|---|
| `Community Member` | Reports issues, comments, verifies resolutions |
| `Worker` | Receives assigned tasks, submits completion evidence |
| `Facility Manager` | Assigns/manages issues, reviews completions |
| `Admin` | User management, approvals, activation control, role management, and category management |

---

## 4.2.1 Auth Endpoints (`/api/auth`)

### POST `/api/auth/register`

Creates a new user account.

**Authentication:** None required

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required) — must be a university email",
  "password": "string (required) — min 6 characters",
  "role": "string (optional) — 'Community Member' | 'Worker' | 'Facility Manager' — defaults to 'Community Member'"
}
```

**Example Request:**
```json
{
  "name": "Sara Ahmed",
  "email": "sara@giu-uni.de",
  "password": "password123",
  "role": "Community Member"
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 12,
    "name": "Sara Ahmed",
    "email": "sara@giu-uni.de",
    "role": "Community Member",
    "isActive": true,
    "isVerified": true,
    "points": 0,
    "actsOfServicePoints": 0
  }
}
```

> **Note:** Worker and Facility Manager registrations set isVerified: false and require Admin approval before accessing the system. Community Member accounts are automatically verified upon registration.

**Error Responses:**

| Status | Error | Cause |
|---|---|---|
| 400 | `"Name, email, and password are required"` | Missing fields |
| 400 | `"Invalid email format"` | Malformed email |
| 400 | `"Registration requires an official university email address"` | Non-university domain |
| 409 | `"Email already in use"` | Duplicate email |
| 500 | Server error message | Unexpected server error |

---

### POST `/api/auth/login`

Authenticates a user and returns a JWT access token.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Example Request:**
```json
{
  "email": "sara@giu-uni.de",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 12,
    "name": "Sara Ahmed",
    "email": "sara@giu-uni.de",
    "role": "Community Member",
    "isActive": true,
    "isVerified": true,
    "points": 50,
    "actsOfServicePoints": 10
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

**Error Responses:**

| Status | Code | Cause |
|---|---|---|
| 400 | — | Email or password missing |
| 401 | — | Wrong credentials |
| 403 | `ACCOUNT_INACTIVE` | Admin deactivated the account |
| 403 | `ACCOUNT_NOT_VERIFIED` | Worker/Manager pending approval |

---

### POST `/api/auth/logout`

Revokes the current JWT token (server-side token blocklist).

**Authentication:** Required (any role)

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{ "message": "Logout successful" }
```

---

### GET `/api/auth/me`

Returns the authenticated user's profile, including points.

**Authentication:** Required (any role)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Sara Ahmed",
    "email": "sara@giu-uni.de",
    "role": "Community Member",
    "isActive": true,
    "isVerified": true,
    "actsOfServicePoints": 10,
    "points": 50
  }
}
```

---


### POST `/api/auth/forgot-password`

Generates a password reset token (valid for 15 minutes). For development, the token is returned in the response body.

**Request Body:** `{ "email": "string" }`

**Success Response (200):**
```json
{
  "message": "Password reset token generated",
  "resetToken": "a3f2e1d4c5b6..."
}
```

---

### POST `/api/auth/reset-password`

Resets the user's password using a valid reset token.

**Request Body:** `{ "token": "string", "newPassword": "string (min 6 chars)" }`

**Success Response (200):** `{ "message": "Password reset successful" }`

---

## 4.2.2 Issue Endpoints (`/api/issues`)

### GET `/api/issues`

Returns issues based on the authenticated user's role:
- `Community Member` → their own issues only
- `Worker` → issues assigned to them
- `Facility Manager`→ all issues

**Authentication:** Required (any role)

**Query Parameters (optional):**

| Parameter | Type | Description |
|---|---|---|
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `category` | string | Filter by category |
| `building` | string | Filter by building |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Results per page (default: 20) |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "title": "Broken elevator",
      "description": "The main elevator on floor 3 is stuck",
      "status": "Assigned",
      "category": "Elevator",
      "location": "Building A, Floor 3, Room 301",
      "building": "Building A",
      "floor": "3",
      "room": "301",
      "priority": "High",
      "image": "https://supabase.io/storage/v1/object/...",
      "createdAt": "2026-05-10T09:00:00.000Z",
      "updatedAt": "2026-05-11T10:30:00.000Z",
      "userId": 12,
      "assignedTo": 5,
      "completionPhotoUrl": null,
      "completionNote": null,
      "rejectionReason": null,
      "resolvedAt": null,
      "user": { "id": 12, "name": "Sara Ahmed" },
      "assignedWorker": { "id": 5, "name": "Omar Khaled" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1 }
}
```

---

### POST `/api/issues`

Creates a new issue report. Supports multipart/form-data for image upload.

**Authentication:** Required (Community Member)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Short title (max 100 chars) |
| `description` | string | Yes | Detailed description |
| `category` | string | Yes | Issue category |
| `building` | string | Yes | Building name/code |
| `floor` | string | Yes | Floor number |
| `room` | string | Yes | Room number/label |
| `image` | file | No | Photo of the issue (jpg/png) |

**Example Request (curl):**
```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Authorization: Bearer <token>" \
  -F "title=Broken elevator" \
  -F "description=The main elevator on floor 3 is stuck" \
  -F "category=Elevator" \
  -F "building=Building A" \
  -F "floor=3" \
  -F "room=301" \
  -F "image=@photo.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "title": "Broken elevator",
    "status": "Submitted/Pending",
    "priority": "Normal",
    "createdAt": "2026-05-10T09:00:00.000Z"
  }
}
```

---

### GET `/api/issues/:id`

Returns a single issue with full details including comments and completion attempts.

**Authentication:** Required (any role)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "title": "Broken elevator",
    "status": "Under Review",
    "completionPhotoUrl": "https://supabase.io/storage/v1/object/...",
    "completionNote": "Replaced the control board",
    "rejectionReason": null,
    "comments": [
      {
        "id": 3,
        "text": "I can confirm this is fixed",
        "createdAt": "2026-05-12T11:00:00.000Z",
        "user": { "id": 12, "name": "Sara Ahmed", "role": "Community Member" }
      }
    ]
  }
}
```

---

### POST `/api/issues/:id/comments`

Adds a comment to an issue.

**Authentication:** Required (any role)

**Request Body:** `{ "text": "string (required)" }`

**Success Response (201):**
```json
{
  "success": true,
  "data": { "id": 3, "text": "Noted, we'll look into it", "createdAt": "..." }
}
```

---

### PATCH `/api/issues/:id/verify`

after the issue has been marked as Resolved by Facility Management to allow the original reporter to confirm satisfaction with the resolution.

When verification is successful, the verifiedBy field stores the ID of the Community Member who confirmed the resolution.

**Authentication:** Required (Community Member — must own the issue)

**Success Response (200):** `{ "success": true, "message": "Issue verified as resolved" }`

---

### POST `/api/issues/:id/completion-photo`

Worker submits a completion photo and note. Transitions issue to `Under Review`. Creates a `CompletionAttempt` record.

**Authentication:** Required (Worker — must be assigned to the issue)

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `photo` | file | No |
| `completionNote` | string | No |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Completion photo uploaded",
  "data": { "status": "Under Review", "completionPhotoUrl": "https://..." }
}
```

---

## 4.2.3 Manager Endpoints (`/api/manager`)

All endpoints require **Facility Manager or Admin** role.

### GET `/api/manager/issues`

Returns all issues with full user/worker details. Supports query filters: `status`, `priority`, `category`, `building`, `search`.

**Success Response (200):** Array of issue objects (same shape as `/api/issues` but all records).

---

### PATCH `/api/manager/issues/:id/assign`

Assigns a worker to an issue. Transitions status to `Assigned`.

**Request Body:** `{ "workerId": number }`

**Success Response (200):**
```json
{ "success": true, "message": "Issue assigned to worker" }
```

---

### PATCH `/api/manager/issues/:id/priority`

Updates the priority of an issue.

**Request Body:** `{ "priority": "Low" | "Normal" | "High" | "Urgent" }`

**Success Response (200):** `{ "success": true, "message": "Priority updated" }`

---

### PATCH `/api/manager/issues/:id/approve`

Approves a worker's completion submission. Transitions issue to `Resolved`. Awards points to the worker.

**Success Response (200):** `{ "success": true, "message": "Issue resolved" }`

---

### PATCH `/api/manager/issues/:id/reject`

Rejects an issue (closes it permanently).

**Request Body:** `{ "reason": "string (required)" }`

**Success Response (200):** `{ "success": true, "message": "Issue rejected" }`

---

### PATCH `/api/manager/issues/:id/rework`

Sends a completion submission back to the worker for rework.

**Request Body:** `{ "reason": "string (required)" }`

**Success Response (200):** `{ "success": true, "message": "Issue sent back for rework" }`

---

### GET `/api/manager/workers`

Returns all users with role `Worker`.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 5, "name": "Omar Khaled", "email": "omar@giu-uni.de", "points": 120, "isVerified": true }
  ]
}
```

---

### GET `/api/manager/analytics`

Returns dashboard analytics data. All metrics are computed from live database data.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIssues": 84,
    "resolvedIssues": 41,
    "pendingIssues": 23,
    "rejectedIssues": 5,
    "assignedIssues": 10,
    "inProgressIssues": 3,
    "underReviewIssues": 2,
    "resolutionRate": 48,
    "avgResolutionDays": 3.2,
    "reworkCount": 8,
    "issuesByCategory": [
      { "category": "Elevator", "count": 12 }
    ],
    "issuesByBuilding": [
      { "building": "Building A", "count": 30 }
    ],
    "workerPerformance": [
      { "workerId": 5, "workerName": "Omar Khaled", "resolved": 15, "inProgress": 2, "points": 120 }
    ],
    "monthlyTrends": [
      { "month": "2026-01", "submitted": 10, "resolved": 7 }
    ]
  }
}
```

---

### GET `/api/manager/issues/:id/completion-attempts`

Returns all completion attempt records for an issue (full rework history).

**Success Response (200):**
```json
[
  {
    "id": 1,
    "issueId": 7,
    "workerId": 5,
    "photoUrl": "https://...",
    "note": "Replaced fuse",
    "createdAt": "2026-05-11T09:00:00.000Z",
    "worker": { "id": 5, "name": "Omar Khaled" }
  }
]
```

---

## 4.2.4 Admin Endpoints (`/api/admin`)

All endpoints require **Admin** role.

### GET `/api/admin/users`

Returns all users. Supports `?role=` and `?isVerified=` query filters.

**Success Response (200):**
```json
{ "success": true, "data": [ { "id": 1, "name": "...", "role": "Worker", "isVerified": false } ] }
```

---

### PATCH `/api/admin/users/:id`

Updates a user's role, active status, or verified status.

**Request Body (any subset):**
```json
{
  "role": "Community Member | Worker | Facility Manager | Admin",
  "isActive": true,
  "isVerified": true
}
```

**Success Response (200):** `{ "success": true, "data": { ...updatedUser } }`

---

### DELETE `/api/admin/users/:id`

Permanently deletes a user account.

**Success Response (200):** `{ "success": true, "message": "User deleted" }`

---

### GET `/api/admin/categories`

Returns all issue categories.

**Success Response (200):**
```json
{ "success": true, "data": ["Elevator", "Plumbing", "Electrical", "HVAC", "Structural", "Cleaning", "IT", "Other"] }
```

---

### POST `/api/admin/categories`

Adds a new category.

**Request Body:** `{ "name": "string" }`

**Success Response (201):** `{ "success": true, "data": [...updatedList] }`

---

### DELETE `/api/admin/categories/:name`

Removes a category by name.

**Success Response (200):** `{ "success": true, "data": [...updatedList] }`

---

## 4.2.5 User / Leaderboard Endpoints (`/api/users`)

### GET `/api/users/leaderboard`

Returns all users sorted by total points (descending).

**Authentication:** Required (any role)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 5, "name": "Omar Khaled", "role": "Worker", "points": 120, "actsOfServicePoints": 40 }
  ]
}
```

---

### GET `/api/users/leaderboard/workers`

Returns only users with role `Worker`, sorted by points descending.

**Authentication:** Required (any role)

**Success Response (200):** Same shape as above, workers only.

---

## 4.2.6 Notification Endpoints (`/api/notifications`)

### GET `/api/notifications`

Returns all notifications for the authenticated user.

**Authentication:** Required (any role)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "title": "Issue Assigned",
      "message": "Your issue 'Broken elevator' has been assigned to a worker.",
      "type": "ASSIGNED",
      "isRead": false,
      "createdAt": "2026-05-11T10:00:00.000Z",
      "issueId": 7
    }
  ]
}
```

**Notification Types:**

| Type | Trigger |
|---|---|
| `SUBMITTED` | Issue created |
| `ASSIGNED` | Worker assigned to issue |
| `IN_PROGRESS` | Worker started work |
| `UNDER_REVIEW` | Worker submitted completion evidence |
| `RESOLVED` | Manager approved completion |
| `REJECTED` | Issue rejected by manager |
| `REWORK` | Sent back to worker |
| `VERIFIED` | Community Member verified resolution |

---

### PATCH `/api/notifications/:id/read`

Marks a single notification as read.

**Success Response (200):** `{ "success": true }`

---

### PATCH `/api/notifications/read-all`

Marks all of the user's notifications as read.

**Success Response (200):** `{ "success": true }`

---

## Issue Status Transition Reference

```
Submitted/Pending  →  [Manager: Assign Worker]  →  Assigned
Assigned           →  [Worker: Start Work]       →  In Progress
In Progress        →  [Worker: Submit Evidence]  →  Under Review
Under Review       →  [Manager: Approve]         →  Resolved
Under Review       →  [Manager: Request Rework]  →  In Progress
Resolved           →  [Member: Verify]           →  Resolved (isVerified flag set)
Any Status         →  [Manager: Reject]          →  Rejected
```

---

# 4.3 Database Schema Documentation
https://drive.google.com/file/d/1VRTZVEpMxx2vSeki4LbNbfNLPqQbJNE1/view?usp=sharing
PICTURE

## Entity-Relationship Diagram
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Comment (
  id integer NOT NULL DEFAULT nextval('"Comment_id_seq"'::regclass),
  text text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  issueId integer NOT NULL,
  userId integer NOT NULL,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Comment_pkey PRIMARY KEY (id),
  CONSTRAINT Comment_issueId_fkey FOREIGN KEY (issueId) REFERENCES public.Issue(id),
  CONSTRAINT Comment_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.CompletionAttempt (
  id integer NOT NULL DEFAULT nextval('"CompletionAttempt_id_seq"'::regclass),
  issueId integer NOT NULL,
  workerId integer NOT NULL,
  photoUrl text,
  note text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT CompletionAttempt_pkey PRIMARY KEY (id),
  CONSTRAINT CompletionAttempt_issueId_fkey FOREIGN KEY (issueId) REFERENCES public.Issue(id),
  CONSTRAINT CompletionAttempt_workerId_fkey FOREIGN KEY (workerId) REFERENCES public.User(id)
);
CREATE TABLE public.Issue (
  id integer NOT NULL DEFAULT nextval('"Issue_id_seq"'::regclass),
  title character varying NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Submitted/Pending'::text,
  category text NOT NULL,
  location character varying NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  userId integer NOT NULL,
  building character varying NOT NULL DEFAULT ''::text,
  floor character varying NOT NULL DEFAULT ''::text,
  priority text NOT NULL DEFAULT 'Normal'::text,
  room character varying NOT NULL DEFAULT ''::text,
  assignedTo integer,
  completionNote text,
  completionPhotoUrl text,
  image text,
  rejectionReason text,
  resolvedAt timestamp without time zone,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verifiedBy integer,
  CONSTRAINT Issue_pkey PRIMARY KEY (id),
  CONSTRAINT Issue_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT Issue_verifiedBy_fkey FOREIGN KEY (verifiedBy) REFERENCES public.User(id)
);
CREATE TABLE public.Notification (
  id integer NOT NULL DEFAULT nextval('"Notification_id_seq"'::regclass),
  isRead boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  userId integer NOT NULL,
  issueId integer,
  message text NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  CONSTRAINT Notification_pkey PRIMARY KEY (id),
  CONSTRAINT Notification_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT Notification_issueId_fkey FOREIGN KEY (issueId) REFERENCES public.Issue(id)
);
CREATE TABLE public.User (
  id integer NOT NULL DEFAULT nextval('"User_id_seq"'::regclass),
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  role text NOT NULL,
  isActive boolean NOT NULL DEFAULT true,
  isVerified boolean NOT NULL DEFAULT false,
  actsOfServicePoints integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);

```mermaid
erDiagram
    USER {
        Int     id                  PK  "auto increment"
        String  name
        String  email               UK  "unique"
        String  password                "bcrypt hash"
        String  role                    "Community Member | Worker | Facility Manager | Admin"
        Boolean isActive                "default true"
        Boolean isVerified              "default false"
   Int     actsOfServicePoints     "default 0 — gamification reward points"
       Int     points                  "default 0 — worker performance points"
    }

    ISSUE {
        Int      id                  PK  "auto increment"
        String   title                   "max 100 chars"
        String   description
        String   status                  "default Submitted/Pending"
        String   category
        String   location                "max 200 chars — derived from building+floor+room"
        DateTime createdAt               "default now()"
        DateTime updatedAt               "auto-updated"
        Int      userId             FK   "references User"
        Int      assignedTo         FK?  "references User (Worker) — nullable"
        Int      verifiedBy         FK?  "references User (Member) — nullable"
        String   building                "max 100 chars"
        String   floor                   "max 50 chars"
        String   room                    "max 50 chars"
        String   priority                "default Normal"
        String   image              "?"  "Supabase Storage URL — nullable"
        String   completionPhotoUrl "?"  "nullable — latest submission only"
        String   completionNote     "?"  "nullable — latest submission only"
        String   rejectionReason    "?"  "nullable"
        DateTime resolvedAt         "?"  "nullable — set when Resolved"
    }

    COMPLETION_ATTEMPT {
        Int      id        PK  "auto increment"
        Int      issueId   FK  "references Issue"
        Int      workerId  FK  "references User (Worker)"
        String   photoUrl  "?" "nullable — Supabase Storage URL"
        String   note      "?" "nullable"
        DateTime createdAt     "default now()"
    }

    COMMENT {
        Int      id        PK  "auto increment"
        String   text
        DateTime createdAt     "default now()"
        DateTime updatedAt     "auto-updated"
        Int      issueId   FK  "references Issue"
        Int      userId    FK  "references User"
    }

    NOTIFICATION {
        Int      id        PK   "auto increment"
        Boolean  isRead         "default false"
        DateTime createdAt      "default now()"
        Int      userId    FK   "references User"
        Int      issueId   FK?  "references Issue — nullable"
        String   message
        String   title
        String   type           "SUBMITTED | ASSIGNED | IN_PROGRESS | UNDER_REVIEW | RESOLVED | REJECTED | REWORK | VERIFIED"
    }

    USER ||--o{ ISSUE : "reports (userId)"
    USER ||--o{ ISSUE : "assigned to (assignedTo)"
    USER ||--o{ ISSUE : "verifies (verifiedBy)"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ COMPLETION_ATTEMPT : "submits"
    ISSUE ||--o{ COMMENT : "has"
    ISSUE ||--o{ NOTIFICATION : "triggers"
    ISSUE ||--o{ COMPLETION_ATTEMPT : "has"
```

---

## Table Definitions

### `User`

| Column | Type | Constraint | Default | Description |
|---|---|---|---|---|
| `id` | `Int` | PRIMARY KEY, AUTO INCREMENT | — | Unique user ID |
| `name` | `String` | NOT NULL | — | Full name |
| `email` | `String` | NOT NULL, UNIQUE | — | University email address |
| `password` | `String` | NOT NULL | — | bcrypt-hashed password |
| `role` | `String` | NOT NULL | — | `Community Member`, `Worker`, `Facility Manager`, `Admin` |
| `isActive` | `Boolean` | NOT NULL | `true` | Account active flag; Admin can deactivate |
| `isVerified` | `Boolean` | NOT NULL | `false` | Email/approval verified; Community Members auto-verified |
| `actsOfServicePoints` | `Int` | NOT NULL | `0` | Points earned when member verifies a resolution |
| `points` | `Int` | NOT NULL | `0` | Points earned when manager approves worker's completion |

---

### `Issue`

| Column | Type | Constraint | Default | Description |
|---|---|---|---|---|
| `id` | `Int` | PRIMARY KEY, AUTO INCREMENT | — | Unique issue ID |
| `title` | `VarChar(100)` | NOT NULL | — | Short issue title |
| `description` | `String` | NOT NULL | — | Full description |
| `status` | `String` | NOT NULL | `"Submitted/Pending"` | Lifecycle status (see transitions) |
| `category` | `String` | NOT NULL | — | Issue type (e.g., Elevator, Plumbing) |
| `location` | `VarChar(200)` | NOT NULL | — | Human-readable composite location |
| `building` | `VarChar(100)` | NOT NULL | `""` | Building identifier |
| `floor` | `VarChar(50)` | NOT NULL | `""` | Floor number |
| `room` | `VarChar(50)` | NOT NULL | `""` | Room number/label |
| `priority` | `String` | NOT NULL | `"Normal"` | `Low`, `Normal`, `High`, `Urgent` |
| `image` | `String?` | NULLABLE | `null` | Supabase Storage URL for reporter's photo |
| `userId` | `Int` | FOREIGN KEY → `User.id` | — | Reporter |
| `assignedTo` | `Int?` | FOREIGN KEY → `User.id`, NULLABLE | `null` | Assigned worker |
| `verifiedBy` | `Int?` | FOREIGN KEY → `User.id`, NULLABLE | `null` | Member who verified resolution |
| `completionPhotoUrl` | `String?` | NULLABLE | `null` | Latest worker completion photo URL |
| `completionNote` | `String?` | NULLABLE | `null` | Latest worker completion note |
| `rejectionReason` | `String?` | NULLABLE | `null` | Manager's rejection justification |
| `resolvedAt` | `DateTime?` | NULLABLE | `null` | Timestamp when issue was resolved |
| `createdAt` | `DateTime` | NOT NULL | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | NOT NULL | `now()` | Auto-updated on every change |

---

### `CompletionAttempt`

Stores every completion submission a worker makes for an issue, preserving full rework history.

| Column | Type | Constraint | Default | Description |
|---|---|---|---|---|
| `id` | `Int` | PRIMARY KEY, AUTO INCREMENT | — | Unique attempt ID |
| `issueId` | `Int` | FOREIGN KEY → `Issue.id` | — | The issue being completed |
| `workerId` | `Int` | FOREIGN KEY → `User.id` | — | The worker who submitted |
| `photoUrl` | `String?` | NULLABLE | `null` | Supabase Storage URL |
| `note` | `String?` | NULLABLE | `null` | Worker's completion notes |
| `createdAt` | `DateTime` | NOT NULL | `now()` | Submission timestamp |

---

### `Comment`

| Column | Type | Constraint | Default | Description |
|---|---|---|---|---|
| `id` | `Int` | PRIMARY KEY, AUTO INCREMENT | — | Unique comment ID |
| `text` | `String` | NOT NULL | — | Comment body |
| `issueId` | `Int` | FOREIGN KEY → `Issue.id` | — | Parent issue |
| `userId` | `Int` | FOREIGN KEY → `User.id` | — | Author |
| `createdAt` | `DateTime` | NOT NULL | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | NOT NULL | `now()` | Auto-updated on edit |

---

### `Notification`

| Column | Type | Constraint | Default | Description |
|---|---|---|---|---|
| `id` | `Int` | PRIMARY KEY, AUTO INCREMENT | — | Unique notification ID |
| `title` | `String` | NOT NULL | — | Short notification title |
| `message` | `String` | NOT NULL | — | Full notification text |
| `type` | `String` | NOT NULL | — | Event type (see types above) |
| `isRead` | `Boolean` | NOT NULL | `false` | Read/unread flag |
| `userId` | `Int` | FOREIGN KEY → `User.id` | — | Recipient |
| `issueId` | `Int?` | FOREIGN KEY → `Issue.id`, NULLABLE | `null` | Related issue (if applicable) |
| `createdAt` | `DateTime` | NOT NULL | `now()` | Creation timestamp |

---

## Sample / Seed Data

The following accounts are pre-created for testing and demonstration:

| Name | Email | Password | Role | Verified |
|---|---|---|---|---|
| wello | `wello@campuscare.test` | `password123` | Admin | Yes |
| Sara Ahmed | `sara@giu-uni.de` | `password123` | Community Member | Yes |
|lina khaled mansy| `linamansy3@gmail.com| `linalolo2006`| Community Member| Yes|
| Omar Khaled | `omar@giu-uni.de` | `password123` | Worker | Yes |
| mohamed worker| mohamedworker@gmail.com|`mohamed123`| Worker| Yes|
| Lina Manager | `lina@giu-uni.de` | `password123` | Facility Manager | Yes |
 |ali manager |`ali@gmail.com`| `ali123`| Facility Manager| yes|

> To create additional seed data, run the `createVerifiedUser.js` script from the project root:
> ```bash
> node createVerifiedUser.js
> ```

---

# 4.4 Setup & Installation Guide

## Prerequisites

Ensure the following are installed before proceeding:

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18.x or 20.x LTS | Backend runtime and mobile toolchain |
| npm | 9.x+ (bundled with Node) | Package manager |
| [Expo Go](https://expo.dev/go) | Latest | Run the mobile app on a physical device |
| Git | Any recent version | Clone the repository |

**Optional but recommended:**
- [VS Code](https://code.visualstudio.com/) with the ESLint extension
- [Expo Orbit](https://expo.dev/orbit) for easy simulator/device management

**Cloud services (already configured — credentials in `.env`):**
- Supabase — PostgreSQL database + file storage
- No local PostgreSQL installation needed

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/linamansy/CampusCare.git
cd CampusCare
```

---

## Step 2 — Backend Setup

### 2a. Install backend dependencies

```bash
npm install
```

### 2b. Configure environment variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Edit `.env` with the following variables:

```env
# PostgreSQL connection string (Supabase session-mode pooler)
DATABASE_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Supabase direct connection (for Prisma migrations)
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres

# JWT signing secret — use a long random string in production
JWT_SECRET=campuscare-dev-secret-change-me

# Token expiry
JWT_EXPIRES_IN=1h

# Supabase project URL
SUPABASE_URL=https://PROJECT_ID.supabase.co

# Supabase anonymous key (found in Project Settings → API)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Supabase storage bucket name for issue photos
SUPABASE_BUCKET=campuscare-images

# Allowed email domains for registration (comma-separated)
UNIVERSITY_EMAIL_DOMAINS=giu-uni.de,giu.edu.eg,campuscare.test

# Backend port (optional, defaults to 3000)
PORT=3000
```

> The actual credentials for the project Supabase instance are shared by the team privately. Contact the team lead for the `.env` values.

### 2c. Apply the database schema

The database schema is managed by Prisma. Push it to the database:

```bash
npx prisma db push
```

This creates all tables and relations without running migrations. To view the database visually:

```bash
npx prisma studio
```

### 2d. Start the backend server

```bash
node index.js
```

The server starts on `http://localhost:3000`. You should see:

```
Server running on port 3000
```

---

## Step 3 — Mobile App Setup

### 3a. Navigate to the mobile directory

```bash
cd mobile
```

### 3b. Install mobile dependencies

```bash
npm install
```

### 3c. Configure environment variables

Create a `.env` file inside the `mobile/` directory:

```env
# Backend API base URL
# For iOS simulator on Mac: use localhost
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# For a physical device or Android emulator, use your machine's local IP:
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:3000

# Supabase (same values as backend, needed for direct storage uploads from mobile)
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
EXPO_PUBLIC_SUPABASE_BUCKET=campuscare-images
```

> **Finding your local IP (for physical device testing):**
> - macOS: `ipconfig getifaddr en0`
> - Windows: `ipconfig` → look for IPv4 Address

### 3d. Start the Expo development server

```bash
npx expo start
```

This opens the Expo developer tools in your browser and shows a QR code.

### 3e. Open the app

| Platform | How to run |
|---|---|
| **Physical device** | Install Expo Go → scan the QR code from the terminal |
| **iOS Simulator (Mac)** | Press `i` in the terminal (requires Xcode) |
| **Android Emulator** | Press `a` in the terminal (requires Android Studio) |
| **Web browser** | Press `w` in the terminal |

---

## Step 4 — Running Both Simultaneously

Open two terminal windows (or use VS Code's split terminal):

**Terminal 1 — Backend:**
```bash
cd /path/to/CampusCare
node index.js
```

**Terminal 2 — Mobile:**
```bash
cd /path/to/CampusCare/mobile
npx expo start
```

---

## Test Accounts

Use these pre-created accounts to test each role immediately after setup:

| Role | Email | Password |
|---|---|---|
| Admin | `wello@campuscare.test` | `password123` |
| Community Member | `sara@giu-uni.de` | `password123` |
| Worker | `omar@giu-uni.de` | `password123` |
| Facility Manager | `lina@giu-uni.de` | `password123` |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ECONNREFUSED` on mobile | Ensure backend is running; check `EXPO_PUBLIC_API_BASE_URL` is set to your machine's IP (not `localhost`) for physical devices |
| `max clients reached` Supabase error | Kill stale node processes: `pkill -f "node.*index.js"` then restart |
| `Token expired` on login | The JWT rotates — just log out and back in |
| Expo QR not scanning | Ensure your phone and computer are on the same Wi-Fi network |
| `prisma: command not found` | Use `npx prisma` instead of `prisma` directly |

---

# 4.5 Project Structure Overview

```
CampusCare/                        ← Project root
├── index.js                       ← Express app entry point — mounts all routes
├── package.json                   ← Backend dependencies (Express, Prisma, bcrypt, JWT, etc.)
├── .env                           ← Backend environment variables (gitignored)
├── .env.example                   ← Template for environment variables
├── API.md                         ← Full API endpoint reference
├── DOCUMENTATION.md               ← This file (sections 4.2–4.5)
│
├── prisma/
│   └── schema.prisma              ← Database schema — defines all models and relations
│
├── src/
│   ├── controllers/               ← Business logic, one file per domain
│   │   ├── authController.js      ←Register, login, logout, profile, and password reset logic
│   │   ├── managerController.js   ← Issue management, worker assignment, analytics
│   │   ├── workerIssueController.js ← Start work, submit completion evidence
│   │   ├── userController.js      ← Leaderboard endpoints
│   │   ├── adminController.js     ← User CRUD, category management
│   │   └── notificationController.js ← List and mark notifications read
│   │
│   ├── routes/                    ← Route declarations, one file per domain
│   │   ├── authRoutes.js          ← /api/auth/*
│   │   ├── managerRoutes.js       ← /api/manager/*
│   │   ├── adminRoutes.js         ← /api/admin/*
│   │   ├── userRoutes.js          ← /api/users/* (leaderboard)
│   │   └── notificationRoutes.js  ← /api/notifications/*
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js      ← JWT verification, sets req.userId / req.userRole
│   │   ├── rbac.js                ← Role-based access helpers (requireAdmin, requireWorker, etc.)
│   │   ├── rateLimiter.js         ← express-rate-limit configuration
│   │   ├── completionPhotoUpload.js ← multer config for photo file uploads
│   │   └── errorHandler.js        ← Global error handler middleware
│   │
│   ├── services/
│   │   └── categoryService.js     ← Reads/writes categories from a JSON file
│   │
│   ├── utils/
│   │   └── tokenRevocationStore.js ← In-memory JWT blocklist for logout
│   │
│   └── prismaClient.js            ← Singleton Prisma client instance
│
└── mobile/                        ← React Native / Expo mobile application
    ├── package.json               ← Mobile dependencies (Expo, React Native, Axios, etc.)
    ├── app.json                   ← Expo configuration (app name, icons, scheme)
    ├── tsconfig.json              ← TypeScript configuration
    ├── .env                       ← Mobile environment variables (gitignored)
    │
    ├── app/                       ← Expo Router file-based navigation
    │   ├── _layout.tsx            ← Root layout — loads fonts, wraps with AuthProvider + ThemeProvider
    │   ├── index.tsx              ← Entry guard — redirects to correct role tab group or login
    │   │
    │   ├── (auth)/                ← Unauthenticated screens
    │   │   ├── login.tsx          ← Email/password login form
    │   │   ├── register.tsx       ← Registration with role selector + approval badge
    │   │   ├── forgot-password.tsx ← Request password reset token
    │   │   └── reset-password.tsx  ← Enter new password with token
    │   │
    │   ├── (admin)/(tabs)/        ← Admin tab navigator
    │   │   ├── users.tsx          ← User list with role filter chips, verify/activate/delete actions
    │   │   ├── categories.tsx     ← Category management (add/delete)
    │   │   ├── analytics.tsx      ← Admin analytics view
    │   │   └── profile.tsx        ← Admin profile + theme switcher
    │   │
    │   ├── (manager)/(tabs)/      ← Facility Manager tab navigator
    │   │   ├── dashboard.tsx      ← Summary metrics (total, pending, resolved)
    │   │   ├── issues.tsx         ← Issue list with assign/priority/approve/reject/rework actions + completion evidence viewer
    │   │   ├── analytics.tsx      ← Interactive analytics (4 tabs, animated charts)
    │   │   └── profile.tsx        ← Manager profile + theme switcher
    │   │
    │   ├── (worker)/(tabs)/       ← Worker tab navigator
    │   │   ├── tasks.tsx          ← Assigned task list with start/complete actions + note input
    │   │   ├── history.tsx        ← Completed issue history
    │   │   ├── leaderboard.tsx    ← Worker rankings by points
    │   │   └── profile.tsx        ← Worker profile + theme switcher
    │   │
    │   └── (member)/(tabs)/       ← Community Member tab navigator
    │       ├── home.tsx           ← Personal issue summary + quick report CTA
    │       ├── report.tsx         ← New issue form (title, description, category, location, photo)
    │       ├── issues.tsx         ← My reported issues list + verify resolution action
    │       ├── notifications.tsx  ← Notification inbox
    │       ├── profile.tsx        ← Member profile + points display
    │       └── issue/[id].tsx     ← Issue detail screen with comments + completion evidence
    │
    └── src/
        ├── api/                   ← API layer (thin wrappers over the Axios client)
        │   ├── client.ts          ← Axios instance with base URL + auth token interceptor
        │   ├── auth.ts            ← login(), register(), logout(), fetchMe()
        │   ├── issues.ts          ← fetchIssues(), createIssue(), fetchIssueById(), addComment(), verifyIssue(), uploadCompletionPhoto()
        │   ├── manager.ts         ← fetchManagerIssues(), assignWorker(), setPriority(), approve/reject/rework(), fetchAnalytics(), fetchCompletionAttempts()
        │   ├── admin.ts           ← fetchAllUsers(), updateUser(), deleteUser(), fetchCategories(), addCategory(), deleteCategory()
        │   ├── notifications.ts   ← fetchNotifications(), markRead(), markAllRead()
        │   ├── users.ts           ← fetchLeaderboard(), fetchWorkerLeaderboard()
        │   └── types.ts           ← Shared TypeScript interfaces (User, Issue, CompletionAttempt, Notification, etc.)
        │
        ├── components/            ← Reusable UI components
        │   ├── AppShell.tsx       ← Screen wrapper with header title + subtitle
        │   ├── Button.tsx         ← Themed button (primary / outline / ghost / destructive variants)
        │   ├── Card.tsx           ← Rounded card container
        │   ├── Input.tsx          ← Labeled text input with error state
        │   ├── Screen.tsx         ← SafeAreaView wrapper with background color
        │   ├── StatusPill.tsx     ← Colored status badge (maps status string → color)
        │   ├── EmptyState.tsx     ← Icon + message for empty list states
        │   ├── ErrorState.tsx     ← Error message + retry button
        │   ├── LoadingState.tsx   ← Activity indicator centered on screen
        │   ├── MetricCard.tsx     ← KPI card with label, value, and optional icon
        │   ├── InputModal.tsx     ← Cross-platform modal with text input (used for reject/rework/note)
        │   └── InfoBanner.tsx     ← Dismissible informational banner
        │
        ├── state/
        │   └── auth-context.tsx   ← AuthContext — stores user, token, login/logout/register functions; persists token to AsyncStorage
        │
        ├── theme/
        │   └── index.ts           ← Color system (light/dark tokens), Fonts, Spacing, TypeScale, useTheme() hook
        │
        ├── navigation/
        │   └── index.tsx          ← (Expo Router handles navigation; this folder reserved for custom types)
        │
        └── utils/
            └── gamification.ts    ← Point computation helpers (buildWorkerLeaderboard, etc.)
```

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Expo Router file-based routing | Navigation structure mirrors folder structure — adding a screen is just adding a file |
| Role-gated route groups `(admin)`, `(manager)`, etc. | Each role gets an isolated tab navigator; `index.tsx` redirects after login based on `user.role` |
| Supabase for DB + Storage | Managed PostgreSQL with built-in file storage; no need to run a local database or file server |
| JWT stored in AsyncStorage | Simple persistence across app restarts; revoked server-side via in-memory blocklist on logout |
| `CompletionAttempt` model | Preserves full rework history instead of overwriting single `completionPhotoUrl` field on every resubmission |
| Batched Prisma queries | Supabase session-mode pool limit is 15 connections; analytics queries are split into batches of ≤7 to avoid exhausting the pool |
| No external chart library | Animated bar charts built with React Native's `Animated` API and `View` — avoids native module compilation issues in Expo Go |
