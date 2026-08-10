# Sentinel Security Log\n\n## Vulnerability: Permissive Global Marketing Reads in firestore.rules\n\n**Learning:** Exposed marketing collections could be scraped or accessed by unauthenticated malicious actors. By default, marketing materials might be thought of as public, but restricting read access to  prevents unauthorized data aggregation by scripts while preserving authenticated user experience.\n\n**Prevention:** Default to restricting read access in  (and similarly for other resources) to authenticated users unless there is a strong, documented requirement for public (unauthenticated) access.
## Vulnerability: Permissive Global Marketing Reads in firestore.rules

**Learning:** Exposed marketing collections could be scraped or accessed by unauthenticated malicious actors. Restricting read access to `request.auth != null` prevents unauthorized data aggregation by scripts while preserving authenticated user experience.

**Prevention:** Default to restricting read access in `firestore.rules` (and similarly for other resources) to authenticated users unless there is a strong, documented requirement for public (unauthenticated) access.
