'use client';

import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FAQItem {
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
  className?: string;
  titleClassName?: string;
  variant?: 'default' | 'netflix' | 'spotify' | 'payment';
}

export function FAQ({ items, className, titleClassName, variant = 'default' }: FAQProps) {
  // Determine background gradient based on variant
  const getHeaderStyles = () => {
    switch (variant) {
      case 'netflix':
        return 'bg-gradient-to-r from-red-700 to-red-600 text-white';
      case 'spotify':
        return 'bg-gradient-to-r from-green-700 to-green-600 text-white';
      case 'payment':
        return 'bg-gradient-to-r from-indigo-700 to-indigo-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-800 to-gray-700 text-white';
    }
  };

  const getItemAccentColor = () => {
    switch (variant) {
      case 'netflix':
        return 'text-red-600 border-red-100 bg-red-50';
      case 'spotify':
        return 'text-green-600 border-green-100 bg-green-50';
      case 'payment':
        return 'text-indigo-600 border-indigo-100 bg-indigo-50';
      default:
        return 'text-gray-800 border-gray-100 bg-gray-50';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'netflix':
        return 'text-red-600';
      case 'spotify':
        return 'text-green-600';
      case 'payment':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => (
        <FAQItem 
          key={index} 
          item={item} 
          accentColor={getItemAccentColor()} 
          iconColor={getIconColor()}
          variant={variant}
          isFirst={index === 0}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  );
}

function FAQItem({ 
  item, 
  accentColor, 
  iconColor,
  variant,
  isFirst,
  isLast
}: { 
  item: FAQItem; 
  accentColor: string; 
  iconColor: string;
  variant: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Split accent color to get just the color name for the shadow
  const accentParts = accentColor.split(' ')[0]; // Gets "text-red-600" from "text-red-600 border-red-100 bg-red-50"
  const shadowColor = accentParts.replace('text-', ''); // Gets "red-600"

  return (
    <div 
      className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 ${
        isOpen ? `shadow-lg shadow-${shadowColor}/10` : 'shadow-sm'
      } transition-all duration-300`}
    >
      <button
        className={`flex justify-between items-center w-full p-5 text-left bg-white dark:bg-gray-950 ${
          isOpen ? accentColor.split(' ')[2] : ''
        } hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <div className={`mr-3 flex-shrink-0 ${iconColor}`}>
            {item.icon || <HelpCircle size={20} />}
          </div>
          <h3 className="text-base md:text-lg font-medium">{item.question}</h3>
        </div>
        <div className={`flex-shrink-0 ml-2 ${isOpen ? iconColor : 'text-gray-400'}`}>
          {isOpen ? (
            <Minus className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-5 pt-0 text-sm md:text-base text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="py-3"
              >
                {item.answer}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 