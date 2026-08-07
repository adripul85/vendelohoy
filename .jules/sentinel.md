## 2024-05-28 - Hardcoded MercadoPago Test Public Key
**Vulnerability:** A hardcoded MercadoPago test public key `TEST-c13f9948-4cb2-4753-9993-4fc3c0352778` was found as a fallback in `pages/marketplace/ProductDetail.tsx`.
**Learning:** Hardcoding credentials (even test ones) in client-side code poses a security risk and can lead to unintended usage or leakage of valid test environments. The application should solely rely on environment variables.
**Prevention:** Ensure no default or fallback API keys are present in the codebase. All keys should be managed via environment configurations.
