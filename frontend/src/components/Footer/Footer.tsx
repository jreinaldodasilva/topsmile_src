import React from 'react';
import './Footer.css';

const Footer: React.FC = () => (
  <footer className="footer" id="footer">
    <div className="footer-container">
      <div className="footer-brand">
        <h2>TopSmile</h2>
        <p>Conectando você à saúde de forma simples, rápida e segura.</p>
      </div>
      <div className="footer-links">
        <a href="#hero">Início</a>
        <a href="#features">Recursos</a>
        <a href="#pricing">Preços</a>
        <a href="#contact">Contato</a>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} TopSmile. Todos os direitos reservados.</p>
    </div>
  </footer>
);

export default Footer;
