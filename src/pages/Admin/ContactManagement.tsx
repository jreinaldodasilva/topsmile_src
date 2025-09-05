// src/pages/Admin/ContactManagement.tsx
import React from 'react';
//import { useAuth } from '../../contexts/AuthContext';
import ContactList from '../../components/Admin/Contacts/ContactList';
import './ContactManagement.css';

const ContactManagement: React.FC = () => {
  //const { user } = useAuth();

  return (
    <div className="contact-management">
      <h1>Contact Management</h1>
      <ContactList />
    </div>
  );
};

export default ContactManagement;