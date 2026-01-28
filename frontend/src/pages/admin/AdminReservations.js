import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { X } from 'lucide-react';

export default function AdminReservations() {
  const { getAuthHeaders } = useAuth();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reservations`,
        { headers: getAuthHeaders() }
      );
      setReservations(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    try {
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reservations/${id}/cancel`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchReservations();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-serif mb-8">Réservations</h1>

        <div className="bg-white border border-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Heure</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Prestation</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Statut</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((resa) => (
                <tr key={resa.id}>
                  <td className="px-6 py-4">{resa.date}</td>
                  <td className="px-6 py-4">{resa.heure_debut} - {resa.heure_fin}</td>
                  <td className="px-6 py-4">{resa.nom_client}</td>
                  <td className="px-6 py-4">{resa.prestation_nom}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{resa.email_client}</div>
                      <div className="text-muted-foreground">{resa.telephone_client}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      resa.statut === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {resa.statut === 'confirmed' ? 'Confirmé' : 'Annulé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {resa.statut === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(resa.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}