# OpenLearn

> Last Updated: 2026-04-29

## Overview

OpenLearn is a learning platform project built to make online learning feel clear, structured, and easier to explore. The project currently includes a homepage, about page, contact page, sign-up page, login page, profile page, courses, paths, and careers pages.

## Recent Updates

- Added backend-backed sign up, login, logout, and session handling
- Added per-user learner progress and saved-item persistence
- Added a richer profile page with settings and password update flow
- Refactored the resource listing pages to use a shared browser script
- Added automated backend tests with `node --test`
- Kept contact message saving with the local Node server

## Why We Used JSON For Now

The contact system currently saves submissions in `message.json`.

Reason:
- simple to build
- easy to test
- good for early-stage development
- easy to replace later with a database

This is still a file-backed setup. Later, OpenLearn can be upgraded to use a proper backend database.

## Project Structure

```text
OpenLearn/
|-- index.html
|-- about.html
|-- contact.html
|-- signup.html
|-- login.html
|-- profile.html
|-- style.css
|-- nav.js
|-- auth.js
|-- learner.js
|-- resource-browser.js
|-- contact.js
|-- server.js
|-- package.json
|-- start-openlearn.bat
|-- message.json
|-- users.json
|-- learner-state.json
|-- sessions.json
|-- data.json
|-- paths-data.json
|-- careers-data.json
|-- README.md
|-- tests/
|-- courses/
|-- paths/
|-- careers/
|-- guide/
```

## Contact Message Flow

When a user sends a message from the Contact page:

1. The user fills out the form in `contact.html`
2. `contact.js` validates the fields
3. The form sends data to `/api/messages`
4. `server.js` receives the request
5. The message is saved into `message.json`

Each saved entry contains:

- `id`
- `type`
- `name`
- `email`
- `message`
- `createdAt`

## Files Related To Contact Saving

### `contact.html`

- contact form UI
- includes `Contact`, `Help`, and `Feedback` message types

### `contact.js`

- checks whether the local API is running
- sends form data to the backend
- shows success and error messages on the page

### `server.js`

- serves the local website
- exposes `/api/health`
- exposes `/api/messages`
- exposes auth APIs for sign up, login, logout, profile update, and password change
- exposes learner-state APIs for saved items and progress
- saves contact messages into `message.json`

## Account And Learner Flow

When a user creates an account or logs in:

1. The auth form sends data to the backend API
2. `server.js` validates the request and hashes passwords
3. A session cookie is created for the browser
4. The user is redirected to `profile.html`
5. Saved items and learning progress are loaded from the backend

Current account-related storage files:

- `users.json`
- `learner-state.json`
- `sessions.json`

### `message.json`

- stores submitted messages locally
- acts as temporary storage until a database is added

### `start-openlearn.bat`

- starts the local Node server on Windows

## How To Run The Project

### Option 1: Start with npm

```bash
npm start
```

### Option 2: Start with the Windows batch file

Double-click:

```text
start-openlearn.bat
```

After the server starts, open:

```text
http://localhost:3000
```

For the contact form specifically, use:

```text
http://localhost:3000/contact.html
```

Important:
- keep the terminal window open while testing
- do not rely on opening `contact.html` directly from the file system if you want message saving to work

## Available Script

### `npm start`

Runs:

```text
node server.js
```

This starts OpenLearn on:

```text
http://localhost:3000
```

### `npm test`

Runs:

```text
node --test
```

This verifies the backend auth, profile update, password change, and learner-state flow.

## Troubleshooting

### Problem: Contact form says local server is not running

Solution:
- run `npm start`
- or double-click `start-openlearn.bat`
- keep the terminal open
- open `http://localhost:3000/contact.html`

### Problem: Contact form says unable to save message

Solution:
- make sure the server is running
- refresh the page after starting the server
- make sure `message.json` exists in the project root
- test again from `http://localhost:3000/contact.html`

### Problem: Messages are not showing in `message.json`

Solution:
- confirm the form was submitted successfully
- check the terminal for server errors
- make sure you are using the running local server

## Future Upgrade Plan

Later, this setup can be improved with:

- database storage
- admin dashboard for reading messages
- email notifications
- Google OAuth login
- better form management

## Founder Note

OpenLearn started from a simple idea: learning online should feel clear and structured, not confusing. The platform is still evolving, and the goal is to continue improving it into a place where learning feels simple, focused, and meaningful.
