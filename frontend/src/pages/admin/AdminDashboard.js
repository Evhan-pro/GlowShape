import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Package, Calendar, Mail, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/dashboard`,
        { headers: getAuthHeaders() }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AdminLayout><div>Chargement...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif mb-6 sm:mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white border border-border rounded-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-xs sm:text-sm">Prestations</span>
              <Package className="text-accent" size={18} />
            </div>
            <p className="text-2xl sm:text-3xl font-serif">{stats?.total_prestations || 0}</p>
          </div>

          <div className="bg-white border border-border rounded-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-xs sm:text-sm">Réservations totales</span>
              <Calendar className="text-accent" size={18} />
            </div>
            <p className="text-2xl sm:text-3xl font-serif">{stats?.total_reservations || 0}</p>
          </div>

          <div className="bg-white border border-border rounded-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-xs sm:text-sm">Aujourd'hui</span>
              <TrendingUp className="text-accent" size={18} />
            </div>
            <p className="text-2xl sm:text-3xl font-serif">{stats?.reservations_today || 0}</p>
          </div>

          <div className="bg-white border border-border rounded-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-xs sm:text-sm">Messages non lus</span>
              <Mail className="text-accent" size={18} />
            </div>
            <p className="text-2xl sm:text-3xl font-serif">{stats?.messages_non_lus || 0}</p>
          </div>
        </div>

        {/* Dernières réservations */}
        <div className="bg-white border border-border rounded-sm p-4 sm:p-6 overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-serif mb-4">Dernières réservations</h2>
          <div className="space-y-4">
            {stats?.recent_reservations?.length > 0 ? (
              stats.recent_reservations.map((resa) => (
                <div key={resa.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{resa.nom_client}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{resa.prestation_nom}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm">{resa.date}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{resa.heure_debut}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Aucune réservation récente</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}