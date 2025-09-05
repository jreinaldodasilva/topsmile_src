/* FeatureCard.tsx */
import React from 'react';
import { motion } from 'framer-motion';
import './FeatureCard.css';

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
  <motion.div
    className="feature-card"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </motion.div>
);

export default FeatureCard;