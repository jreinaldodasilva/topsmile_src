// src/components/Admin/Contacts/ContactList.tsx - Updated for Backend Integration
import React, { useEffect, useState } from 'react';
import { useContacts } from '../../../hooks/useApiState';
import type { Contact, ContactFilters, ContactListResponse } from '../../../types/api';
import './ContactList.css';

interface ContactListProps {
  initialFilters?: ContactFilters;
}

const ContactList: React.FC<ContactListProps> = ({ initialFilters }) => {
  const { contactsData, loading, error, fetchContacts, updateContact, deleteContact } = useContacts();
  
  // UPDATED: Use 'limit' instead of 'pageSize' to match backend
  const [filters, setFilters] = useState<ContactFilters>({ 
    page: 1, 
    limit: 10, 
    ...(initialFilters ?? {}) 
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Fetch on filters change
    (async () => {
      await fetchContacts(filters);
    })();
  }, [fetchContacts, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...(prev ?? {}),
      search: query || undefined,
      page: 1
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...(prev ?? {}),
      status: status === 'all' ? undefined : (status as Contact['status']),
      page: 1
    }));
  };

  const handleStatusUpdate = async (contactId: string, newStatus: Contact['status']) => {
    try {
      if (newStatus) {
        await updateContact(contactId, { status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update contact status:', error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        await deleteContact(contactId);
      } catch (error) {
        console.error('Failed to delete contact:', error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...(prev ?? {}), page }));
  };

  // UPDATED: Better handling of ContactListResponse vs Contact[] 
  const isContactListResponse = (data: any): data is ContactListResponse => {
    return data && typeof data === 'object' && 'contacts' in data && Array.isArray(data.contacts);
  };

  const contactsList: Contact[] = isContactListResponse(contactsData) 
    ? contactsData.contacts 
    : (Array.isArray(contactsData) ? contactsData : []);

  const total = isContactListResponse(contactsData) ? contactsData.total : contactsList.length;
  const pages = isContactListResponse(contactsData) ? contactsData.pages : 1;
  const currentPage = isContactListResponse(contactsData) ? contactsData.page : (filters.page || 1);
  const limit = isContactListResponse(contactsData) ? contactsData.limit : (filters.limit || 10);

  return (
    <div className="contact-list">
      {/* Header with filters */}
      <div className="contact-list-header">
        <h2>Gerenciar Contatos</h2>
        <div className="contact-filters">
          <div className="search-box">
            <input 
              className="search-input"
              type="text"
              placeholder="Buscar por nome, email, clínica..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <div className="status-filters">
            <button 
              className={`filter-button ${(!filters.status || filters.status === 'all') ? 'active' : ''}`}
              onClick={() => handleStatusFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-button ${filters.status === 'new' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('new')}
            >
              Novos
            </button>
            <button 
              className={`filter-button ${filters.status === 'contacted' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('contacted')}
            >
              Contatados
            </button>
            <button 
              className={`filter-button ${filters.status === 'qualified' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('qualified')}
            >
              Qualificados
            </button>
            <button 
              className={`filter-button ${filters.status === 'converted' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('converted')}
            >
              Convertidos
            </button>
            <button 
              className={`filter-button ${filters.status === 'closed' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('closed')}
            >
              Fechados
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => fetchContacts(filters)}>Tentar novamente</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !contactsData && (
        <div className="contact-list-loading">
          <div className="loading-spinner">Carregando contatos...</div>
        </div>
      )}

      {/* Loading overlay for updates */}
      {loading && contactsData && (
        <div className="loading-overlay">
          <div className="loading-spinner">Atualizando...</div>
        </div>
      )}

      {/* Contact table */}
      {!loading || contactsData ? (
        <>
          <div className="contact-table-container">
            {contactsList.length > 0 ? (
              <table className="contact-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Clínica</th>
                    <th>Especialidade</th>
                    <th>Telefone</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsList.map((contact) => {
                    const contactId = contact._id || contact.id || '';
                    return (
                      <tr key={contactId} className="contact-row">
                        <td>
                          <div className="contact-name">{contact.name}</div>
                        </td>
                        <td>
                          <div className="contact-email">
                            <a href={`mailto:${contact.email}`}>{contact.email}</a>
                          </div>
                        </td>
                        <td>
                          <div className="contact-clinic">{contact.clinic}</div>
                        </td>
                        <td>
                          <div className="contact-specialty">{contact.specialty}</div>
                        </td>
                        <td>
                          <div className="contact-phone">
                            <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                          </div>
                        </td>
                        <td className="contact-status">
                          <select 
                            className="status-select"
                            value={contact.status || 'new'} 
                            onChange={(e) => handleStatusUpdate(contactId, e.target.value as Contact['status'])}
                          >
                            <option value="new">Novo</option>
                            <option value="contacted">Contatado</option>
                            <option value="qualified">Qualificado</option>
                            <option value="converted">Convertido</option>
                            <option value="closed">Fechado</option>
                          </select>
                        </td>
                        <td>
                          <div className="contact-date">
                            {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </td>
                        <td>
                          <div className="contact-actions">
                            <button 
                              className="action-button view"
                              title="Visualizar detalhes"
                              onClick={() => console.log('View contact', contactId)}
                            >
                              👁️
                            </button>
                            <button 
                              className="action-button delete"
                              title="Excluir contato"
                              onClick={() => handleDeleteContact(contactId)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Nenhum contato encontrado</h3>
                <p>
                  {searchQuery || filters.status 
                    ? 'Não há contatos que correspondam aos filtros aplicados.'
                    : 'Você ainda não tem contatos registrados.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {contactsList.length > 0 && pages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Exibindo {Math.min((currentPage - 1) * limit + 1, total)} - {Math.min(currentPage * limit, total)} de {total} contatos
              </div>
              
              <div className="pagination-controls">
                <button 
                  className="pagination-button"
                  disabled={currentPage <= 1} 
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </button>
                
                <span className="pagination-current">
                  Página {currentPage} de {pages}
                </span>
                
                <button 
                  className="pagination-button"
                  disabled={currentPage >= pages} 
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ContactList;