# Job Application Tracker

[![CI](https://github.com/feernandoignacio/job-application-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/feernandoignacio/job-application-tracker/actions/workflows/ci.yml)

A full stack web application to organize and track job applications. Each user creates an account and manages their own applications, stored in a PostgreSQL database.

**Live demo:** https://lucas-job-tracker.vercel.app

## Features

- Sign up and log in with email and password, or continue with Google
- Add applications with company, position, status and job link
- Change the status of an application directly from its card
- Edit the details of an application and keep notes for each one
- Filter applications by status, with a count for each one
- Delete applications, with a confirmation step
- Shows the name of the logged user at the top of the page
- Log out from any device, which invalidates the session token
- Each user only sees their own applications
- Responsive layout for desktop and mobile

## Tech stack

**Front end**

- React
- TypeScript
- Vite

**Back end**

- Node.js
- Express
- TypeScript
- PostgreSQL (hosted on Neon)

**Tools**

- Vercel (deploy of the front end and the API)
- Node.js test runner and GitHub Actions (CI)
- Prettier and Oxlint

## Architecture

```
Browser ──> lucas-job-tracker.vercel.app (React)
              │
              │  /api/*  (Vercel rewrite)
              ▼
            Express API (Vercel) ──> PostgreSQL (Neon)
```

The front end calls `/api/...` and Vercel forwards these requests to the API. In development the Vite proxy does the same job. Because the browser only talks to one origin, there is no need for CORS.

## Security

- Google sign in sends an ID token that the API verifies with Google before creating the session
- Passwords are hashed with **scrypt** and a random salt, so they are never stored in plain text
- Login returns a random session token. Only its **SHA-256 hash** is stored in the database
- Sessions expire after 30 days, and logging out deletes the session
- After 5 wrong passwords in 15 minutes, the email is blocked for 15 minutes. The attempts are stored in the database, so the limit works even with several instances of the API running
- Protected routes check the `Authorization: Bearer <token>` header in a middleware
- Every query filters by the logged user, so one user can't read or change another user's data (the API answers 404 instead of 403 to avoid revealing which ids exist)
- All SQL queries use parameters (`$1, $2...`) to prevent SQL injection
- Database credentials live in environment variables and are never committed

## API

| Method | Route               | Auth | Description                   |
| ------ | ------------------- | ---- | ----------------------------- |
| GET    | `/health`           | No   | Checks if the API is running  |
| POST   | `/auth/register`    | No   | Creates an account            |
| POST   | `/auth/login`       | No   | Returns a session token       |
| POST   | `/auth/google`      | No   | Logs in with a Google account |
| GET    | `/auth/me`          | Yes  | Returns the logged user       |
| POST   | `/auth/logout`      | Yes  | Deletes the current session   |
| GET    | `/applications`     | Yes  | Lists the user's applications |
| POST   | `/applications`     | Yes  | Creates an application        |
| PATCH  | `/applications/:id` | Yes  | Updates the sent fields       |
| DELETE | `/applications/:id` | Yes  | Deletes an application        |

## Running locally

You need Node.js 24 and a PostgreSQL database (a free one on [Neon](https://neon.com) works).

```bash
git clone https://github.com/feernandoignacio/job-application-tracker.git
cd job-application-tracker
```

**API**

```bash
cd api
npm install
cp .env.example .env   # then paste your database URL (and Google client ID) in .env
npm run dev
```

The API runs on http://localhost:3333 and creates the tables on the first run.

**Front end** (in another terminal)

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:5173.

## Tests

The API has integration tests that start the server and call the real routes against a PostgreSQL database. They cover sign up, login, the login attempts limit, the CRUD of applications, logout and, most important, that one user can't read or change another user's data.

```bash
cd api
npm test
```

To run them locally, create an `api/.env.test` file with the URL of a database used only for tests. On every push, GitHub Actions runs the tests with a temporary PostgreSQL, checks the types and the formatting, and builds the front end.

## Project structure

```
job-application-tracker/
├── web/   # front end (React + TypeScript)
└── api/   # REST API (Node.js + Express + PostgreSQL)
```

## Roadmap

- [x] REST API with Node.js
- [x] Authentication with sessions
- [x] PostgreSQL database
- [x] Edit application details
- [x] Notes for each application
- [x] Limit login attempts
- [x] Automated tests and CI
- [x] Sign in with Google
- [ ] New visual design
