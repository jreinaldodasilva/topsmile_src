/* PricingCard.tsx */
import React from 'react';
import { motion } from 'framer-motion';
import './PricingCard.css';

export interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  isRecommended?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, isRecommended = false }) => (
  <motion.div
    className={`pricing-card${isRecommended ? ' recommended' : ''}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h3 className="pricing-title">{title}</h3>
    <p className="pricing-price">{price}</p>
    <ul className="pricing-features">
      {features.map((feature, index) => (
        <li key={index}>{feature}</li>
      ))}
    </ul>
    <button className="pricing-button">Comece agora</button>
  </motion.div>
);

export default PricingCard;
