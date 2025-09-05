import React from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './PricingPage.css';

const plans = [
  {
    name: 'Básico',
    price: 'R$ 99/mês',
    features: [
      'Agendamento online',
      'Gestão de pacientes',
      'Lembretes automáticos'
    ],
  },
  {
    name: 'Profissional',
    price: 'R$ 199/mês',
    features: [
      'Tudo do Básico',
      'Pagamentos integrados',
      'Relatórios inteligentes',
    ],
    highlight: true,
  },
  {
    name: 'Premium',
    price: 'R$ 299/mês',
    features: [
      'Tudo do Profissional',
      'Suporte prioritário',
      'Treinamento personalizado',
    ],
  },
];

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const PricingPage: React.FC = () => (
  <>
    <Header />
    <main className="pricing-main">
      {/* Hero Section */}
      <motion.section
        className="pricing-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h1 className="pricing-title">Planos e Preços</h1>
        <p className="pricing-subtitle">
          Escolha o plano ideal para sua clínica odontológica.
        </p>
      </motion.section>

      {/* Pricing Grid */}
      <motion.section
        className="pricing-grid-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="pricing-grid">
          {plans.map((plan) => (
            <motion.div
              className={`pricing-card ${plan.highlight ? 'highlight' : ''}`}
              key={plan.name}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-price">{plan.price}</p>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <button className="plan-button">Assinar</button>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </main>
    <Footer />
  </>
);

export default PricingPage;
