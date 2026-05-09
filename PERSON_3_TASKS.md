# 👤 PERSON 3: SUBMIT ISSUE + DESCRIPTION (Community Member Issue Submission)

**Tech Stack:** Node.js/Express + Prisma + PostgreSQL  
**Difficulty:** High  
**Owner:** Andrew (Person 3)  
**Sprint:** Full project  

---

## 📋 OVERVIEW

Person 3 owns the **issue intake workflow** for Community Members. This is the foundation feature—all other features (manager assignment, worker execution, status tracking) depend on clean, valid issue creation.

**Core Responsibility:**
- Community Member creates an issue with title, description, category, location, and optional image
- Issue is persisted with initial status = "Open"
- Issue is linked to the authenticated Community Member
- Full validation, error handling, and success messaging

---

## 🎯 REQUIREMENTS BREAKDOWN

| Requirement | Status | Notes |
|-------------|--------|-------|
| Community Member login required | ✔️ Must auth first |  |
| Issue title (required) | ✔️ Non-empty string, max 100 chars |  |
| Issue description (required) | ✔️ Non-empty string, max 1000 chars |  |
| Category (required) | ✔️ Predefined list: Plumbing, Electrical, HVAC, Cleaning, Maintenance, Other |  |
| Location (required) | ✔️ Building + room/area, max 200 chars |  |
| Image/Photo (optional) | ✔️ PNG/JPG/JPEG, max 5MB |  |
| Initial status | ✔️ Always "Open" |  |
| Timestamp | ✔️ createdAt, updatedAt auto |  |
| User association | ✔️ Linked to logged-in Community Member |  |
| Success response | ✔️ Return created issue with ID |  |
| Error handling | ✔️ Validation errors, upload errors, DB errors |  |

---

## 🗄️ DATABASE TASK

### Task 1.1: Update Issue Model (If Image Field Missing)

**Check Current State:**
```sql
-- Verify if Issue model has image field
-- Expected: id, title, description, status, category, location, userId, image, createdAt, updatedAt
```

**Required Changes to `prisma/schema.prisma`:**

```prisma
model Issue {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(100)
  description String    @db.Text
  status      String    @default("Open")
  category    String    // Plumbing, Electrical, HVAC, Cleaning, Maintenance, Other
  location    String    @db.VarChar(200)
  image       String?   // URL or path to uploaded image (optional)
  userId      Int
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments    Comment[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Action:**
- [ ] Add `image` field to Issue model (nullable String)
- [ ] Add `createdAt` and `updatedAt` timestamps if missing
- [ ] Run migration: `npx prisma migrate dev --name add_image_to_issue`
- [ ] Verify migration applied successfully

---

## 🛠️ BACKEND TASKS

### Task 2.1: Create Issue Controller with Full Validation

**File:** `src/controllers/todoController.js`

**Enhancements Required:**

```javascript
const prisma = require('../prismaClient');
const fs = require('fs').promises;
const path = require('path');

