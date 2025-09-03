import React from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './FeaturesPage.css';

const features = [
  { icon: '🗓️', title: 'Agendamento Online', description: 'Permita que seus pacientes agendem consultas facilmente pela internet, a qualquer hora.' },
  { icon: '📱', title: 'Gestão de Pacientes', description: 'Organize informações, histórico e contatos dos pacientes de forma segura e centralizada.' },
  { icon: '🔔', title: 'Lembretes Automáticos', description: 'Envie lembretes automáticos por SMS ou WhatsApp para reduzir faltas e atrasos.' },
  { icon: '💳', title: 'Pagamentos Integrados', description: 'Receba pagamentos online de forma prática e segura, integrado ao sistema.' },
  { icon: '📊', title: 'Relatórios Inteligentes', description: 'Acompanhe indicadores, produtividade e resultados com relatórios visuais e fáceis de entender.' },
  { icon: '🔒', title: 'Segurança de Dados', description: 'Proteção total das informações dos pacientes, conforme a LGPD.' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const FeaturesPage: React.FC = () => (
  <>
    <Header />
    <main className="features-main">
      <motion.section
        className="features-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h1 className="features-title">Benefícios do TopSmile</h1>
        <p className="features-subtitle">
          Descubra como o TopSmile pode transformar a gestão da sua clínica odontológica.
        </p>
      </motion.section>

      <motion.section
        className="features-grid-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="features-grid">
          {features.map((feature) => (
            <motion.div
              className="feature-card"
              key={feature.title}
              variants={cardVariants}
              whileHover={{ scale: 1.05, boxShadow: '0px 8px 20px rgba(0,0,0,0.15)' }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-desc">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </main>
    <Footer />
  </>
);

export default FeaturesPage;
