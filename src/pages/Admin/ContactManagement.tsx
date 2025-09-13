// src/pages/Admin/ContactManagement.tsx
import React from 'react';
import EnhancedHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ContactList from '../../components/Admin/Contacts/ContactList';
import './ContactManagement.css';

const ContactManagement: React.FC = () => {
  return (
    <div className="contact-management-page">
      <EnhancedHeader />

      <main className="contact-management-main">
        <div className="container">
          {/* Page Header */}
          <section className="page-header">
            <div className="header-content">
              <div className="header-info">
                <h1 className="page-title">Gerenciamento de Contatos</h1>
                <p className="page-subtitle">
                  Gerencie todos os contatos e leads da sua clínica odontológica
                </p>
              </div>
              <div className="header-stats">
                <div className="stat-item">
                  <span className="stat-number">1,247</span>
                  <span className="stat-label">Total de Contatos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">89</span>
                  <span className="stat-label">Novos Esta Semana</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">23%</span>
                  <span className="stat-label">Taxa de Conversão</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact List Section */}
          <section className="contact-list-section">
            <ContactList />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactManagement;
