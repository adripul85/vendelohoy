
### Vulnerability: Public Read Access to Users Collection
**Date:** 2024-10-10
**Component:** `firestore.rules`, `lib/users.ts`

**Learning:**
Firestore doesn't allow field-level read permissions. When public access to a document (like a user profile) is required but it contains sensitive PII, `allow read: if true;` is inherently insecure as it exposes the entire document.

**Prevention:**
Lock down the collection with `allow read: if request.auth != null;` (or tighter rules) and build a secure backend proxy (e.g. Vercel Serverless Function) that fetches the document via `adminDb`, strips all sensitive fields, and returns only the public, sanitized data to unauthenticated visitors. Update frontend functions to fall back to this proxy when the user is not authenticated.
