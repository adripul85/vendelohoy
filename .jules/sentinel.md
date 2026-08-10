
### Arbitrary File Upload via Insecure Firebase Storage Rules
- **Vulnerability**: The `isImage()` helper function in `storage.rules` used an overly permissive regex (`'image/.*'`) that allowed potentially malicious file types (like `image/svg+xml`) to be uploaded, risking Stored XSS. Furthermore, many collections (like `/avatars/`, `/items/`, `/chats/`, `/escrow/`, `/marketing/`, `/profiles/`, `/shops/`, and `/kyc/`) did not properly restrict file deletes, or applied the restrictions unevenly.
- **Learning**: Always use strict regexes for file type validation (`^image/(png|jpeg|jpg|gif|webp)$`) rather than broad wildcards, and separate `allow create, update` (which must check file contents) from `allow delete` (which only checks auth and ownership) to prevent delete operations from failing.
- **Prevention**: Use strict whitelists in file validations and separate rule logic for `delete` operations to ensure metadata rules do not unintentionally block file deletion.
