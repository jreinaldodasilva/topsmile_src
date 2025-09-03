/* FeaturesSection.tsx */
import React from 'react';
import { FaCalendarAlt, FaGoogle, FaFileMedical, FaCreditCard, FaSmile } from 'react-icons/fa';
import FeatureCard from '../FeatureCard/FeatureCard';
import './FeaturesSection.css';

const features = [
  {
    title: 'Agenda Simples & Call Center',
    description: 'Organize seu consultório facilmente com uma agenda intuitiva.',
    icon: () => <FaCalendarAlt size={32} color="#4A90E2" />,
  },
  {
    title: 'Sincronização com Google Agenda',
    description: 'Mantenha todos os compromissos sincronizados automaticamente.',
    icon: () => <FaGoogle size={32} color="#DB4437" />,
  },
  {
    title: 'Prontuário Digital Completo',
    description: 'Acesse o histórico clínico de seus pacientes com facilidade.',
    icon: () => <FaFileMedical size={32} color="#00C851" />,
  },
  {
    title: 'Controle Financeiro',
    description: 'Gerencie receitas e despesas com relatórios detalhados.',
    icon: () => <FaCreditCard size={32} color="#ffbb33" />,
  },
  {
    title: 'CRM para Encantamento',
    description: 'Mantenha um relacionamento próximo com seus pacientes.',
    icon: () => <FaSmile size={32} color="#5E35B1" />,
  },
];

const FeaturesSection: React.FC = () => (
  <section id="features" className="features-section">
    <h2 className="features-title">Recursos do TopSmile</h2>
    <div className="features-grid">
      {features.map(feature => (
        <FeatureCard
          key={feature.title}
          title={feature.title}
          description={feature.description}
          icon={feature.icon()}
        />
      ))}
    </div>
  </section>
);

export default FeaturesSection;
