import React from 'react';
import EnhancedHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Dashboard from '../../components/Admin/Dashboard/Dashboard';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  return (
    <div className="admin-page">
      <EnhancedHeader />

      <main className="admin-main">
        <div className="container">
          <Dashboard />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
