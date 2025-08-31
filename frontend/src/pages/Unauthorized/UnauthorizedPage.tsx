import React from 'react';
import './UnauthorizedPage.css'; // Import the CSS file

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="unauthorized-container">
      <h1 className="unauthorized-title">Acesso Negado</h1>
      <p className="unauthorized-message">Você não tem permissão para acessar esta página.</p>
    </div>
  );
};

export default UnauthorizedPage;