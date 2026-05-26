---
name: dev-start
description: Starts the full development environment for this project — PostgreSQL database (Docker), Express backend, and Next.js frontend. Use this skill ONLY when the user explicitly asks to start the dev servers, start services, start the app, spin up the stack, or similar deliberate startup requests. Do NOT invoke automatically or when the user is just asking questions about the project.
---

# Start Dev Services

Start the full local development environment: database, backend, and frontend.

## Steps

1. **Get project root and detect OS:**
   ```bash
   pwd          # absolute project root path
   uname -s     # Darwin = macOS, Linux = Linux; if command fails, assume Windows
   ```

2. **Start the database** (all platforms):
   ```bash
   docker-compose up -d
   ```
   PostgreSQL starts in the background on port 5432. If this fails, Docker Desktop is likely not running — tell the user.

3. **Open a separate terminal window for the backend**, using the OS-appropriate command:

   **macOS (Darwin):**
   ```bash
   osascript -e 'tell application "Terminal"
     activate
     do script "cd <PROJECT_ROOT>/backend && pnpm dev"
   end tell'
   ```

   **Windows:**
   ```cmd
   start "Backend" cmd /k "cd /d <PROJECT_ROOT>\backend && pnpm dev"
   ```

   **Linux** (try in order — use whichever is available: gnome-terminal, konsole, xterm):
   ```bash
   gnome-terminal -- bash -c "cd <PROJECT_ROOT>/backend && pnpm dev; exec bash"
   # or: xterm -e "cd <PROJECT_ROOT>/backend && pnpm dev; bash" &
   # or: konsole -e bash -c "cd <PROJECT_ROOT>/backend && pnpm dev; exec bash" &
   ```

4. **Open a separate terminal window for the frontend** using the same OS pattern, substituting `frontend` for `backend`.

5. **Tell the user** the services are starting:
   - PostgreSQL (Docker) — port 5432
   - Backend dev server — port 4000
   - Frontend dev server — port 3000

## Notes
- Substitute the actual absolute path from step 1 into all terminal commands.
- Do not run `pnpm install` unless the user explicitly asks; assume dependencies are already installed.
