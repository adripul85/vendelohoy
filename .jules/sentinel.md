## 2024-05-24 - [Fix authorization bypass in dispatch-courier endpoint]
**Vulnerability:** The api-handlers/dispatch-courier.ts endpoint allowed anyone to bypass authorization by sending any string prefixed with "Bearer ".
**Learning:** The sandbox API had commented out verification for ease of use but left it in a deployable route.
**Prevention:** Always ensure that endpoints verify tokens using `adminAuth.verifyIdToken(token)` instead of just checking for the presence of a "Bearer " string.
