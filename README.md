# CampusCare

A campus maintenance management system built with React Native (Expo) and Node.js/Express/Prisma/Supabase. Community members report facility issues, workers resolve them, and facility managers oversee the entire workflow.

---

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

> Contact the team lead for the actual Supabase credentials.

### 2c. Apply the database schema

```bash
npx prisma db push
```

To view the database visually:

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

# Supabase (same values as backend)
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

### 3e. Open the app

| Platform | How to run |
|---|---|
| **Physical device** | Install Expo Go → scan the QR code from the terminal |
| **iOS Simulator (Mac)** | Press `i` in the terminal (requires Xcode) |
| **Android Emulator** | Press `a` in the terminal (requires Android Studio) |
| **Web browser** | Press `w` in the terminal |

---

## Step 4 — Running Both Simultaneously

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd CampusCare
node index.js
```

**Terminal 2 — Mobile:**
```bash
cd CampusCare/mobile
npx expo start
```

---

## Test Accounts

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
| `ECONNREFUSED` on mobile | Ensure backend is running; use your machine's IP (not `localhost`) in `EXPO_PUBLIC_API_BASE_URL` for physical devices |
| `max clients reached` Supabase error | Kill stale node processes: `pkill -f "node.*index.js"` then restart |
| `Token expired` on login | Log out and back in to get a fresh JWT |
| Expo QR not scanning | Ensure your phone and computer are on the same Wi-Fi network |
| `prisma: command not found` | Use `npx prisma` instead of `prisma` directly |

---

## Documentation

Full project documentation (API reference, database schema, project structure) is in [`DOCUMENTATION.md`](./DOCUMENTATION.md).
