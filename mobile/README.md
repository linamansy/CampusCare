# CampusCare Mobile App

React Native Expo application for CampusCare issue management system.

## Project Structure

```
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
```

## Setup Instructions

1. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

2. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on device/emulator**:
   - For Android: `npm run android`
   - For iOS: `npm run ios`
   - For web: `npm run web`

## Implemented Features (Person 3)

### SubmitIssueScreen
- ✅ Issue title input with validation (max 100 chars)
- ✅ Issue description input with validation (max 1000 chars)
- ✅ Category selection (Plumbing, Electrical, HVAC, Cleaning, Maintenance, Other)
- ✅ Location input with validation (max 200 chars)
- ✅ Image upload using Expo Image Picker (optional, max 5MB)
- ✅ Form validation with error messages
- ✅ Loading states during submission
- ✅ Success/error alerts
- ✅ API integration with backend

## API Integration

The app connects to the backend API at `http://localhost:3000/api`

### Endpoints Used
- `POST /api/issues` - Submit new issue with optional image

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

## Shared Components

All components follow the design system:

- **CustomButton**: Primary action buttons
- **CustomInput**: Form input fields with validation
- **LoadingSpinner**: Loading indicators
- **StatusBadge**: Issue status indicators
- **IssueCard**: Issue display cards
- **ScreenHeader**: Consistent screen headers
- **EmptyState**: Empty state displays
- **ErrorMessage**: Error handling displays

## Color System

Uses the official CampusCare color palette defined in `src/theme/colors.js`

## Navigation

Currently implements Stack Navigation with room for role-based routing.

## Testing

Test the SubmitIssueScreen by:
1. Filling out all required fields
2. Selecting a category
3. Optionally adding a photo
4. Submitting the form
5. Verifying success/error handling

## Next Steps

Implement remaining screens according to team assignments:
- Person 1: RegisterScreen, LoginScreen
- Person 2: Session handling, role-based navigation
- Person 4: MyIssuesScreen
- Person 5: IssueDetailScreen
- Person 6: DashboardScreen
- Person 7: Assign worker functionality
- Person 8: Worker screens

## Backend Requirements

Ensure the backend server is running on `http://localhost:3000` with the API endpoints implemented.