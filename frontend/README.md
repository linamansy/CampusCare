# CampusCare Frontend

Simple vanilla JavaScript frontend for the CampusCare issue management system.

## Files

- `issues.html` - Issues list page with filtering
- `issue-details.html` - Issue detail page with comments and verification
- `issue-details.js` - JavaScript logic for issue interactions
- `notifications.html` - User notifications page

## Setup

1. Start the backend server on `http://localhost:3000`
2. Open the HTML files in a web browser
3. Update `currentUserId` in the JavaScript files with actual user authentication

## Features

### Issues List Page
- View all issues with filtering by status
- Click on any issue to view details
- Shows issue summary, status, category, location, creator, and comment count

### Issue Details Page
- View complete issue information
- Display all comments with author details
- Add new comments (requires authentication)
- Verify resolution (for issue creators when status is "Resolved")

### Notifications Page
- View all user notifications
- Mark notifications as read
- Real-time updates after actions

## API Integration

The frontend makes requests to these backend endpoints:

- `GET /issues` - Get all issues (with optional status filter)
- `GET /issues/:id` - Get issue details
- `GET /issues/:id/comments` - Get issue comments
- `POST /issues/:id/comments` - Add comment
- `POST /issues/:id/verify` - Verify resolution
- `GET /issues/notifications` - Get user notifications
- `PUT /issues/notifications/:id/read` - Mark notification read

## Authentication

Currently uses mock authentication with `x-user-id` header. Replace with proper JWT or session-based auth.

## Usage

1. Open `issues.html` to browse all issues
2. Click on an issue to view details in `issue-details.html?id=1`
3. Use `notifications.html` to view notifications
4. Ensure backend is running and database is migrated