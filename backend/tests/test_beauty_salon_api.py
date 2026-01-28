"""
Backend API Tests for Beauty Salon Website
Tests: Homepage content, Avant/Après, Témoignages, Admin routes
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "evhan.linget.pro@gmail.com"
ADMIN_PASSWORD = "12345"


class TestPublicAPIs:
    """Public API endpoints tests"""
    
    def test_homepage_content_returns_200(self):
        """Test GET /api/admin/homepage-content returns homepage content"""
        response = requests.get(f"{BASE_URL}/api/admin/homepage-content")
        assert response.status_code == 200
        
        data = response.json()
        assert "hero_titre" in data
        assert "hero_sous_titre" in data
        assert "hero_image" in data
        assert "about_titre" in data
        assert "about_texte" in data
        assert "cta_titre" in data
        print(f"✓ Homepage content: {data['hero_titre']}")
    
    def test_avant_apres_public_returns_200(self):
        """Test GET /api/avant-apres returns active items"""
        response = requests.get(f"{BASE_URL}/api/avant-apres")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Avant/Après items count: {len(data)}")
        
        # If items exist, verify structure
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "titre" in item
            assert "image_avant" in item
            assert "image_apres" in item
            assert item.get("actif") == True  # Public API should only return active items
            print(f"✓ First item: {item['titre']}")
    
    def test_temoignages_public_returns_200(self):
        """Test GET /api/temoignages returns active testimonials"""
        response = requests.get(f"{BASE_URL}/api/temoignages")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Témoignages count: {len(data)}")
    
    def test_prestations_returns_200(self):
        """Test GET /api/prestations returns services"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        prestation = data[0]
        assert "id" in prestation
        assert "nom" in prestation
        assert "categorie" in prestation
        assert "prix_euros" in prestation
        print(f"✓ Prestations count: {len(data)}")
    
    def test_categories_returns_200(self):
        """Test GET /api/categories returns categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        print(f"✓ Categories: {data['categories']}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_email(self):
        """Test admin login with invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "wrong@email.com", "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 401
        print("✓ Invalid email rejected")
    
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Invalid password rejected")


