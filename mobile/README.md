````md id="r8m2qp"
# CampusCare Mobile App

React Native Expo application for the CampusCare issue management system.

## Project Structure

```bash
mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API services
│   ├── styles/           # Style definitions
│   ├── assets/           # Images and assets
│   ├── theme/            # Colors and theme constants
│   ├── context/          # React context providers
│   └── utils/            # Utility functions
├── App.js                # Main app component
└── package.json          # Dependencies
````

---

## Setup Instructions

### 1. Navigate to mobile directory

```bash
cd mobile
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the Expo development server

```bash
npx expo start
```

### 4. Run the app

* Android:

  ```bash
  npm run android
  ```

* iOS:

  ```bash
  npm run ios
  ```

* Web:

  ```bash
  npm run web
  ```

* Expo Go:
  Scan the QR code generated in the terminal.

---

## Features Implemented

### Authentication

* User registration
* Login/logout
* OTP verification
* Password reset
* Role-based authentication

### Issue Management

* Submit issue
* Upload issue image
* Issue status tracking
* Comments system
* Worker assignment
* Completion photo uploads

### Roles Supported

* Community Member
* Worker
* Facility Manager
* Admin

### Worker Features

* Assigned issues
* Mark issue in progress
* Upload completion proof
* Mark issue completed

### Manager Features

* Assign workers
* Resolve/reject issues
* Request rework
* Worker management

---

## API Integration

Backend base URL:

```txt
http://localhost:3000/api
```

### Main Endpoints

* `POST /api/auth/login`
* `POST /api/auth/register`
* `GET /api/issues`
* `POST /api/issues`
* `PUT /api/issues/:id/status`
* `POST /api/issues/:id/completion-photo`
* `GET /api/manager/issues`

---

## Shared Components

* CustomButton
* CustomInput
* LoadingSpinner
* StatusBadge
* IssueCard
* ScreenHeader
* EmptyState
* ErrorMessage

---

## Navigation

Uses React Navigation with role-based navigation structure.

---

## Technologies Used

* React Native
* Expo
* React Navigation
* Axios
* Context API
* Node.js Backend
* Prisma ORM
* PostgreSQL

---

## Backend Requirements

Ensure backend server is running on:

```txt
http://localhost:3000
```

---

## Testing

### Test Authentication

1. Register account
2. Login
3. Verify OTP
4. Reset password

### Test Issue Flow

1. Submit issue
2. Upload image
3. Assign worker
4. Mark in progress
5. Upload completion photo
6. Resolve issue

---

## Notes

* Expo SDK 54
* Uses Prisma with PostgreSQL
* Supports image uploads
* Includes role-based access control

```
```
