# CampusCare API Documentation

**Base URL:** `http://<host>:3000`  
All routes are available at both `/api/<prefix>` and `/<prefix>` (e.g. `/api/auth/login` = `/auth/login`).

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Issues](#2-issues)
3. [Manager](#3-manager)
4. [Admin](#4-admin)
5. [Users & Leaderboard](#5-users--leaderboard)
6. [Notifications](#6-notifications)
7. [Auth & Roles Reference](#7-auth--roles-reference)
8. [Data Models](#8-data-models)
9. [Points System](#9-points-system)
10. [Error Responses](#10-error-responses)

---

## 1. Authentication

**Prefix:** `/api/auth`

---

### POST `/api/auth/register`

Create a new user account.

**Auth required:** No

**Request body:**
```json
{
  "name": "string (required)",
  "email": "string (required) — must be a university email",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, default: 'Community Member')"
}
```

Valid roles: `Community Member`, `Worker`, `Facility Manager`, `Admin`

> **Note:** `Worker` and `Facility Manager` accounts are created with `isVerified: false` and require Admin approval before they can log in. `Community Member` accounts are immediately active.

**Response `201`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@campuscare.test",
    "role": "Community Member",
    "isActive": true,
    "isVerified": true
  }
}
```

**Errors:**
| Code | Error |
|------|-------|
| `400` | Name, email, and password are required |
| `400` | Invalid email format |
| `400` | Registration requires an official university email address |
| `400` | Role must be one of: ... |
| `409` | Email already in use |

---

### POST `/api/auth/login`

Log in and receive a JWT access token.

**Auth required:** No  
**Rate limited:** Yes

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGci...",
  "tokenType": "Bearer",
  "expiresIn": "1h",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@campuscare.test",
    "role": "Community Member",
    "isActive": true,
    "isVerified": true,
    "points": 0,
    "actsOfServicePoints": 0
  }
}
```

**Errors:**
| Code | Error |
|------|-------|
| `400` | Email and password are required |
| `401` | Invalid email or password |
| `403` | User account is inactive |
| `403` | Your account is pending admin approval. You will be notified once approved. *(Worker / Facility Manager only)* |
| `403` | Account is not verified |

---

### POST `/api/auth/logout`

Invalidate the current JWT token.

**Auth required:** Bearer token in header (token is revoked server-side)

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

### GET `/api/auth/me`

Get the currently authenticated user's profile.

**Auth required:** Yes

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@campuscare.test",
    "role": "Community Member",
    "isActive": true,
    "isVerified": true,
    "points": 50,
    "actsOfServicePoints": 10
  }
}
```

---

### POST `/api/auth/send-otp`

Send a one-time password to an email address.

**Auth required:** No  
**Rate limited:** Yes

**Request body:**
```json
{ "email": "string" }
```

**Response `200`:**
```json
{
  "message": "OTP sent successfully",
  "otp": "123456"
}
```
> In development the OTP is returned directly. In production, remove it from the response.

---

### POST `/api/auth/verify-otp`

Verify an OTP and mark the account as verified.

**Auth required:** No  
**Rate limited:** Yes

**Request body:**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response `200`:**
```json
{ "message": "OTP verified successfully" }
```

**Errors:** `400` — OTP expired / Invalid OTP / No OTP found for this email

---

### POST `/api/auth/forgot-password`

Request a password reset token.

**Auth required:** No  
**Rate limited:** Yes

**Request body:**
```json
{ "email": "string" }
```

**Response `200`:**
```json
{
  "message": "Password reset instructions sent",
  "resetToken": "abc123..."
}
```
> Token expires in 15 minutes.

---

### POST `/api/auth/reset-password`

Reset a password using a valid reset token.

**Auth required:** No

**Request body:**
```json
{
  "token": "string",
  "newPassword": "string (min 6 chars)"
}
```

**Response `200`:**
```json
{ "message": "Password reset successfully" }
```

---

## 2. Issues

**Prefix:** `/api/issues`

---

### GET `/api/issues`

Get all issues. Public.

**Auth required:** No

**Response `200`:** Array of [Issue objects](#issue)

---

### GET `/api/issues/my`

Get issues created by the authenticated user.

**Auth required:** Yes

**Response `200`:** Array of [Issue objects](#issue)

---

### GET `/api/issues/user`

Get all issues associated with the authenticated user (created or assigned).

**Auth required:** Yes

**Response `200`:** Array of [Issue objects](#issue)

---

### GET `/api/issues/:id`

Get a single issue by ID with comments.

**Auth required:** No

**Response `200`:** [Issue object](#issue) with `comments` array

---

### POST `/api/issues`

Submit a new issue. Accepts `multipart/form-data` or `application/json`.

**Auth required:** Yes

**Request body (multipart/form-data):**
```
title        string (required)
description  string (required)
category     string (required)
location     string (required)
building     string
floor        string
room         string
priority     string (default: Normal)
imageUrl     string (optional, if not uploading a file)
file         image file (optional)
```

**Response `201`:** [Issue object](#issue)

---

### GET `/api/issues/:id/comments`

Get all comments for an issue.

**Auth required:** No

**Response `200`:** Array of [Comment objects](#comment)

---

### POST `/api/issues/:id/comments`

Add a comment to an issue.

**Auth required:** Yes

**Request body:**
```json
{ "text": "string" }
```

**Response `201`:** [Comment object](#comment)

---

### POST `/api/issues/:id/verify`

Community Member confirms that a resolved issue has been fixed.

**Auth required:** Yes

**Response `200`:** Updated [Issue object](#issue)

---

### GET `/api/issues/assigned`

Get issues assigned to the authenticated worker.

**Auth required:** Yes — Worker role only

**Response `200`:** Array of [Issue objects](#issue)

---

### PUT `/api/issues/:id/in-progress`

Worker marks an assigned issue as in progress.

**Auth required:** Yes — Worker role only

**Request body:**
```json
{ "workerId": 5 }
```

**Response `200`:** Updated [Issue object](#issue)

> Worker earns **+3 points**.

---

### POST `/api/issues/:id/completion-photo`

Worker submits a completion photo to move the issue to "Under Review".

**Auth required:** Yes — Worker role only  
**Content-Type:** `multipart/form-data` or `application/json`

**Request body:**
```
workerId        number (required)
note            string (optional completion notes) — also accepted as: completionNote
file            image file (optional, if not using imageUrl)
imageUrl        string (optional) — also accepted as: image, photo, photoUrl, imageUri, image_url, photo_url
```

**Response `200`:** Updated [Issue object](#issue)

> Worker earns **+5 points**. Creates a [CompletionAttempt](#completionattempt) record. Notifies Facility Manager and issue reporter.

---

### PUT `/api/issues/:id/completed`

Worker marks an issue as completed (final step after Under Review).

**Auth required:** Yes — Worker role only

**Request body:**
```json
{ "workerId": 5 }
```

**Response `200`:** Updated [Issue object](#issue)

> Worker earns **+10 points**.

---

## 3. Manager

**Prefix:** `/api/manager`  
**Auth required:** Facility Manager or Admin role on all routes

---

### GET `/api/manager/issues`

Get all issues in the system.

**Response `200`:** Array of [Issue objects](#issue)

---

### GET `/api/manager/issues/filter`

Get issues filtered by field values.

**Query parameters:**
| Param | Type | Values |
|-------|------|--------|
| `status` | string | Submitted/Pending, Assigned, In Progress, Under Review, Resolved, Rejected |
| `priority` | string | Low, Normal, High, Urgent |
| `category` | string | any category name |
| `location` | string | partial match |

**Response `200`:** Array of [Issue objects](#issue)

---

### GET `/api/manager/issues/search`

Full-text search across issues.

**Query parameters:**
| Param | Description |
|-------|-------------|
| `q` | Search string — matches title, description, location |

**Response `200`:** Array of [Issue objects](#issue)

---

### PUT `/api/manager/issues/:id/assign`

Assign an issue to a worker.

**Request body:**
```json
{ "workerId": 5 }
```

**Response `200`:**
```json
{
  "message": "Issue assigned successfully",
  "issue": { ...Issue }
}
```

> Issue status moves to `Assigned`. Worker and reporter are notified.

**Errors:** `400` Worker not found / Worker is not active / Worker does not have Worker role

---

### PUT `/api/manager/issues/:id/priority`

Change the priority of an issue.

**Request body:**
```json
{ "priority": "Urgent" }
```

Valid values: `Low`, `Normal`, `High`, `Urgent`

**Response `200`:**
```json
{
  "message": "Priority updated",
  "issue": { ...Issue }
}
```

---

### PUT `/api/manager/issues/:id/resolve`

Mark an issue as resolved.

**Response `200`:**
```json
{
  "message": "Issue resolved",
  "issue": { ...Issue }
}
```

> Sets `status: Resolved`, records `resolvedAt` timestamp, clears `rejectionReason`.

---

### PUT `/api/manager/issues/:id/reject`

Reject an issue.

**Request body:**
```json
{ "reason": "string (required)" }
```

**Response `200`:**
```json
{
  "message": "Issue rejected",
  "issue": { ...Issue }
}
```

> Sets `status: Rejected`, stores reason, creates a comment, notifies assigned worker.

---

### PUT `/api/manager/issues/:id/rework`

Send an issue back to the worker for rework.

**Request body:**
```json
{ "reason": "string (required)" }
```

**Response `200`:**
```json
{
  "message": "Rework requested",
  "issue": { ...Issue }
}
```

> Sets `status: In Progress`, stores reason in `rejectionReason`, creates a comment, notifies worker.

---

### GET `/api/manager/issues/:id/completion-attempts`

Get all completion photo submissions for a specific issue (supports rework history).

**Response `200`:** Array of [CompletionAttempt objects](#completionattempt)

---

### GET `/api/manager/analytics`

Get comprehensive analytics data.

**Response `200`:**
```json
{
  "summary": {
    "totalIssues": 42,
    "resolvedIssues": 18,
    "rejectedIssues": 3,
    "underReviewIssues": 5,
    "assignedIssues": 30,
    "unassignedIssues": 12,
    "activeWorkers": 4,
    "avgResolutionDays": 2.5,
    "reworkCount": 6
  },
  "issuesByPriority": [
    { "priority": "High", "count": 10 }
  ],
  "issuesByStatus": [
    { "status": "Resolved", "count": 18 }
  ],
  "issuesByCategory": [
    { "category": "Maintenance", "count": 15 }
  ],
  "issuesByBuilding": [
    { "building": "A", "count": 8 }
  ],
  "monthlyTrends": [
    { "month": "2026-01", "count": 7 }
  ],
  "workerPerformance": [
    {
      "workerId": 2,
      "workerName": "Omar Khaled",
      "resolved": 12,
      "total": 15,
      "points": 150
    }
  ]
}
```

---

### GET `/api/manager/workers`

Get all active workers.

**Response `200`:** Array of [UserProfile objects](#userprofile)

---

### GET `/api/manager/workers/:id`

Get a specific worker's profile and their assigned issues.

**Response `200`:**
```json
{
  "worker": { ...UserProfile },
  "assignedIssues": [ ...Issue ]
}
```

---

### PUT `/api/manager/workers/:id/activate`

Activate a worker account.

**Response `200`:**
```json
{ "message": "Worker activated", "worker": { ...UserProfile } }
```

---

### PUT `/api/manager/workers/:id/deactivate`

Deactivate a worker account.

**Response `200`:**
```json
{ "message": "Worker deactivated", "worker": { ...UserProfile } }
```

---

## 4. Admin

**Prefix:** `/api/admin`  
**Auth required:** Admin role on all routes

---

### GET `/api/admin/users`

Get all users in the system.

**Response `200`:** Array of [UserProfile objects](#userprofile)

---

### PUT `/api/admin/users/:id/activate`

Activate a user account.

**Response `200`:**
```json
{ "message": "User activated", "user": { ...UserProfile } }
```

---

### PUT `/api/admin/users/:id/deactivate`

Deactivate a user account. Cannot deactivate your own account.

**Response `200`:**
```json
{ "message": "User deactivated", "user": { ...UserProfile } }
```

---

### PUT `/api/admin/users/:id/verify`

Approve a pending Worker or Facility Manager account.

**Response `200`:**
```json
{ "message": "User verified", "user": { ...UserProfile } }
```

---

### PUT `/api/admin/users/:id/promote`

Change a user's role.

**Request body:**
```json
{ "role": "Facility Manager" }
```

Valid roles: `Community Member`, `Worker`, `Facility Manager`, `Admin`

Cannot change your own role.

**Response `200`:**
```json
{ "message": "User role updated", "user": { ...UserProfile } }
```

---

### PUT `/api/admin/users/:id/reset-password`

Reset any user's password.

**Request body:**
```json
{ "newPassword": "string (min 6 chars)" }
```

**Response `200`:**
```json
{ "message": "Password reset successfully", "user": { ...UserProfile } }
```

---

### DELETE `/api/admin/users/:id`

Permanently delete a user. Cannot delete your own account.

**Response `200`:**
```json
{
  "message": "User deleted",
  "user": { "id": 5, "name": "Jane", "email": "jane@campuscare.test" }
}
```

---

### GET `/api/admin/analytics`

Get system-wide analytics.

**Response `200`:**
```json
{
  "summary": {
    "totalUsers": 20,
    "activeUsers": 18,
    "inactiveUsers": 2,
    "verifiedUsers": 17,
    "unverifiedUsers": 3,
    "totalIssues": 42
  },
  "usersByRole": [
    { "role": "Community Member", "count": 12 }
  ],
  "issuesByStatus": [
    { "status": "Resolved", "count": 18 }
  ]
}
```

---

### GET `/api/admin/categories`

Get all issue categories.

**Response `200`:**
```json
{ "categories": ["Maintenance", "Electrical", "Plumbing"] }
```

---

### POST `/api/admin/categories`

Create a new issue category.

**Request body:**
```json
{ "name": "Security" }
```

**Response `201`:**
```json
{ "message": "Category created", "categories": ["Maintenance", "Security"] }
```

---

### PUT `/api/admin/categories/:name`

Rename a category.

**Request body:**
```json
{ "name": "New Name" }
```

**Response `200`:**
```json
{ "message": "Category updated", "categories": [...] }
```

---

### DELETE `/api/admin/categories/:name`

Delete a category.

**Response `200`:**
```json
{ "message": "Category deleted", "categories": [...] }
```

---

## 5. Users & Leaderboard

**Prefix:** `/api/users`

---

### GET `/api/users/leaderboard`

Get the top 50 users ranked by points.

**Auth required:** Yes

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Omar Khaled",
      "role": "Worker",
      "points": 150,
      "actsOfServicePoints": 20
    }
  ]
}
```

---

### GET `/api/users/leaderboard/workers`

Get the top 50 workers ranked by points.

**Auth required:** Yes

**Response `200`:** Same shape as `/leaderboard` but filtered to role `Worker`

---

## 6. Notifications

**Prefix:** `/api/notifications`  
**Auth required:** Yes on all routes

---

### GET `/api/notifications`

Get all notifications for the authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "count": 5,
  "unreadCount": 2,
  "data": [
    {
      "id": 1,
      "title": "Issue Assigned",
      "message": "Ticket #12 has been assigned to you.",
      "type": "ISSUE_ASSIGNED",
      "isRead": false,
      "issueId": 12,
      "createdAt": "2026-05-15T22:00:00.000Z"
    }
  ]
}
```

**Notification types:**
| Type | Trigger |
|------|---------|
| `ISSUE_ASSIGNED` | Manager assigns issue to worker |
| `STATUS_CHANGED` | Issue status changes |
| `WORK_STARTED` | Worker marks issue in progress |
| `WORKER_COMPLETION_SUBMITTED` | Worker uploads completion photo |
| `WORKER_COMPLETED` | Work on issue is finished |
| `ISSUE_RESOLVED` | Manager marks issue resolved |
| `RESOLUTION_REJECTED` | Manager rejects completion |
| `REWORK_REQUESTED` | Manager sends issue back for rework |

---

### PUT `/api/notifications/:id/read`

Mark a single notification as read.

**Response `200`:**
```json
{ "success": true, "data": { ...Notification } }
```

---

### PUT `/api/notifications/read-all`

Mark all notifications as read.

**Response `200`:**
```json
{ "success": true, "count": 3 }
```

---

## 7. Auth & Roles Reference

### Authorization header

All protected routes require:
```
Authorization: Bearer <accessToken>
```

Token payload:
```json
{ "id": 1, "email": "user@campuscare.test", "role": "Worker", "jti": "uuid", "exp": 1234567890 }
```

Token expires in **1 hour**.

### Role permissions

| Route group | Community Member | Worker | Facility Manager | Admin |
|-------------|:---:|:---:|:---:|:---:|
| `/api/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/api/issues` (read) | ✅ | ✅ | ✅ | ✅ |
| `/api/issues` (create/comment) | ✅ | ✅ | ✅ | ✅ |
| `/api/issues/assigned` | — | ✅ | — | — |
| `/api/issues/:id/completion-photo` | — | ✅ | — | — |
| `/api/issues/:id/in-progress` | — | ✅ | — | — |
| `/api/issues/:id/completed` | — | ✅ | — | — |
| `/api/manager/*` | — | — | ✅ | ✅ |
| `/api/admin/*` | — | — | — | ✅ |
| `/api/users/leaderboard` | ✅ | ✅ | ✅ | ✅ |

### Status transition rules

```
Submitted/Pending → Assigned              (manager assigns worker)
Assigned          → In Progress           (worker starts work)
In Progress       → Under Review          (worker submits completion photo)
Under Review      → Resolved              (manager approves)
Under Review      → In Progress           (manager requests rework)
Submitted/Pending → Rejected              (manager rejects)
Assigned          → Rejected              (manager rejects)
```

---

## 8. Data Models

### UserProfile

```json
{
  "id": 1,
  "name": "Jane Smith",
  "email": "jane@campuscare.test",
  "role": "Community Member",
  "isActive": true,
  "isVerified": true,
  "points": 50,
  "actsOfServicePoints": 10
}
```

### Issue

```json
{
  "id": 12,
  "title": "Broken ceiling light",
  "description": "Flickering light in hallway",
  "status": "Under Review",
  "priority": "High",
  "category": "Electrical",
  "location": "A - Floor 2 - Room 204",
  "building": "A",
  "floor": "2",
  "room": "204",
  "image": "https://...supabase.co/.../original-photo.png",
  "completionPhotoUrl": "https://...supabase.co/.../completion-photo.png",
  "completionNote": "Replaced bulb and checked wiring.",
  "rejectionReason": null,
  "assignedTo": 5,
  "userId": 1,
  "verifiedBy": null,
  "createdAt": "2026-05-10T10:00:00.000Z",
  "updatedAt": "2026-05-15T14:30:00.000Z",
  "resolvedAt": null,
  "user": { ...UserProfile },
  "comments": [ ...Comment ]
}
```

### Comment

```json
{
  "id": 3,
  "text": "We will look into this tomorrow.",
  "issueId": 12,
  "userId": 3,
  "createdAt": "2026-05-11T09:00:00.000Z",
  "user": { "id": 3, "name": "Omar Khaled", "role": "Worker" }
}
```

### CompletionAttempt

```json
{
  "id": 1,
  "issueId": 12,
  "workerId": 5,
  "photoUrl": "https://...supabase.co/.../completion-photo.png",
  "note": "Fixed and tested.",
  "createdAt": "2026-05-15T14:00:00.000Z",
  "worker": { "id": 5, "name": "Omar Khaled" }
}
```

### Notification

```json
{
  "id": 7,
  "title": "Ticket Ready for Review",
  "message": "Ticket #12 has a worker completion update.",
  "type": "WORKER_COMPLETION_SUBMITTED",
  "isRead": false,
  "issueId": 12,
  "userId": 3,
  "createdAt": "2026-05-15T14:00:00.000Z"
}
```

---

## 9. Points System

Workers earn points for completing tasks:

| Action | Points |
|--------|--------|
| Mark issue In Progress | +3 |
| Submit completion photo | +5 |
| Issue marked Completed | +10 |

Points are visible on the leaderboard (`/api/users/leaderboard/workers`) and on the worker's profile.

---

## 10. Error Responses

All errors follow this shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

### Common error codes

| HTTP | Code | Meaning |
|------|------|---------|
| `400` | — | Validation error (check `error` field) |
| `401` | `NO_AUTH` | No Authorization header |
| `401` | `INVALID_AUTH` | Bad or malformed token |
| `401` | `TOKEN_EXPIRED` | JWT has expired — re-login |
| `401` | `TOKEN_REVOKED` | Token was invalidated by logout |
| `403` | `ACCOUNT_INACTIVE` | User account is deactivated |
| `403` | `ACCOUNT_NOT_VERIFIED` | Account pending approval |
| `403` | `FORBIDDEN` | Role does not have permission |
| `404` | — | Resource not found |
| `409` | — | Conflict (duplicate email, invalid status transition) |
| `429` | — | Rate limit exceeded |
| `500` | `SERVER_ERROR` | Unexpected server error |
