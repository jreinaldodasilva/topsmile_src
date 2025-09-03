/* TestimonialCard.tsx */
import React from 'react';
import { motion } from 'framer-motion';
import './TestimonialCard.css';

export interface TestimonialCardProps {
  name: string;
  role: string;
  message: string;
  avatar: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, role, message, avatar }) => (
  <motion.div
    className="testimonial-card"
    whileHover={{ scale: 1.03 }}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <img className="testimonial-avatar" src={avatar} alt={name} />
    <p className="testimonial-message">"{message}"</p>
    <div className="testimonial-name">{name}</div>
    <div className="testimonial-role">{role}</div>
  </motion.div>
);

export default TestimonialCard;
