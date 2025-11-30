import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface Step {
  id: number;
  label: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
          />
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted || isCurrent ? '#0ea5e9' : '#e5e7eb'
                }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isCompleted || isCurrent ? 'text-white shadow-lg' : 'text-gray-400'}
                  transition-all duration-300
                `}
              >
                {isCompleted ? (
                  <Check size={20} />
                ) : (
                  <span>{step.id}</span>
                )}
              </motion.div>
              <motion.p
                initial={false}
                animate={{
                  color: isCompleted || isCurrent ? '#0ea5e9' : '#9ca3af'
                }}
                className="text-xs mt-2 text-center absolute top-12 whitespace-nowrap"
              >
                {step.label}
              </motion.p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
