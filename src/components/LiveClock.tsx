import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  className?: string;
}

/**
 * Isolated live date/time display — only this component re-renders every second.
 */
export const LiveClock: React.FC<LiveClockProps> = ({ className = 'font-bold' }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <span className={className}>
        {now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).replace(/\//g, ' - ')}
      </span>
      <span className={className}>
        {now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      </span>
    </>
  );
};
