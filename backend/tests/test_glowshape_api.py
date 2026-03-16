"""
GlowShape API Tests - Beauty Salon Booking System
Tests for: Prestations, Categories, Disponibilites, Admin Login
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPrestationsAPI:
    """Tests for /api/prestations endpoint - Service listings"""
    
    def test_get_prestations_returns_list(self):
        """Should return a list of prestations"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ /api/prestations returns list with {len(data)} items")
    
    def test_get_prestations_count_is_14(self):
        """Should return exactly 14 prestations as seeded"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 14, f"Expected 14 prestations, got {len(data)}"
        print(f"✓ /api/prestations returns exactly 14 prestations")
    
    def test_prestation_has_required_fields(self):
        """Each prestation should have required fields"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['id', 'nom', 'categorie', 'duree_minutes', 'prix_euros', 'description']
        for prestation in data:
            for field in required_fields:
                assert field in prestation, f"Missing field: {field}"
        print(f"✓ All prestations have required fields")
    
    def test_get_single_prestation(self):
        """Should return a single prestation by ID"""
        # First get list to get an ID
        list_response = requests.get(f"{BASE_URL}/api/prestations")
        assert list_response.status_code == 200
        prestations = list_response.json()
        
        prestation_id = prestations[0]['id']
        response = requests.get(f"{BASE_URL}/api/prestations/{prestation_id}")
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == prestation_id
        print(f"✓ GET /api/prestations/{prestation_id} returns correct prestation")
    
    def test_get_prestation_not_found(self):
        """Should return 404 for non-existent prestation"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/prestations/{fake_id}")
        assert response.status_code == 404
        print(f"✓ GET /api/prestations with invalid ID returns 404")


class TestCategoriesAPI:
    """Tests for /api/categories endpoint"""
    
    def test_get_categories(self):
        """Should return list of categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert 'categories' in data
        assert isinstance(data['categories'], list)
        print(f"✓ /api/categories returns {len(data['categories'])} categories")
    
    def test_categories_include_expected_values(self):
        """Categories should include expected values"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        expected_categories = ['Visage', 'Corps', 'Ongles', 'Massages', 'Épilation']
        for cat in expected_categories:
            assert cat in data['categories'], f"Missing category: {cat}"
        print(f"✓ All expected categories present")


class TestDisponibilitesAPI:
    """Tests for /api/disponibilites endpoint - Time slot availability"""
    
    def get_prestation_id(self):
        """Helper to get a valid prestation ID"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        return response.json()[0]['id']
    
    def test_get_disponibilites_returns_slots(self):
        """Should return time slots for a given date"""
        prestation_id = self.get_prestation_id()
        future_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/disponibilites",
            params={'date': future_date, 'prestation_id': prestation_id}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'date' in data
        assert 'creneaux' in data
        assert isinstance(data['creneaux'], list)
        print(f"✓ /api/disponibilites returns {len(data['creneaux'])} time slots for {future_date}")
    
    def test_disponibilites_creneaux_structure(self):
        """Time slots should have correct structure"""
        prestation_id = self.get_prestation_id()
        future_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/disponibilites",
            params={'date': future_date, 'prestation_id': prestation_id}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data['creneaux']) > 0:
            slot = data['creneaux'][0]
            assert 'heure_debut' in slot
            assert 'heure_fin' in slot
            assert 'disponible' in slot
            print(f"✓ Time slots have correct structure (heure_debut, heure_fin, disponible)")
    
    def test_disponibilites_invalid_prestation(self):
        """Should return 404 for invalid prestation ID"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        future_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/disponibilites",
            params={'date': future_date, 'prestation_id': fake_id}
        )
        assert response.status_code == 404
        print(f"✓ /api/disponibilites returns 404 for invalid prestation ID")


class TestAdminLogin:
    """Tests for admin authentication"""
    
    def test_admin_login_success(self):
        """Should login successfully with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'admin@glowshape.fr', 'password': 'admin123'}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert 'token_type' in data
        assert data['token_type'] == 'bearer'
        print(f"✓ Admin login successful with correct credentials")
    
    def test_admin_login_invalid_password(self):
        """Should fail with incorrect password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'admin@glowshape.fr', 'password': 'wrongpassword'}
        )
        assert response.status_code == 401
        print(f"✓ Admin login returns 401 for invalid password")
    
    def test_admin_login_invalid_email(self):
        """Should fail with non-existent email"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'notanadmin@test.com', 'password': 'admin123'}
        )
        assert response.status_code == 401
        print(f"✓ Admin login returns 401 for invalid email")


class TestPublicEndpoints:
    """Tests for other public endpoints"""
    
    def test_homepage_content(self):
        """Should return homepage content"""
        response = requests.get(f"{BASE_URL}/api/homepage-content")
        assert response.status_code == 200
        data = response.json()
        assert 'hero_titre' in data or 'id' in data  # Has some content fields
        print(f"✓ /api/homepage-content returns content")
    
    def test_temoignages(self):
        """Should return testimonials list"""
        response = requests.get(f"{BASE_URL}/api/temoignages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ /api/temoignages returns list with {len(data)} items")
    
    def test_avant_apres(self):
        """Should return before/after list"""
        response = requests.get(f"{BASE_URL}/api/avant-apres")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ /api/avant-apres returns list with {len(data)} items")
    
    def test_site_settings(self):
        """Should return site settings"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200
        print(f"✓ /api/site-settings returns settings")


class TestAdminProtectedEndpoints:
    """Tests for admin-protected endpoints with authentication"""
    
    def get_auth_token(self):
        """Helper to get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'admin@glowshape.fr', 'password': 'admin123'}
        )
        if response.status_code == 200:
            return response.json().get('access_token')
        pytest.skip("Could not authenticate - skipping protected endpoint tests")
    
    def test_admin_dashboard_with_token(self):
        """Admin dashboard should work with valid token"""
        token = self.get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'total_prestations' in data
        assert 'total_reservations' in data
        print(f"✓ /api/admin/dashboard returns stats with valid token")
    
    def test_admin_dashboard_without_token(self):
        """Admin dashboard should fail without token"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code in [401, 403]
        print(f"✓ /api/admin/dashboard returns {response.status_code} without token")
    
    def test_admin_reservations_list(self):
        """Should get list of reservations with auth"""
        token = self.get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/reservations",
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ /api/admin/reservations returns {len(data)} reservations")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
