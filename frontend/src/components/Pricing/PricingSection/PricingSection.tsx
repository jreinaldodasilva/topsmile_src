/* PricingSection.tsx */
import React from 'react';
import PricingCard from '../PricingCard/PricingCard';
import './PricingSection.css';

const pricingPlans = [
  {
    title: 'Básico',
    price: 'R$ 49/mês',
    features: ['Agenda online', 'Suporte via e-mail', 'Prontuário digital'],
  },
  {
    title: 'Profissional',
    price: 'R$ 99/mês',
    features: ['Tudo do Básico', 'Integração com Google Agenda', 'Relatórios financeiros'],
    isRecommended: true,
  },
  {
    title: 'Premium',
    price: 'R$ 149/mês',
    features: ['Tudo do Profissional', 'CRM de pacientes', 'Prioridade no suporte'],
  },
];

const PricingSection: React.FC = () => (
  <section id="pricing" className="pricing-section">
    <h2 className="pricing-title">Planos e Preços</h2>
    <div className="pricing-grid">
      {pricingPlans.map(plan => (
        <PricingCard
          key={plan.title}
          title={plan.title}
          price={plan.price}
          features={plan.features}
          isRecommended={plan.isRecommended}
        />
      ))}
    </div>
  </section>
);

export default PricingSection;
