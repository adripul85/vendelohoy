import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SlotProps extends HTMLMotionProps<any> {
    children?: React.ReactNode;
}

export const Slot = React.forwardRef<any, SlotProps>(({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
        return React.cloneElement(children, {
            ...props,
            ...children.props,
            ref: (node: any) => {
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as any).current = node;
                }
                const childRef = (children as any).ref;
                if (typeof childRef === 'function') {
                    childRef(node);
                } else if (childRef) {
                    childRef.current = node;
                }
            },
        } as any);
    }
    return <motion.div ref={ref} {...props}>{children}</motion.div>;
});

Slot.displayName = 'Slot';
