// src/components/Admin/Contacts/ContactList.tsx
import React, { useEffect, useState } from 'react';
import { useContacts } from '../../../hooks/useApiState';
import type { Contact, ContactFilters, ContactListResponse } from '../../../types/api';
import './ContactList.css';

interface ContactListProps {
  initialFilters?: ContactFilters;
}

const ContactList: React.FC<ContactListProps> = ({ initialFilters }) => {
  const { contactsData, loading, error, fetchContacts, updateContact, deleteContact } = useContacts();
  const [filters, setFilters] = useState<ContactFilters>({ page: 1, pageSize: 10, ...(initialFilters ?? {}) });
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // fetch on filters change
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
      status: status === 'all' ? undefined : (status as Contact['status']), // Type assertion to prevent type error
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

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...(prev ?? {}), page }));
  };

  // Normalize contactsData which can be Contact[] or ContactListResponse
  const contactsList: Contact[] = Array.isArray(contactsData) ? (contactsData as Contact[]) : ((contactsData as ContactListResponse | null)?.contacts ?? []);
  const total = Array.isArray(contactsData) ? contactsList.length : ((contactsData as ContactListResponse | null)?.total ?? 0);
  const pages = Array.isArray(contactsData) ? 1 : ((contactsData as ContactListResponse | null)?.pages ?? 1);

  return (
    <div className="contact-list">
      <div className="controls">
        <input value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Buscar por nome, email, clínica..." />
        <select onChange={e => handleStatusFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="new">Novos</option>
          <option value="contacted">Contatados</option>
          <option value="qualified">Qualificados</option>
          <option value="converted">Convertidos</option>
          <option value="closed">Fechado</option>
        </select>
      </div>

      {loading && (
        <div className="contact-list-loading">
          <div className="loading-spinner">Carregando contatos...</div>
        </div>
      )}
      {error && !contactsData && (
        <div className="contact-list-error">
          <h3>Erro ao carregar contatos</h3>
          <p>{error}</p>
          <button onClick={() => fetchContacts(filters)}>Tentar novamente</button>
        </div>
      )}

      <table className="contact-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Mensagem</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contactsList.map(c => (
            <tr key={c._id ?? (c as any).id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.message}</td>
              <td>
                <select value={c.status ?? 'new'} onChange={e => handleStatusUpdate(c._id ?? (c as any).id, e.target.value as Contact['status'])}>
                  <option value="new">Novo</option>
                  <option value="contacted">Contatado</option>
                  <option value="qualified">Qualificado</option>
                  <option value="converted">Convertido</option>
                  <option value="closed">Fechado</option>
                </select>
              </td>
              <td>
                <button onClick={() => deleteContact(c._id ?? (c as any).id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={filters.page! <= 1} onClick={() => handlePageChange((filters.page ?? 1) - 1)}>
          Anterior
        </button>
        <span>
          Página {filters.page ?? 1} / {pages}
        </span>
        <button disabled={(filters.page ?? 1) >= pages} onClick={() => handlePageChange((filters.page ?? 1) + 1)}>
          Próxima
        </button>
        <div>Total: {total}</div>
      </div>
    </div>
  );
};

export default ContactList;