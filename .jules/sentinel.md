## 2025-02-28 - Removed Hardcoded MercadoPago Access Token
**Vulnerability:** A hardcoded test API Key (access token) for MercadoPago was discovered in `functions/src/index.ts` and `functions/test-mp.js`.
**Learning:** Hardcoded credentials exposed in backend or function source files pose a significant security risk, even if they are test keys, as they might be inadvertently deployed to production or leaked.
**Prevention:** Always use environment variables (`process.env.VARIABLE_NAME`) or Firebase Functions secrets to load sensitive credentials dynamically at runtime.
