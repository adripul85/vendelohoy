## 2024-08-04 - [CRITICAL] Remove Hardcoded Secrets in generate-items-browser.js
**Vulnerability:** A hardcoded Firebase API Key, Project ID, etc were found in the generate-items-browser.js file.
**Learning:** Hardcoded credentials should never be committed into source code. Always use environment variables.
**Prevention:** Utilize '.env' files or your CI/CD platform variables to manage secrets instead of hardcoding.

## 2024-08-04 - [CRITICAL] Fix unauthenticated courier dispatch endpoint
**Vulnerability:** The API endpoint `dispatch-courier.ts` lacked proper authentication token verification, only checking for its presence. The token was not decoded or validated against the transaction data.
**Learning:** API endpoints performing sensitive operations must thoroughly verify tokens and implement authorization checks (e.g., ensuring the authenticated user is the actual seller of the transaction).
**Prevention:** Always use secure verification libraries (e.g., `adminAuth.verifyIdToken`) and validate permissions before allowing state-changing operations.
