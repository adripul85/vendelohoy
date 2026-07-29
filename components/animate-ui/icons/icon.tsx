import React, { useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { useIsInView } from '../../../hooks/use-is-in-view';

export interface AnimateIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    className?: string;
    trigger?: 'hover' | 'click' | 'in-view' | 'loop' | 'none';
    variants?: Variants;
    children?: React.ReactNode;
}

export const AnimateIcon: React.FC<AnimateIconProps> = ({
    size = 24,
    color = 'currentColor',
    className = '',
    trigger = 'hover',
    variants,
    children,
    ...props
}) => {
    const ref = useRef<SVGSVGElement>(null);
    const isInView = useIsInView(ref, { threshold: 0.2 });

    let animateState: any = undefined;
    let whileHover: any = undefined;
    let whileTap: any = undefined;

    if (trigger === 'hover') {
        whileHover = 'animate';
    } else if (trigger === 'click') {
        whileTap = 'animate';
    } else if (trigger === 'in-view') {
        animateState = isInView ? 'animate' : 'normal';
    } else if (trigger === 'loop') {
        animateState = 'animate';
    }

    return (
        <motion.svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`inline-block shrink-0 ${className}`}
            initial="normal"
            animate={animateState}
            whileHover={whileHover}
            whileTap={whileTap}
            variants={variants}
            {...(props as any)}
        >
            {children}
        </motion.svg>
    );
};

export default AnimateIcon;
