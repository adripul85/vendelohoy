interface RateLimitInfo {
    count: number;
    resetTime: number;
}

const memoryCache = new Map<string, RateLimitInfo>();

/**
 * Basic in-memory rate limiter for Vercel Serverless Functions.
 * Note: Vercel functions are stateless and spin up/down, so this cache is ephemeral
 * and scoped to the container. However, during a burst/DDoS attack, the container
 * stays alive to handle the flood, so this effectively blocks rapid-fire requests.
 */
export function checkRateLimit(ip: string, action: string, maxRequests: number, windowMs: number): { success: boolean, message?: string } {
    const now = Date.now();
    const key = `${action}:${ip}`;
    
    // Cleanup expired entries periodically to prevent memory leaks in long-running containers
    if (Math.random() < 0.1) {
        for (const [k, v] of memoryCache.entries()) {
            if (now > v.resetTime) {
                memoryCache.delete(k);
            }
        }
    }

    let info = memoryCache.get(key);

    if (!info || now > info.resetTime) {
        // First request or window expired
        info = {
            count: 1,
            resetTime: now + windowMs
        };
        memoryCache.set(key, info);
        return { success: true };
    }

    if (info.count >= maxRequests) {
        return { 
            success: false, 
            message: `Demasiadas peticiones. Intenta de nuevo en ${Math.ceil((info.resetTime - now) / 1000)} segundos.` 
        };
    }

    info.count += 1;
    memoryCache.set(key, info);
    
    return { success: true };
}
