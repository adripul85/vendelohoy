import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: Date | any;
    className?: string;
    onEnd?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = "", onEnd }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: string, minutes: string, seconds: string } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const date = targetDate instanceof Date ? targetDate : (targetDate?.toDate?.() || new Date(targetDate));
            const difference = +date - +new Date();

            if (difference > 0) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({
                    hours: hours.toString().padStart(2, '0'),
                    minutes: minutes.toString().padStart(2, '0'),
                    seconds: seconds.toString().padStart(2, '0')
                });
            } else {
                setTimeLeft(null);
                if (onEnd) onEnd();
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, [targetDate, onEnd]);

    if (!timeLeft) return null;

    return (
        <div className={`flex items-center gap-2 font-black text-xs tabular-nums ${className}`}>
            <div className="flex flex-col items-center">
                <span className="bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded-lg min-w-[30px] text-center shadow-lg shadow-inverse-surface/10">{timeLeft.hours}</span>
            </div>
            <span className="text-on-surface animate-pulse">:</span>
            <div className="flex flex-col items-center">
                <span className="bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded-lg min-w-[30px] text-center shadow-lg shadow-inverse-surface/10">{timeLeft.minutes}</span>
            </div>
            <span className="text-on-surface animate-pulse">:</span>
            <div className="flex flex-col items-center">
                <span className="bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded-lg min-w-[30px] text-center shadow-lg shadow-inverse-surface/10">{timeLeft.seconds}</span>
            </div>
        </div>
    );
};

export default CountdownTimer;