// Allowed categories
const ALLOWED_CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Cleaning', 'Maintenance', 'Other'];
const UPLOAD_DIR = path.join(__dirname, '../../uploads/issues');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// CREATE ISSUE - FULL VALIDATION
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location, userId } = req.body;
    const imageFile = req.file;

    // ====== VALIDATION ======

    // 1. Check authentication (userId must be provided and valid)
    if (!userId || userId <= 0) {
      return res.status(401).json({ 
        error: 'Unauthorized: Valid userId required',
        code: 'INVALID_USER' 
      });
    }

    // Verify user exists and is Community Member
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }
    if (user.role !== 'Community Member') {
      return res.status(403).json({ 
        error: 'Only Community Members can submit issues',
        code: 'INVALID_ROLE' 
      });
    }

    // 2. Validate title
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ 
        error: 'Title is required and must be a string',
        code: 'INVALID_TITLE' 
      });
    }
    if (title.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Title cannot be empty',
        code: 'EMPTY_TITLE' 
      });
    }
    if (title.length > 100) {
      return res.status(400).json({ 
        error: 'Title must be 100 characters or less',
        code: 'TITLE_TOO_LONG' 
      });
    }

    // 3. Validate description
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ 
        error: 'Description is required and must be a string',
        code: 'INVALID_DESCRIPTION' 
      });
    }
    if (description.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Description cannot be empty',
        code: 'EMPTY_DESCRIPTION' 
      });
    }
    if (description.length > 1000) {
      return res.status(400).json({ 
        error: 'Description must be 1000 characters or less',
        code: 'DESCRIPTION_TOO_LONG' 
      });
    }

    // 4. Validate category
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY' 
      });
    }

    // 5. Validate location
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ 
        error: 'Location is required and must be a string',
        code: 'INVALID_LOCATION' 
      });
    }
    if (location.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Location cannot be empty',
        code: 'EMPTY_LOCATION' 
      });
    }
    if (location.length > 200) {
      return res.status(400).json({ 
        error: 'Location must be 200 characters or less',
        code: 'LOCATION_TOO_LONG' 
      });
    }

    // 6. Validate image file if provided
    let imagePath = null;
    if (imageFile) {
      // Check file size
      if (imageFile.size > MAX_FILE_SIZE) {
        return res.status(400).json({ 
          error: 'Image file must be 5MB or less',
          code: 'FILE_TOO_LARGE' 
        });
      }

      // Check file type
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedMimes.includes(imageFile.mimetype)) {
        return res.status(400).json({ 
          error: 'Only PNG and JPG images are allowed',
          code: 'INVALID_FILE_TYPE' 
        });
      }

      // Save file and store path
      try {
        // Ensure upload directory exists
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `issue-${userId}-${timestamp}-${imageFile.originalname}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        
        // Save file
        await fs.writeFile(filepath, imageFile.buffer);
        imagePath = `/uploads/issues/${filename}`;
      } catch (uploadError) {
        return res.status(500).json({ 
          error: 'Failed to upload image',
          code: 'UPLOAD_ERROR',
          details: uploadError.message 
        });
      }
    }

    // ====== CREATE ISSUE ======
    const issue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        image: imagePath,
        status: 'Open',
        userId
      }
    });

    // ====== RESPONSE ======
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        location: issue.location,
        image: issue.image,
        status: issue.status,
        userId: issue.userId,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message 
    });
  }
};

// GET ALL ISSUES (already exists, verify it works)
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: { user: true, comments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      code: 'FETCH_ERROR' 
    });
  }
};

// GET ISSUE BY ID
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: 'Valid issue ID required',
        code: 'INVALID_ID' 
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: parseInt(id) },
      include: { user: true, comments: true }
    });

    if (!issue) {
      return res.status(404).json({ 
        error: 'Issue not found',
        code: 'NOT_FOUND' 
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      code: 'FETCH_ERROR' 
    });
  }
};

// GET MY ISSUES (for Community Member)
exports.getMyIssues = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        error: 'Valid userId required',
        code: 'INVALID_USER_ID' 
      });
    }

    const issues = await prisma.issue.findMany({
      where: { userId: parseInt(userId) },
      include: { comments: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      code: 'FETCH_ERROR' 
    });
  }
};
```

**Action:**
- [ ] Update `todoController.js` with validation logic above
- [ ] Test each validation path (invalid title, category, file size, etc.)
- [ ] Verify error codes are consistent
- [ ] Ensure all required fields are validated

---

### Task 2.2: Update Routes with Image Upload Middleware

**File:** `src/routes/todoRoutes.js`

```javascript
const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/todoController');

// Configure multer for image uploads
const storage = multer.memoryStorage(); // Store in memory for simplicity, or use disk storage
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPG images allowed'));
    }
  }
});

// Routes
router.get('/', controller.getAllIssues);
router.get('/:id', controller.getIssueById);
router.get('/user/:userId', controller.getMyIssues);
router.post('/', upload.single('image'), controller.createIssue);

module.exports = router;
```

**Action:**
- [ ] Install multer: `npm install multer`
- [ ] Update routes with multer middleware
- [ ] Verify image upload works with POST request
- [ ] Test without image (optional field)
- [ ] Test with image

---

### Task 2.3: Add Authentication Middleware

**File:** `src/middleware/auth.js` (create if not exists)

```javascript
// Simple auth middleware (adjust based on your auth implementation)
const verifyAuth = (req, res, next) => {
  try {
    // Extract userId from header or request body
    const userId = req.body.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_AUTH' 
      });
    }

    // In production, verify JWT token here
    req.userId = parseInt(userId);
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid authentication',
      code: 'INVALID_AUTH' 
    });
  }
};

module.exports = { verifyAuth };
```

**Action:**
- [ ] Create `src/middleware/auth.js`
- [ ] Add authentication middleware to routes
- [ ] Test authenticated vs unauthenticated requests

---

## 🎨 FRONTEND TASKS

### Task 3.1: Create Issue Submission Form Component

**File:** `frontend/pages/SubmitIssue.jsx` (or .html/.ejs depending on your frontend)

**HTML Form Structure:**

```html
<div class="container mt-5">
  <div class="row">
    <div class="col-md-8 offset-md-2">
      <h2>Report a Campus Issue</h2>
      <form id="issueForm" enctype="multipart/form-data">
        
        <!-- Title Field -->
        <div class="mb-3">
          <label for="title" class="form-label">Issue Title *</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            class="form-control" 
            placeholder="e.g., Broken faucet in bathroom"
            maxlength="100"
            required
          />
          <small class="form-text text-muted">Max 100 characters</small>
          <div class="invalid-feedback" id="titleError"></div>
        </div>

        <!-- Description Field -->
        <div class="mb-3">
          <label for="description" class="form-label">Description *</label>
          <textarea 
            id="description" 
            name="description" 
            class="form-control" 
            placeholder="Provide detailed information about the issue..."
            maxlength="1000"
            rows="5"
            required
          ></textarea>
          <small class="form-text text-muted">Max 1000 characters</small>
          <div class="invalid-feedback" id="descriptionError"></div>
        </div>

        <!-- Category Field -->
        <div class="mb-3">
          <label for="category" class="form-label">Category *</label>
          <select id="category" name="category" class="form-select" required>
            <option value="">Select a category</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="HVAC">HVAC (Heating/Cooling)</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Other">Other</option>
          </select>
          <div class="invalid-feedback" id="categoryError"></div>
        </div>

        <!-- Location Field -->
        <div class="mb-3">
          <label for="location" class="form-label">Location *</label>
          <input 
            type="text" 
            id="location" 
            name="location" 
            class="form-control" 
            placeholder="e.g., Building A, Room 205"
            maxlength="200"
            required
          />
          <small class="form-text text-muted">Max 200 characters</small>
          <div class="invalid-feedback" id="locationError"></div>
        </div>

        <!-- Image Upload Field -->
        <div class="mb-3">
          <label for="image" class="form-label">Attach Photo (Optional)</label>
          <input 
            type="file" 
            id="image" 
            name="image" 
            class="form-control" 
            accept="image/png,image/jpeg,image/jpg"
          />
          <small class="form-text text-muted">PNG or JPG, max 5MB</small>
          <div id="imagePreview" class="mt-2"></div>
          <div class="invalid-feedback" id="imageError"></div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary w-100">Submit Issue</button>
        <div id="successMessage" class="alert alert-success mt-3" style="display:none;"></div>
        <div id="errorMessage" class="alert alert-danger mt-3" style="display:none;"></div>
      </form>
    </div>
  </div>
</div>
```

**JavaScript Validation & Submission:**

```javascript
document.getElementById('issueForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form data
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const location = document.getElementById('location').value.trim();
  const imageFile = document.getElementById('image').files[0];

  // Clear previous messages
  document.getElementById('errorMessage').style.display = 'none';
  document.getElementById('successMessage').style.display = 'none';

  // Validation
  let isValid = true;

  if (!title) {
    document.getElementById('titleError').textContent = 'Title is required';
    isValid = false;
  } else if (title.length > 100) {
    document.getElementById('titleError').textContent = 'Title must be 100 characters or less';
    isValid = false;
  }

  if (!description) {
    document.getElementById('descriptionError').textContent = 'Description is required';
    isValid = false;
  } else if (description.length > 1000) {
    document.getElementById('descriptionError').textContent = 'Description must be 1000 characters or less';
    isValid = false;
  }

  if (!category) {
    document.getElementById('categoryError').textContent = 'Please select a category';
    isValid = false;
  }

  if (!location) {
    document.getElementById('locationError').textContent = 'Location is required';
    isValid = false;
  } else if (location.length > 200) {
    document.getElementById('locationError').textContent = 'Location must be 200 characters or less';
    isValid = false;
  }

  if (imageFile && imageFile.size > 5 * 1024 * 1024) {
    document.getElementById('imageError').textContent = 'Image must be 5MB or less';
    isValid = false;
  }

  if (!isValid) return;

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('location', location);
  formData.append('userId', getCurrentUserId()); // Get from session
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const response = await fetch('/api/issues', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById('successMessage').textContent = 'Issue submitted successfully! Issue ID: ' + data.data.id;
      document.getElementById('successMessage').style.display = 'block';
      document.getElementById('issueForm').reset();
      document.getElementById('imagePreview').innerHTML = '';

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/my-issues';
      }, 2000);
    } else {
      document.getElementById('errorMessage').textContent = data.error || 'Failed to submit issue';
      document.getElementById('errorMessage').style.display = 'block';
    }
  } catch (error) {
    document.getElementById('errorMessage').textContent = 'Error: ' + error.message;
    document.getElementById('errorMessage').style.display = 'block';
  }
});

// Image preview
document.getElementById('image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('imagePreview').innerHTML = `
        <img src="${event.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">
      `;
    };
    reader.readAsDataURL(file);
  }
});
```

**Action:**
- [ ] Create submit issue form page
- [ ] Implement client-side validation
- [ ] Add image preview functionality
- [ ] Test form submission with valid data
- [ ] Test form submission with invalid data
- [ ] Verify error messages display correctly
- [ ] Test image upload

---

## ✅ TESTING TASKS

### Task 4.1: Backend API Testing

**File:** `tests/issueSubmission.test.js` (or use Postman)

**Test Cases:**

```javascript
// Test 1: Valid issue submission with image
POST /api/issues
Body:
{
  "userId": 1,
  "title": "Broken door handle",
  "description": "The door handle in the main office is broken and needs replacement",
  "category": "Maintenance",
  "location": "Building A, Room 101"
}
File: image.jpg
Expected: 201, issue created with ID

// Test 2: Missing required field (title)
POST /api/issues
Body:
{
  "userId": 1,
  "description": "...",
  "category": "Maintenance",
  "location": "..."
}
Expected: 400, error code INVALID_TITLE

// Test 3: Invalid category
POST /api/issues
Body:
{
  "userId": 1,
  "title": "Issue",
  "description": "...",
  "category": "InvalidCategory",
  "location": "..."
}
Expected: 400, error code INVALID_CATEGORY

// Test 4: Image too large (>5MB)
POST /api/issues
Body: {...}
File: large_image.jpg (10MB)
Expected: 400, error code FILE_TOO_LARGE

// Test 5: Invalid user role (not Community Member)
POST /api/issues
Body:
{
  "userId": 2 (Facility Manager),
  "title": "...",
  ...
}
Expected: 403, error code INVALID_ROLE

// Test 6: Non-existent user
POST /api/issues
Body:
{
  "userId": 9999,
  ...
}
Expected: 404, error code USER_NOT_FOUND

// Test 7: Invalid file type (PDF instead of image)
POST /api/issues
Body: {...}
File: document.pdf
Expected: 400, error code INVALID_FILE_TYPE
```

**Action:**
- [ ] Create or use Postman collection for testing
- [ ] Test all 7 cases above
- [ ] Verify response codes are correct
- [ ] Verify error messages are clear
- [ ] Test GET /api/issues (retrieve all)
- [ ] Test GET /api/issues/:id (retrieve specific)
- [ ] Test GET /api/issues/user/:userId (get my issues)

---

### Task 4.2: Frontend Form Testing

**Test Cases:**

- [ ] Submit form with all fields filled
- [ ] Submit form missing title
- [ ] Submit form missing category
- [ ] Submit form with title > 100 chars
- [ ] Submit form with description > 1000 chars
- [ ] Submit form with invalid image format
- [ ] Submit form with valid image
- [ ] Image preview displays correctly
- [ ] Success message appears after submission
- [ ] Form clears after successful submission
- [ ] Error message displays on failed submission
- [ ] Form redirects to "my issues" after 2 seconds

**Action:**
- [ ] Create manual test checklist
- [ ] Test each case in browser
- [ ] Document results

---

## 📚 DOCUMENTATION TASKS

### Task 5.1: Create API Documentation

**File:** `docs/PERSON_3_API.md`

```markdown
# Person 3 API Documentation - Issue Submission

## Base URL
`/api/issues`

## Endpoints

### 1. Create Issue (POST)
Submit a new issue as a Community Member

**URL:** `POST /api/issues`

**Headers:**
```
Content-Type: multipart/form-data (if image included)
```

**Request Body:**
```json
{
  "userId": 1,
  "title": "Broken faucet",
  "description": "The faucet in bathroom is leaking",
  "category": "Plumbing",
  "location": "Building A, Room 205",
  "image": (file - optional)
}
```

**Required Fields:**
- userId: integer, user ID of authenticated Community Member
- title: string, max 100 characters
- description: string, max 1000 characters
- category: one of [Plumbing, Electrical, HVAC, Cleaning, Maintenance, Other]
- location: string, max 200 characters

**Optional Fields:**
- image: file, PNG/JPG, max 5MB

**Success Response (201):**
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 1,
    "title": "Broken faucet",
    "description": "...",
    "category": "Plumbing",
    "location": "Building A, Room 205",
    "image": "/uploads/issues/issue-1-timestamp.jpg",
    "status": "Open",
    "userId": 1,
    "createdAt": "2024-05-03T10:30:00Z",
    "updatedAt": "2024-05-03T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": "Category must be one of: Plumbing, Electrical, ...",
  "code": "INVALID_CATEGORY"
}
```

### 2. Get All Issues (GET)
Retrieve all submitted issues

**URL:** `GET /api/issues`

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### 3. Get Issue by ID (GET)
Retrieve specific issue

**URL:** `GET /api/issues/:id`

**Success Response (200):** Returns single issue object

### 4. Get My Issues (GET)
Community Member retrieves their own issues

**URL:** `GET /api/issues/user/:userId`

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| INVALID_USER | 401 | userId missing or invalid |
| USER_NOT_FOUND | 404 | User does not exist |
| INVALID_ROLE | 403 | User is not a Community Member |
| INVALID_TITLE | 400 | Title missing or invalid format |
| EMPTY_TITLE | 400 | Title is empty string |
| TITLE_TOO_LONG | 400 | Title > 100 chars |
| INVALID_DESCRIPTION | 400 | Description missing |
| EMPTY_DESCRIPTION | 400 | Description is empty |
| DESCRIPTION_TOO_LONG | 400 | Description > 1000 chars |
| INVALID_CATEGORY | 400 | Category not in allowed list |
| INVALID_LOCATION | 400 | Location missing |
| EMPTY_LOCATION | 400 | Location is empty |
| LOCATION_TOO_LONG | 400 | Location > 200 chars |
| FILE_TOO_LARGE | 400 | Image > 5MB |
| INVALID_FILE_TYPE | 400 | Image not PNG/JPG |
| UPLOAD_ERROR | 500 | File upload failed |
| INTERNAL_ERROR | 500 | Server error |
```

**Action:**
- [ ] Create `docs/PERSON_3_API.md`
- [ ] Include all endpoint details
- [ ] Include error codes
- [ ] Include curl examples

---

### Task 5.2: Create Developer Setup Guide

**File:** `docs/PERSON_3_SETUP.md`

```markdown
# Person 3 - Setup & Development Guide

## Prerequisites
- Node.js v16+ installed
- PostgreSQL running
- Git cloned locally

## Setup Steps

### 1. Install Dependencies
```bash
npm install
npm install multer  # For image upload
```

### 2. Configure Environment
Create `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/campuscare"
NODE_ENV=development
PORT=3000
```

### 3. Setup Database
```bash
npx prisma migrate dev --name init
```

### 4. Create Upload Directory
```bash
mkdir -p uploads/issues
```

### 5. Run Server
```bash
npm start  # or npm run dev
```

### 6. Test API
```bash
# Create issue
curl -X POST http://localhost:3000/api/issues \
  -F "userId=1" \
  -F "title=Test Issue" \
  -F "description=Test description" \
  -F "category=Plumbing" \
  -F "location=Building A" \
  -F "image=@image.jpg"

# Get all issues
curl http://localhost:3000/api/issues

# Get issue by ID
curl http://localhost:3000/api/issues/1

# Get my issues
curl http://localhost:3000/api/issues/user/1
```

## File Structure
```
src/
  controllers/
    todoController.js  <- Issue creation logic
  routes/
    todoRoutes.js      <- API routes
  middleware/
    auth.js            <- Authentication
prisma/
  schema.prisma        <- Database schema
frontend/
  pages/
    SubmitIssue.jsx    <- Submit form UI
tests/
  issueSubmission.test.js  <- Test cases
docs/
  PERSON_3_API.md      <- API docs
  PERSON_3_SETUP.md    <- This file
```

## Common Issues

**Q: Image upload not working?**
A: Verify `uploads/issues` directory exists and is writable.

**Q: 403 error on submission?**
A: Check user role is "Community Member" in database.

**Q: Form validation failing?**
A: Ensure all required fields are provided and correctly formatted.
```

**Action:**
- [ ] Create `docs/PERSON_3_SETUP.md`
- [ ] Include all setup steps
- [ ] Include curl examples
- [ ] Include troubleshooting section

---

## 📊 CHECKLIST: COMPLETE IMPLEMENTATION

### Database & Schema
- [ ] Issue model has: id, title, description, status, category, location, image, userId, createdAt, updatedAt
- [ ] Migration created and applied successfully
- [ ] Database verified with prisma studio

### Backend Controller
- [ ] All validation implemented (title, description, category, location, userId, role, image)
- [ ] Error codes are consistent and documented
- [ ] Image upload works with file size and type validation
- [ ] Timestamps auto-generated
- [ ] User-issue relationship verified

### Backend Routes
- [ ] POST /api/issues with image upload middleware
- [ ] GET /api/issues (all issues)
- [ ] GET /api/issues/:id (single issue)
- [ ] GET /api/issues/user/:userId (my issues)
- [ ] All routes return consistent JSON structure

### Frontend Form
- [ ] Form fields: title, description, category, location, image
- [ ] Client-side validation on all fields
- [ ] Image preview functionality
- [ ] Success/error messages display
- [ ] Form clears after successful submission
- [ ] Redirect to my-issues after submission

### Testing
- [ ] All 7 API test cases pass
- [ ] All 12 frontend test cases pass
- [ ] Error handling verified
- [ ] Image upload tested (valid and invalid)
- [ ] Role authorization tested

### Documentation
- [ ] API documentation complete with examples
- [ ] Setup guide complete with curl commands
- [ ] Error codes documented
- [ ] File structure documented

---

## 🎯 DELIVERABLES FOR PERSON 3

**By end of sprint, deliver:**

1. ✅ Updated database schema with migrations
2. ✅ Enhanced backend controller with full validation
3. ✅ Updated routes with image upload
4. ✅ Complete frontend form with validation
5. ✅ Test results (pass/fail for all cases)
6. ✅ API documentation
7. ✅ Setup guide
8. ✅ Code committed to `andrew` branch
9. ✅ Ready for code review by team lead

---

## 💬 ENGINEERING NOTES (Multinational Best Practices)

**Why this approach is production-grade:**

1. **Validation at multiple layers:** Frontend (UX) + Backend (Security)
2. **Clear error codes:** Enables frontend to provide specific user guidance
3. **File upload safety:** Mime type + size validation + unique filenames
4. **Role-based access:** Only Community Members can submit
5. **Audit trail:** createdAt/updatedAt for compliance
6. **Scalability:** Image upload to disk allows future CDN migration
7. **API consistency:** All responses follow same structure
8. **Documentation:** New team members can onboard quickly

**Next sprint considerations:**
- Rate limiting on submissions (prevent spam)
- Image compression before storage
- S3/cloud storage integration
- Email notification when issue created
- Issue search/filtering enhancements

---

**Owner:** Andrew (Person 3)  
**Status:** Ready for Implementation  
**Estimated Time:** 2-3 days  
**Dependencies:** None (other features wait for this)
```

**Action:**
- [ ] Create file
- [ ] Review all sections
- [ ] Understand all requirements
- [ ] Start implementation

Now let me save this to your project and create a progress tracking file:
