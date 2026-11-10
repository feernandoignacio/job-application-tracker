# Job Application Tracker

A web application to organize and track job applications, built with React and TypeScript.

**Live demo:** https://lucas-job-tracker.vercel.app

## Features

- Add applications with company, position, status and job link
- Change the status of an application directly from its card
- Filter applications by status, with a count for each one
- Delete applications
- Data is saved in the browser (localStorage), so nothing is lost on reload
- Responsive layout for desktop and mobile

## Tech stack

- React
- TypeScript
- Vite
- Prettier

## Running locally

```bash
git clone https://github.com/feernandoignacio/job-application-tracker.git
cd job-application-tracker/web
npm install
npm run dev
```

Then open http://localhost:5173.

## Project structure

```
job-application-tracker/
├── web/   # front end (React + TypeScript)
└── api/   # back end in Node.js (coming soon)
```

## Roadmap

- [ ] REST API with Node.js
- [ ] Edit application details
- [ ] Notes for each application
