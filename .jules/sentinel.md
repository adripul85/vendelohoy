## 2025-02-28 - Missing Authentication in api-handlers/dispatch-courier.ts
**Vulnerability:** The API handler `dispatch-courier.ts` skips validating the Firebase Auth token and explicitly mentions it's skipping it for 'sandbox' but allows anyone to dispatch a courier if they provide a random token.
**Learning:** Important endpoints must have proper authentication checks.
**Prevention:** Use `adminAuth.verifyIdToken` to validate the user making the request.
