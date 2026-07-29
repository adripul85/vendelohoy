import { useEffect, useState, useRef, RefObject } from 'react';

export function useIsInView(
    ref: RefObject<Element | null>,
    options: IntersectionObserverInit = { threshold: 0.1 }
) {
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        }, options);

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [ref, options.root, options.rootMargin, options.threshold]);

    return isInView;
}
