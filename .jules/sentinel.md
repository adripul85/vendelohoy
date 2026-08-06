## 2025-10-24 - [CRITICAL] Privilege Escalation via unprotected 'role' field
**Vulnerability:** Any user could update their own user document to set `role: 'admin'` because while `isAdmin` was protected in `firestore.rules`, `role` was not. This granted full admin access.
**Learning:** When multiple fields can grant administrative privileges (e.g., `isAdmin` and `role`), ALL such fields must be explicitly blocked in user update rules.
**Prevention:** Always verify that every field checked in authentication/authorization helper functions (like `isAdmin()`) is strictly protected from user manipulation in the `update` rules.
