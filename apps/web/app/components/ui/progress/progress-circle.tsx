import { useEffect, useState } from 'react';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressCircle({
  percentage = 75,
  size = 120,
  strokeWidth = 8,
  className = '',
}: ProgressCircleProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className='-rotate-90 transform'>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='currentColor'
          strokeWidth={strokeWidth}
          fill='transparent'
          className='text-gray-200'
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='currentColor'
          strokeWidth={strokeWidth}
          fill='transparent'
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap='round'
          className='text-blue-500 transition-all duration-1000 ease-out'
        />
      </svg>
      {/* Percentage text */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='text-2xl font-semibold text-gray-700'>
          {Math.round(animatedPercentage)}%
        </span>
      </div>
    </div>
  );
}
