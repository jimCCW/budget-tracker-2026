---
name: backend-jsdoc
description: >
  Enforces JSDoc comments on backend TypeScript functions in this project.
  ALWAYS invoke this skill automatically — without waiting to be asked — after
  any code change (create or edit) to files under backend/src/services/,
  backend/src/controllers/, or backend/src/middleware/. This is a mandatory
  post-edit step: after writing or modifying any function in those directories,
  immediately check every function in the changed file and add or update its
  JSDoc block before reporting the task as done.
  Also trigger when the user says things like "add comments to the backend",
  "document this function", or "update the JSDoc".
---

# Backend JSDoc Style Guide

Every function in `backend/src/services/`, `backend/src/controllers/`, and
`backend/src/middleware/` must have a `/** ... */` JSDoc block immediately above
it. Add one when creating a function; update it when the function's behaviour changes.

## Skip these — no comments needed

- `backend/src/schemas/*.ts` — Zod schemas are self-describing via field names
- `backend/src/routes/*.ts` — route registrations, no standalone functions
- `backend/src/index.ts` — bootstrap code only

---

## Format by function type

Keep **every tag to one line**. Never write multi-paragraph docstrings.

### Private / helper functions

Single-line summary is enough.

```ts
/** Generates a random 5-digit numeric code as a string. */
function generateCode(): string { ... }

/** Returns a Date 15 minutes from now, used as the activation code expiry. */
function codeExpiry(): Date { ... }
```

### Service functions (exported, business logic)

Full block with `@param`, `@returns`, and a `@throws` line for **every distinct
error case** — include the error code and the condition that causes it.

```ts
/**
 * Creates a new inactive user account and sends a 5-digit activation code.
 * @param data - Registration payload: email, plain-text password, and full name.
 * @returns The email address of the newly created account.
 * @throws CONFLICT (409) if the email is already registered.
 */
export async function register(data: { email: string; password: string; name: string }) { ... }
```

```ts
/**
 * Validates the activation code and marks the account as active. Idempotent if already active.
 * @param data - Object with the user's email and submitted 5-digit code.
 * @returns A success message string.
 * @throws NOT_FOUND (404) if no account exists for the email.
 * @throws VALIDATION_ERROR (400) if the code is wrong or has expired.
 */
export async function activateAccount(data: { email: string; code: string }) { ... }
```

### Controllers (Express request handlers)

Include the HTTP method, route path, and the success response shape on one line.

```ts
/**
 * POST /api/auth/register — Creates a new user account and sends an activation code.
 * Responds 201 with `{ email }` on success.
 */
export async function registerController(req: Request, res: Response, next: NextFunction) { ... }
```

### Middleware factories (functions that return middleware)

Describe what the returned middleware does and when it short-circuits.

```ts
/**
 * Returns middleware that validates req.body against the given Zod schema.
 * Responds 400 with the first validation error if the body is invalid; calls next() on success.
 * @param schema - The Zod schema to validate against.
 */
export function validate(schema: ZodSchema) { ... }
```

### Standalone middleware

Describe what it enforces and when it returns an error.

```ts
/**
 * Validates the Bearer JWT in the Authorization header and attaches the decoded payload to req.user.
 * Returns 401 if the token is missing or invalid.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void { ... }
```

### Global error handlers

Explain the two paths: known app errors vs unexpected errors.

```ts
/**
 * Global Express error handler — must be registered last with app.use(errorHandler).
 * Forwards known app errors (with status + code) directly to the client;
 * logs and returns 500 for anything unexpected.
 */
export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void { ... }
```

---

## Checklist after editing any backend file

1. **New function added** → write a JSDoc block before finishing.
2. **Existing function modified** → review its JSDoc and update if the behaviour changed.
3. **Existing function untouched** → leave its JSDoc as-is.
