## 🔒 Security Vulnerability
**Vulnerability:** Insecure Firestore Rule: Overly Permissive Create on Store Events
**Learning:** The rule `allow create: if true;` for `/store_events/{document=**}` exposed the database to arbitrary document creation by unauthenticated users, leading to potential denial of service or storage abuse.
**Prevention:** Always require authentication (`request.auth != null`) for write operations in Firestore rules, unless the collection is explicitly designed for anonymous input with strict validation and rate limiting.
