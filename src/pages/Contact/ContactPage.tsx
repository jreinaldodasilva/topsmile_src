import React from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ContactForm from '../../components/ContactForm';
import './ContactPage.css';

// Container for staggered animations
const formContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// Individual field animations
const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const ContactPage: React.FC = () => (
  <>
    <Header />
    <main className="contact-main">
      {/* Hero */}
      <motion.section
        className="contact-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h1 className="contact-title">Entre em Contato</h1>
        <p className="contact-subtitle">
          Fale conosco e descubra como o TopSmile pode ajudar a sua clínica.
        </p>
      </motion.section>

      {/* Contact Form Section */}
      <motion.section
        className="contact-section"
        variants={formContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="contact-card">
          <h2 className="form-title">Envie sua Mensagem</h2>

          {/* Animated Form Fields */}
          <motion.div variants={formContainerVariants}>
            <motion.div variants={fieldVariants}>
              <ContactForm />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </main>
    <Footer />
  </>
);

export default ContactPage;
