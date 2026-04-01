# GymOS API — Cloud Functions

Backend for the GymOS platform. Deployed as a Firebase HTTPS Cloud Function wrapping an Express.js app connected to MongoDB Atlas.

## Architecture

```
Firebase HTTPS Function (exports.api)
  └── Express App
        ├── /api          — Auth, CRM, Gym management
        ├── /public       — Public gym landing + Wompi webhooks
        └── /download     — File downloads
```

## Tech Stack

- **Runtime**: Node.js 20 (Firebase Cloud Functions Gen 1)
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Auth**: JWT
- **Payments**: Wompi (per-gym keys)

## Local Development

```bash
cd functions
cp .env.example .env   # Fill in your values
npm install
```

Run with Firebase emulator:
```bash
firebase emulators:start --only functions
```

The API will be at: `http://localhost:5001/gyms-4b30f/us-central1/api`

## Environment Variables (GitHub Secrets)

| Secret | Description |
|--------|-------------|
| `FIREBASE_TOKEN` | From `firebase login:ci` |
| `DATABASE` | MongoDB Atlas URI |
| `JWT_SECRET` | JWT signing secret |
| `JWT_AUTH_TOKEN_SECRET` | Auth token secret |
| `WOMPI_PUBLIC_KEY` | Platform Wompi public key |
| `WOMPI_PRIVATE_KEY` | Platform Wompi private key |
| `FRONTEND_URL` | e.g. `https://gyms-4b30f.web.app` |

## Deploy

Automatic on push to `main`. Or manually:

```bash
cd functions && npm install
firebase deploy --only functions --project gyms-4b30f
```

## API Endpoint (Production)

```
https://us-central1-gyms-4b30f.cloudfunctions.net/api
```
