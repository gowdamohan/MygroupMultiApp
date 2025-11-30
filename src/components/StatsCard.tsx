import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: string;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'vs last month',
  color = 'from-primary-500 to-primary-600',
  delay = 0
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          {isPositive && (
            <>
              <div className="flex items-center gap-1 text-success-600">
                <TrendingUp size={16} />
                <span className="text-sm">+{Math.abs(change)}%</span>
              </div>
              <span className="text-xs text-gray-500">{changeLabel}</span>
            </>
          )}
          {isNegative && (
            <>
              <div className="flex items-center gap-1 text-error-600">
                <TrendingDown size={16} />
                <span className="text-sm">{change}%</span>
              </div>
              <span className="text-xs text-gray-500">{changeLabel}</span>
            </>
          )}
          {change === 0 && (
            <span className="text-xs text-gray-500">No change {changeLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};
