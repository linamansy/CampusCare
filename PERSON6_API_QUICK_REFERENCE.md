# Person 6 API Quick Reference

## Authentication Required
All protected endpoints require one of:
- Header: `x-user-id: {id}` 
- Header: `x-userid: {id}`
- Query param: `?userId={id}`
- Body field: `"userId": {id}`

## Admin Endpoints

### List All Users
```
GET /api/admin/users
Auth: Admin role required
Response: Array of users with id, name, email, role, isActive, isVerified
```

### Activate User
```
PUT /api/admin/users/:id/activate
Auth: Admin role required
Response: Activated user object
```

### Deactivate User
```
PUT /api/admin/users/:id/deactivate
Auth: Admin role required
Note: Cannot deactivate yourself
Response: Deactivated user object
```

### Change User Role
```
PUT /api/admin/users/:id/promote
Auth: Admin role required
Body: { "role": "Community Member|Worker|Facility Manager|Admin" }
Note: Cannot change your own role
Response: User with updated role
```

### Verify User Email
```
PUT /api/admin/users/:id/verify
Auth: Admin role required
Response: User with isVerified = true
```

### Delete User
```
DELETE /api/admin/users/:id
Auth: Admin role required
Note: Cannot delete yourself, permanent deletion
Response: Confirmation of deleted user
```

## Manager Endpoints

### List All Issues (with filtering/search)
```
GET /api/manager/issues
Auth: Facility Manager or Admin
Response: All issues in the system
```

### Filter Issues
```
GET /api/manager/issues/filter?status=Open&category=Maintenance&location=Building A
Auth: Facility Manager or Admin
Response: Filtered issues
```

### Search Issues
```
GET /api/manager/issues/search?q=broken
Auth: Facility Manager or Admin
Response: Issues matching search query
```

### List All Workers
```
GET /api/manager/workers
Auth: Facility Manager or Admin
Response: Array of Worker role users with status
```

### Activate Worker
```
PUT /api/manager/workers/:id/activate
Auth: Facility Manager or Admin
Response: Activated worker object
```

### Deactivate Worker
```
PUT /api/manager/workers/:id/deactivate
Auth: Facility Manager or Admin
Response: Deactivated worker object
```

## Protected User Endpoints

### List All Users (Admin Only)
```
GET /api/users
Auth: Admin role required
Response: Array of all users
```

### Create User (Admin Only)
```
POST /api/users
Auth: Admin role required
Body: { "name": "...", "email": "...", "password": "...", "role": "..." }
Response: Created user (password excluded)
```

## Error Responses

### 401 - Not Authenticated
```json
{ "error": "Authentication required", "code": "NO_AUTH" }
```

### 403 - Insufficient Permissions
```json
{ 
  "error": "Insufficient permissions", 
  "code": "FORBIDDEN",
  "requiredRoles": ["Admin"],
  "userRole": "Worker"
}
```

### 404 - Not Found
```json
{ "error": "User not found" }
```

### 400 - Bad Request
```json
{ "error": "Invalid user ID" }
```

## Response Status Codes

- **200** - Success (GET, PUT)
- **201** - Created (POST)
- **400** - Bad request (invalid input)
- **401** - Authentication required
- **403** - Permission denied (wrong role)
- **404** - Resource not found
- **409** - Conflict (duplicate email, etc)
- **500** - Server error

## Common Use Cases

### Create an Admin User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@campus.care",
    "password": "SecurePassword123",
    "role": "Admin"
  }'
```

### View All System Users (Admin)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "x-user-id: 1"
```

### Manage Workers (Manager View)
```bash
# List all workers
curl -X GET http://localhost:3000/api/manager/workers \
  -H "x-user-id: 2"

# Deactivate lazy worker
curl -X PUT http://localhost:3000/api/manager/workers/5/deactivate \
  -H "x-user-id: 2"
```

### Workflow: Promote Worker to Manager
```bash
# 1. Admin verifies the worker
curl -X PUT http://localhost:3000/api/admin/users/5/verify \
  -H "x-user-id: 1"

# 2. Admin promotes to Facility Manager
curl -X PUT http://localhost:3000/api/admin/users/5/promote \
  -H "x-user-id: 1" \
  -H "Content-Type: application/json" \
  -d '{"role": "Facility Manager"}'
```

## Notes

- All timestamps use ISO 8601 format
- User passwords are never returned in responses
- Email addresses are validated on creation
- Duplicate emails are rejected (409 Conflict)
- Role names are case-sensitive: "Admin", "Facility Manager", "Worker", "Community Member"
- Users are active by default, inactive users cannot access protected endpoints
- Users are unverified by default (awaiting email verification)
