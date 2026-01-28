import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Check, Trash2 } from 'lucide-react';

export default function AdminContacts() {
  const { getAuthHeaders } = useAuth();
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/contacts`,
        { headers: getAuthHeaders() }
      );
      setContacts(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/contacts/${id}/mark-read`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchContacts();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/contacts/${id}`,
        { headers: getAuthHeaders() }
      );
      fetchContacts();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-serif mb-8">Messages de Contact</h1>

        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white border rounded-sm p-6 ${
                contact.lu ? 'border-border' : 'border-accent bg-accent/5'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-lg">{contact.nom}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>{contact.email}</p>
                    <p>{contact.telephone}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!contact.lu && (
                    <button
                      onClick={() => handleMarkRead(contact.id)}
                      className="text-accent hover:text-accent/80"
                      title="Marquer comme lu"
                    >
                      <Check size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                Reçu le : {new Date(contact.created_at).toLocaleString('fr-FR')}
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Aucun message
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}