import React from 'react';
import { motion } from 'motion/react';
import { Application } from '../data/applications';
import { ArrowRight } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onClick }) => {
  const Icon = application.icon;
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="group relative h-full"
    >
      <div
        onClick={onClick}
        className="relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full border border-gray-100 hover:border-transparent"
      >
        {/* Gradient Background on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${application.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        <div className="relative p-8 flex flex-col h-full">
          {/* Icon Container */}
          <div className="mb-6">
            <motion.div 
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${application.color} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Icon className="text-white" size={32} />
            </motion.div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col">
            <h4 className="text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {application.name}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed flex-1">
              {application.tagline}
            </p>
          </div>
          
          {/* Action Button - Shows on Hover */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-primary-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <span className="text-sm">Access Portal</span>
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Premium Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/20 group-hover:via-transparent group-hover:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </motion.div>
  );
};
