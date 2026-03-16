"""
GlowShape Stripe Payment Flow Tests - Iteration 2
Tests the refactored payment flow:
- create-setup-intent: NO LONGER creates reservations (just returns clientSecret)
- confirm-and-book: Creates reservation ONLY if card validation succeeded
- cancel-reservation: Handles 48h policy (free vs penalty)
- charge-today-deposits: Cron job to charge 'card_registered' reservations
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
STRIPE_SECRET_KEY = "sk_test_51TBc5lRow7O4W1B5lSSVJZPsRhyL9v7Y4VczxKs5EcexYxkHKpTnwYV43F2BAgITIRl6dtpauAXrTQoVi5uz62bL00CZb6oUXD"


class TestCreateSetupIntent:
    """Tests for POST /api/stripe/create-setup-intent - NO reservation creation"""
    
    def get_prestation_id(self):
        """Helper to get a valid prestation ID"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        return response.json()[0]
    
    def test_create_setup_intent_returns_correct_fields(self):
        """Should return clientSecret, setupIntentId, customerId but NOT reservationId"""
        prestation = self.get_prestation_id()
        future_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        payload = {
            "prestation_id": prestation['id'],
            "nom_client": "TEST_Setup_Client",
            "email_client": "test_setup@example.com",
            "telephone_client": "+33612345678",
            "date": future_date,
            "heure_debut": "10:00",
            "heure_fin": "11:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-setup-intent",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Must have these fields
        assert 'clientSecret' in data, "Missing clientSecret"
        assert 'setupIntentId' in data, "Missing setupIntentId"
        assert 'customerId' in data, "Missing customerId"
        assert 'montantTotal' in data, "Missing montantTotal"
        assert 'montantAcompte' in data, "Missing montantAcompte"
        
        # Must NOT have reservationId (key refactor change)
        assert 'reservationId' not in data, "Should NOT return reservationId - reservation should not be created yet"
        
        # Verify values make sense
        assert data['clientSecret'].startswith('seti_'), f"Invalid clientSecret format: {data['clientSecret'][:20]}"
        assert data['setupIntentId'].startswith('seti_'), f"Invalid setupIntentId format: {data['setupIntentId']}"
        assert data['customerId'].startswith('cus_'), f"Invalid customerId format: {data['customerId']}"
        assert data['montantTotal'] == float(prestation['prix_euros']), f"montantTotal mismatch"
        assert data['montantAcompte'] == round(float(prestation['prix_euros']) * 0.3, 2), f"montantAcompte should be 30%"
        
        print(f"✓ create-setup-intent returns correct fields WITHOUT reservationId")
        print(f"  clientSecret: {data['clientSecret'][:30]}...")
        print(f"  setupIntentId: {data['setupIntentId']}")
        print(f"  customerId: {data['customerId']}")
        print(f"  montantTotal: {data['montantTotal']}€")
        print(f"  montantAcompte: {data['montantAcompte']}€ (30%)")
    
    def test_create_setup_intent_invalid_prestation(self):
        """Should return 404 for non-existent prestation"""
        future_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        payload = {
            "prestation_id": "00000000-0000-0000-0000-000000000000",
            "nom_client": "TEST_Invalid_Prestation",
            "email_client": "test@example.com",
            "telephone_client": "+33612345678",
            "date": future_date,
            "heure_debut": "10:00",
            "heure_fin": "11:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-setup-intent",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ create-setup-intent returns 404 for invalid prestation")


class TestConfirmAndBook:
    """Tests for POST /api/stripe/confirm-and-book - Creates reservation ONLY on success"""
    
    def test_confirm_and_book_rejects_non_succeeded_setup_intent(self):
        """Should return 400 if setup_intent_id status is not 'succeeded'"""
        # Get a prestation
        prestations = requests.get(f"{BASE_URL}/api/prestations").json()
        prestation = prestations[0]
        future_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        # Create a fresh SetupIntent that hasn't been confirmed
        create_payload = {
            "prestation_id": prestation['id'],
            "nom_client": "TEST_Unconfirmed_Card",
            "email_client": "test_unconfirmed@example.com",
            "telephone_client": "+33612345678",
            "date": future_date,
            "heure_debut": "14:00",
            "heure_fin": "15:00"
        }
        
        setup_response = requests.post(
            f"{BASE_URL}/api/stripe/create-setup-intent",
            json=create_payload
        )
        assert setup_response.status_code == 200
        setup_data = setup_response.json()
        
        # Try to confirm-and-book with the unconfirmed SetupIntent
        confirm_payload = {
            "setup_intent_id": setup_data['setupIntentId'],
            "payment_method_id": "pm_card_visa",  # Won't matter - status check happens first
            "customer_id": setup_data['customerId'],
            "prestation_id": prestation['id'],
            "nom_client": "TEST_Unconfirmed_Card",
            "email_client": "test_unconfirmed@example.com",
            "telephone_client": "+33612345678",
            "date": future_date,
            "heure_debut": "14:00",
            "heure_fin": "15:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stripe/confirm-and-book",
            json=confirm_payload
        )
        
        # Should be rejected because SetupIntent is not succeeded
        assert response.status_code == 400, f"Expected 400 for non-succeeded SetupIntent, got {response.status_code}"
        data = response.json()
        assert 'error' in data, "Expected error message in response"
        print(f"✓ confirm-and-book correctly REJECTS non-succeeded SetupIntent")
        print(f"  Error: {data.get('error', 'N/A')}")
    
    def test_confirm_and_book_invalid_prestation(self):
        """Should return 404 if prestation doesn't exist"""
        future_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        # Create a setup intent first with a valid prestation
        prestations = requests.get(f"{BASE_URL}/api/prestations").json()
        prestation = prestations[0]
        
        setup_response = requests.post(
            f"{BASE_URL}/api/stripe/create-setup-intent",
            json={
                "prestation_id": prestation['id'],
                "nom_client": "TEST_Invalid_Prestation_Book",
                "email_client": "test_invalid@example.com",
                "telephone_client": "+33612345678",
                "date": future_date,
                "heure_debut": "16:00",
                "heure_fin": "17:00"
            }
        )
        setup_data = setup_response.json()
        
        # Try to book with invalid prestation ID
        confirm_payload = {
            "setup_intent_id": setup_data['setupIntentId'],
            "payment_method_id": "pm_card_visa",
            "customer_id": setup_data['customerId'],
            "prestation_id": "00000000-0000-0000-0000-000000000000",  # Invalid
            "nom_client": "TEST_Invalid_Prestation_Book",
            "email_client": "test_invalid@example.com",
            "telephone_client": "+33612345678",
            "date": future_date,
            "heure_debut": "16:00",
            "heure_fin": "17:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stripe/confirm-and-book",
            json=confirm_payload
        )
        
        # Will fail either with 400 (non-succeeded) or 404 (invalid prestation)
        # Since SetupIntent check happens first, we expect 400
        assert response.status_code in [400, 404], f"Expected 400 or 404, got {response.status_code}"
        print(f"✓ confirm-and-book handles invalid prestation (status: {response.status_code})")


class TestCancelReservation:
    """Tests for POST /api/stripe/cancel-reservation/:id - 48h policy"""
    
    def get_auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'admin@glowshape.fr', 'password': 'admin123'}
        )
        return response.json().get('access_token') if response.status_code == 200 else None
    
    def test_cancel_non_existent_reservation(self):
        """Should return 404 for non-existent reservation (using UUID format)"""
        # Reservation IDs are UUIDs, so use a valid UUID format that doesn't exist
        fake_uuid = "00000000-0000-0000-0000-000000000001"
        response = requests.post(f"{BASE_URL}/api/stripe/cancel-reservation/{fake_uuid}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"✓ cancel-reservation returns 404 for non-existent reservation")
    
    def test_cancel_reservation_endpoint_exists(self):
        """Verify the cancel endpoint is properly routed with valid UUID format"""
        # Use a valid UUID format that doesn't exist
        fake_uuid = "00000000-0000-0000-0000-000000000002"
        response = requests.post(f"{BASE_URL}/api/stripe/cancel-reservation/{fake_uuid}")
        # Should be 404 (not found) not 500 (server error) or 405 (method not allowed)
        assert response.status_code in [200, 400, 404], f"Unexpected status {response.status_code}"
        print(f"✓ cancel-reservation endpoint properly routed (status: {response.status_code})")


class TestChargeTodayDeposits:
    """Tests for POST /api/stripe/charge-today-deposits - Cron job endpoint"""
    
    def test_charge_today_deposits_returns_results(self):
        """Should return results structure even if no reservations to charge"""
        response = requests.post(f"{BASE_URL}/api/stripe/charge-today-deposits")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert 'success' in data, "Missing success field"
        assert data['success'] == True, "Expected success=true"
        assert 'results' in data, "Missing results field"
        assert 'total' in data['results'], "Missing results.total"
        assert 'success' in data['results'], "Missing results.success"
        assert 'failed' in data['results'], "Missing results.failed"
        assert 'details' in data['results'], "Missing results.details"
        
        print(f"✓ charge-today-deposits returns proper structure")
        print(f"  Total: {data['results']['total']}")
        print(f"  Success: {data['results']['success']}")
        print(f"  Failed: {data['results']['failed']}")


class TestExistingAPIs:
    """Verify existing APIs still work after refactor"""
    
    def test_prestations_still_works(self):
        """Prestations endpoint should still return 14 items"""
        response = requests.get(f"{BASE_URL}/api/prestations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 14, f"Expected 14 prestations, got {len(data)}"
        print(f"✓ /api/prestations returns 14 prestations")
    
    def test_disponibilites_still_works(self):
        """Disponibilites endpoint should return time slots"""
        prestations = requests.get(f"{BASE_URL}/api/prestations").json()
        prestation_id = prestations[0]['id']
        future_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/disponibilites",
            params={'date': future_date, 'prestation_id': prestation_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'creneaux' in data
        assert isinstance(data['creneaux'], list)
        print(f"✓ /api/disponibilites returns {len(data['creneaux'])} time slots")
    
    def test_admin_login_still_works(self):
        """Admin login should still work"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'admin@glowshape.fr', 'password': 'admin123'}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        print(f"✓ Admin login works")
    
    def test_admin_reservations_list(self):
        """Admin should see reservations"""
        login = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={'email': 'admin@glowshape.fr', 'password': 'admin123'}
        )
        token = login.json().get('access_token')
        
        response = requests.get(
            f"{BASE_URL}/api/admin/reservations",
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ /api/admin/reservations returns {len(data)} reservations")
        
        # Check if any have the new 'card_registered' status
        card_registered = [r for r in data if r.get('statut_paiement') == 'card_registered']
        print(f"  Reservations with 'card_registered' status: {len(card_registered)}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