@pytest.fixture
def auth_token():
    """Get authentication token for admin tests"""
    response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestAdminHomepage:
    """Admin homepage content management tests"""
    
    def test_admin_homepage_update(self, auth_headers):
        """Test PUT /api/admin/homepage updates content"""
        # Get current content
        response = requests.get(f"{BASE_URL}/api/admin/homepage-content")
        original_content = response.json()
        
        # Update content
        update_data = {
            "hero_titre": "TEST_Updated Title",
            "hero_sous_titre": original_content.get("hero_sous_titre"),
            "hero_image": original_content.get("hero_image"),
            "about_titre": original_content.get("about_titre"),
            "about_texte": original_content.get("about_texte"),
            "about_image": original_content.get("about_image"),
            "cta_titre": original_content.get("cta_titre"),
            "cta_texte": original_content.get("cta_texte")
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/homepage",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["hero_titre"] == "TEST_Updated Title"
        print("✓ Homepage content updated")
        
        # Verify persistence via GET
        response = requests.get(f"{BASE_URL}/api/admin/homepage-content")
        assert response.status_code == 200
        data = response.json()
        assert data["hero_titre"] == "TEST_Updated Title"
        print("✓ Homepage update persisted")
        
        # Restore original
        original_content["hero_titre"] = original_content.get("hero_titre", "L'Élégance au Naturel")
        requests.put(
            f"{BASE_URL}/api/admin/homepage",
            json=original_content,
            headers=auth_headers
        )
    
    def test_admin_homepage_requires_auth(self):
        """Test PUT /api/admin/homepage requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/homepage",
            json={"hero_titre": "Unauthorized Update"}
        )
        assert response.status_code == 401
        print("✓ Homepage update requires auth")


class TestAdminAvantApres:
    """Admin avant/après management tests"""
    
    def test_admin_get_all_avant_apres(self, auth_headers):
        """Test GET /api/admin/avant-apres returns all items including inactive"""
        response = requests.get(
            f"{BASE_URL}/api/admin/avant-apres",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin avant/après count: {len(data)}")
    
    def test_admin_create_avant_apres(self, auth_headers):
        """Test POST /api/admin/avant-apres creates new item"""
        new_item = {
            "titre": "TEST_Transformation Test",
            "description": "Test description",
            "image_avant": "https://example.com/avant.jpg",
            "image_apres": "https://example.com/apres.jpg",
            "ordre": 99,
            "actif": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/avant-apres",
            json=new_item,
            headers=auth_headers
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["titre"] == "TEST_Transformation Test"
        assert "id" in data
        print(f"✓ Created avant/après: {data['id']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/avant-apres/{data['id']}",
            headers=auth_headers
        )
    
    def test_admin_update_avant_apres(self, auth_headers):
        """Test PUT /api/admin/avant-apres/:id updates item"""
        # Create item first
        new_item = {
            "titre": "TEST_To Update",
            "description": "Original",
            "image_avant": "https://example.com/avant.jpg",
            "image_apres": "https://example.com/apres.jpg",
            "actif": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/avant-apres",
            json=new_item,
            headers=auth_headers
        )
        item_id = create_response.json()["id"]
        
        # Update
        update_data = {
            "titre": "TEST_Updated Title",
            "description": "Updated description",
            "image_avant": "https://example.com/avant.jpg",
            "image_apres": "https://example.com/apres.jpg",
            "actif": False
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/avant-apres/{item_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["titre"] == "TEST_Updated Title"
        assert data["actif"] == False
        print("✓ Avant/après updated")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/avant-apres/{item_id}",
            headers=auth_headers
        )
    
    def test_admin_delete_avant_apres(self, auth_headers):
        """Test DELETE /api/admin/avant-apres/:id deletes item"""
        # Create item first
        new_item = {
            "titre": "TEST_To Delete",
            "description": "Will be deleted",
            "image_avant": "https://example.com/avant.jpg",
            "image_apres": "https://example.com/apres.jpg",
            "actif": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/avant-apres",
            json=new_item,
            headers=auth_headers
        )
        item_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(
            f"{BASE_URL}/api/admin/avant-apres/{item_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Avant/après deleted")
        
        # Verify deletion - item should not appear in public API
        public_response = requests.get(f"{BASE_URL}/api/avant-apres")
        public_items = public_response.json()
        assert not any(item["id"] == item_id for item in public_items)
        print("✓ Deletion verified")


class TestAdminTemoignages:
    """Admin testimonials management tests"""
    
    def test_admin_get_all_temoignages(self, auth_headers):
        """Test GET /api/admin/temoignages returns all testimonials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/temoignages",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin témoignages count: {len(data)}")
    
    def test_admin_create_temoignage(self, auth_headers):
        """Test POST /api/admin/temoignages creates new testimonial"""
        new_item = {
            "nom": "TEST_Client Name",
            "texte": "This is a test testimonial",
            "note": 5,
            "actif": True,
            "ordre": 99
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/temoignages",
            json=new_item,
            headers=auth_headers
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["nom"] == "TEST_Client Name"
        assert data["note"] == 5
        assert "id" in data
        print(f"✓ Created témoignage: {data['id']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/temoignages/{data['id']}",
            headers=auth_headers
        )
    
    def test_admin_update_temoignage(self, auth_headers):
        """Test PUT /api/admin/temoignages/:id updates testimonial"""
        # Create item first
        new_item = {
            "nom": "TEST_To Update",
            "texte": "Original text",
            "note": 4,
            "actif": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/temoignages",
            json=new_item,
            headers=auth_headers
        )
        item_id = create_response.json()["id"]
        
        # Update
        update_data = {
            "nom": "TEST_Updated Name",
            "texte": "Updated testimonial text",
            "note": 5,
            "actif": False
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/temoignages/{item_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["nom"] == "TEST_Updated Name"
        assert data["note"] == 5
        assert data["actif"] == False
        print("✓ Témoignage updated")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/temoignages/{item_id}",
            headers=auth_headers
        )
    
    def test_admin_delete_temoignage(self, auth_headers):
        """Test DELETE /api/admin/temoignages/:id deletes testimonial"""
        # Create item first
        new_item = {
            "nom": "TEST_To Delete",
            "texte": "Will be deleted",
            "note": 3,
            "actif": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/temoignages",
            json=new_item,
            headers=auth_headers
        )
        item_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(
            f"{BASE_URL}/api/admin/temoignages/{item_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Témoignage deleted")


class TestAdminHoraires:
    """Admin schedule management tests"""
    
    def test_admin_get_horaires(self, auth_headers):
        """Test GET /api/admin/horaires returns schedules"""
        response = requests.get(
            f"{BASE_URL}/api/admin/horaires",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Horaires count: {len(data)}")
    
    def test_admin_create_horaire(self, auth_headers):
        """Test POST /api/admin/horaires creates/updates schedule"""
        horaire_data = {
            "date": "2026-12-25",
            "ouvert": False,
            "heure_ouverture": "09:00",
            "heure_fermeture": "19:00",
            "note": "Fermé pour Noël"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/horaires",
            json=horaire_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Horaire created/updated")
    
    def test_admin_batch_horaires(self, auth_headers):
        """Test POST /api/admin/horaires/batch creates multiple schedules"""
        horaires_data = [
            {"date": "2026-12-31", "ouvert": False, "heure_ouverture": "09:00", "heure_fermeture": "19:00"},
            {"date": "2027-01-01", "ouvert": False, "heure_ouverture": "09:00", "heure_fermeture": "19:00"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/horaires/batch",
            json=horaires_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Batch horaires created")


class TestAdminDashboard:
    """Admin dashboard tests"""
    
    def test_admin_dashboard(self, auth_headers):
        """Test GET /api/admin/dashboard returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "total_prestations" in data
        assert "total_reservations" in data
        assert "reservations_today" in data
        assert "messages_non_lus" in data
        print(f"✓ Dashboard: {data['total_prestations']} prestations, {data['total_reservations']} reservations")


class TestPublicHoraires:
    """Public schedule endpoint tests"""
    
    def test_get_horaire_for_date(self):
        """Test GET /api/horaires/:date returns schedule for specific date"""
        response = requests.get(f"{BASE_URL}/api/horaires/2026-01-27")
        assert response.status_code == 200
        
        data = response.json()
        assert "date" in data
        assert "ouvert" in data
        assert "heure_ouverture" in data
        assert "heure_fermeture" in data
        print(f"✓ Horaire for date: ouvert={data['ouvert']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
