// src/pages/Home/EnhancedHome.tsx
import React, { useState, useEffect } from 'react';
import EnhancedHeader from '../../components/Header/Header';
import Button from '../../components/UI/Button/Button';
import Footer from '../../components/Footer/Footer';
import './Home.css';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface Stat {
  label: string;
  value: string;
  description: string;
}

const Home: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features: Feature[] = [
    {
      id: 'appointments',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      title: 'Gestão de Consultas',
      description: 'Agende, reagende e cancele consultas com facilidade. Sistema inteligente de lembretes automáticos.',
      benefits: ['Agenda online 24/7', 'Lembretes automáticos', 'Integração com calendário', 'Relatórios de agendamento']
    },
    {
      id: 'patients',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      title: 'Prontuários Digitais',
      description: 'Mantenha históricos médicos completos, seguros e acessíveis em qualquer dispositivo.',
      benefits: ['Backup automático na nuvem', 'Busca avançada', 'Anexo de exames', 'Histórico completo']
    },
    {
      id: 'billing',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="1" y="3" width="15" height="13"/>
          <path d="m16 8 2 2-2 2"/>
          <path d="M21 12H7"/>
          <path d="M7 8h.01"/>
          <path d="M7 12h.01"/>
          <path d="M7 16h.01"/>
        </svg>
      ),
      title: 'Faturamento Inteligente',
      description: 'Automatize cobranças, controle financeiro e tenha relatórios detalhados da sua clínica.',
      benefits: ['Cobrança automática', 'Relatórios financeiros', 'Integração bancária', 'Controle de inadimplência']
    },
    {
      id: 'analytics',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
        </svg>
      ),
      title: 'Relatórios e Analytics',
      description: 'Tenha insights poderosos sobre seu negócio com dashboards interativos e relatórios detalhados.',
      benefits: ['Dashboard em tempo real', 'Métricas de performance', 'Análise de faturamento', 'Relatórios customizados']
    }
  ];

  useEffect(() => {
    setIsVisible(true);

    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [features.length]);

  const stats: Stat[] = [
    {
      label: 'Consultórios Ativos',
      value: '1,200+',
      description: 'Profissionais confiam no TopSmile'
    },
    {
      label: 'Pacientes Atendidos',
      value: '500K+',
      description: 'Consultas gerenciadas com sucesso'
    },
    {
      label: 'Taxa de Satisfação',
      value: '98%',
      description: 'Aprovação dos nossos usuários'
    },
    {
      label: 'Economia de Tempo',
      value: '70%',
      description: 'Redução no tempo administrativo'
    }
  ];

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Dr. Carlos Mendes',
      role: 'Dentista',
      company: 'Clínica Sorria+',
      content: 'O TopSmile revolucionou a gestão da minha clínica. Consegui reduzir 80% do tempo gasto com tarefas administrativas e focar mais nos meus pacientes.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=64&h=64&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Dra. Marina Silva',
      role: 'Ortodontista',
      company: 'OrtoCenter',
      content: 'A organização dos prontuários digitais é fantástica. Tenho acesso rápido ao histórico completo dos pacientes, o que melhora muito a qualidade do atendimento.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face'
    },
    {
      id: '3',
      name: 'Dr. Roberto Costa',
      role: 'Implantodontista',
      company: 'Costa Odontologia',
      content: 'Os relatórios financeiros me ajudaram a identificar oportunidades de crescimento que eu não via antes. Meu faturamento aumentou 40% em 6 meses.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=64&h=64&fit=crop&crop=face'
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="enhanced-home">
      <EnhancedHeader />
      
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero__content">
            <div className={`hero__text ${isVisible ? 'fade-in' : ''}`}>
              <h1 className="hero__title">
                Transforme sua
                <span className="hero__title-highlight"> Clínica Odontológica</span>
                <br />
                com Tecnologia Inteligente
              </h1>
              <p className="hero__description">
                Gerencie consultas, prontuários e faturamento em uma única plataforma. 
                Mais de 1.200 dentistas já otimizaram suas práticas com o TopSmile.
              </p>
              <div className="hero__actions">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => scrollToSection('demo')}
                >
                  Ver Demonstração
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection('features')}
                >
                  Conhecer Recursos
                </Button>
              </div>
              <div className="hero__trust-signals">
                <p>Usado por mais de 500.000 pacientes</p>
                <div className="hero__trust-badges">
                  <div className="trust-badge">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>LGPD Compliant</span>
                  </div>
                  <div className="trust-badge">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>SSL Seguro</span>
                  </div>
                  <div className="trust-badge">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>99.9% Uptime</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`hero__visual ${isVisible ? 'slide-in-up' : ''}`}>
              <div className="hero__dashboard-preview">
                <div className="dashboard-mockup">
                  <div className="mockup-header">
                    <div className="mockup-controls">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div className="mockup-content">
                    <div className="mockup-sidebar">
                      <div className="mockup-nav-item active"></div>
                      <div className="mockup-nav-item"></div>
                      <div className="mockup-nav-item"></div>
                      <div className="mockup-nav-item"></div>
                    </div>
                    <div className="mockup-main">
                      <div className="mockup-stats">
                        <div className="mockup-stat-card"></div>
                        <div className="mockup-stat-card"></div>
                        <div className="mockup-stat-card"></div>
                      </div>
                      <div className="mockup-chart"></div>
                    </div>
                  </div>
                </div>
                <div className="hero__floating-cards">
                  <div className="floating-card floating-card--1">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>1.247 Pacientes</span>
                  </div>
                  <div className="floating-card floating-card--2">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>12 Consultas Hoje</span>
                  </div>
                  <div className="floating-card floating-card--3">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                    </svg>
                    <span>R$ 45.680</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Recursos que Fazem a Diferença
            </h2>
            <p className="section-description">
              Descubra como o TopSmile pode transformar a gestão da sua clínica odontológica
            </p>
          </div>
          
          <div className="features-showcase">
            <div className="features-tabs">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  className={`feature-tab ${index === activeFeature ? 'feature-tab--active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="feature-tab__icon">
                    {feature.icon}
                  </div>
                  <div className="feature-tab__content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="feature-content">
              <div className="feature-details">
                <h3>{features[activeFeature].title}</h3>
                <p>{features[activeFeature].description}</p>
                <ul className="feature-benefits">
                  {features[activeFeature].benefits.map((benefit, index) => (
                    <li key={index}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button variant="primary">
                  Saiba Mais
                </Button>
              </div>
              <div className="feature-visual">
                <div className="feature-mockup">
                  {/* Feature-specific mockup content */}
                  <div className="mockup-screen">
                    <div className="mockup-content-area">
                      <div className="mockup-feature-demo"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              O que Nossos Clientes Dizem
            </h2>
            <p className="section-description">
              Histórias reais de dentistas que transformaram suas práticas com o TopSmile
            </p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="testimonial-content">
                  "{testimonial.content}"
                </blockquote>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.avatar ? (
                      <img src={testimonial.avatar} alt="" />
                    ) : (
                      <div className="author-initials">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role} • {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="demo">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Pronto para Revolucionar sua Clínica?
            </h2>
            <p className="cta-description">
              Junte-se a mais de 1.200 dentistas que já transformaram suas práticas. 
              Comece seu teste gratuito hoje mesmo.
            </p>
            <div className="cta-actions">
              <Button variant="primary" size="lg">
                Começar Teste Gratuito
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
              <Button variant="outline" size="lg">
                Agendar Demonstração
              </Button>
            </div>
            <div className="cta-guarantee">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>30 dias grátis • Sem cartão de crédito • Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;