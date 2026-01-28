import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-24 mx-auto mb-4" />
          <h2 className="text-3xl font-serif text-foreground">Administration</h2>
          <p className="text-muted-foreground mt-2">Connectez-vous pour accéder au panneau d'administration</p>
        </div>

        <div className="bg-white border border-border rounded-sm p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
                className="w-full px-4 py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin@glowandshape.fr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
                className="w-full px-4 py-3 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-sm p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              data-testid="login-button"
              className="w-full flex items-center justify-center space-x-2 bg-accent text-accent-foreground py-3 rounded-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <LogIn size={20} />
              <span>{isLoading ? 'Connexion...' : 'Se connecter'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}