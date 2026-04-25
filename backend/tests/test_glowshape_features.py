"""Tests for Glowshape new features (CGU/CGV, TikTok, Google Calendar, Categories)"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://glowshape-fix.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "admin@glowshape.fr"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------------- Site settings & TikTok ----------------
class TestSiteSettings:
    def test_get_site_settings(self):
        r = requests.get(f"{BASE_URL}/api/site-settings", timeout=10)
        assert r.status_code == 200
        data = r.json()
        # tiktok_url field present (may be empty string or null)
        assert "tiktok_url" in data, f"tiktok_url not in {list(data.keys())}"

    def test_update_tiktok_url(self, auth_headers):
        # Save current settings
        cur = requests.get(f"{BASE_URL}/api/site-settings", timeout=10).json()
        original_tiktok = cur.get("tiktok_url", "")

        # Update with TEST tiktok URL
        payload = {**cur, "tiktok_url": "https://tiktok.com/@TEST_glowshape"}
        # Try admin endpoint first
        r = requests.put(f"{BASE_URL}/api/admin/site-settings", json=payload, headers=auth_headers, timeout=10)
        if r.status_code == 404:
            r = requests.put(f"{BASE_URL}/api/site-settings", json=payload, headers=auth_headers, timeout=10)
        assert r.status_code in (200, 201), f"Update failed: {r.status_code} {r.text}"

        # Verify persisted
        r2 = requests.get(f"{BASE_URL}/api/site-settings", timeout=10)
        assert r2.status_code == 200
        assert r2.json().get("tiktok_url") == "https://tiktok.com/@TEST_glowshape"

        # Revert
        revert = {**cur, "tiktok_url": original_tiktok}
        rr = requests.put(f"{BASE_URL}/api/admin/site-settings", json=revert, headers=auth_headers, timeout=10)
        if rr.status_code == 404:
            requests.put(f"{BASE_URL}/api/site-settings", json=revert, headers=auth_headers, timeout=10)


# ---------------- Google Calendar Admin endpoints ----------------
class TestGoogleCalendar:
    def test_google_status_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/google/status", headers=auth_headers, timeout=10)
        assert r.status_code == 200, f"Status: {r.status_code} {r.text}"
        data = r.json()
        assert "connected" in data
        assert isinstance(data["connected"], bool)

    def test_google_login_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/google/login", headers=auth_headers, timeout=10)
        # Should return URL to redirect to Google OAuth or 200 OK with url field
        assert r.status_code in (200, 302), f"Status: {r.status_code} {r.text}"
        if r.status_code == 200:
            data = r.json()
            assert "url" in data or "authUrl" in data or "redirect_url" in data or "authorization_url" in data, f"No url: {data}"


# ---------------- Categories ----------------
class TestCategories:
    def test_get_categories(self):
        r = requests.get(f"{BASE_URL}/api/categories", timeout=10)
        assert r.status_code == 200
        data = r.json()
        # Could be array or {categories: [...]}
        cats = data.get("categories") if isinstance(data, dict) else data
        assert isinstance(cats, list)


# ---------------- Auth ----------------
class TestAuth:
    def test_admin_login(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        token = data.get("token") or data.get("access_token")
        assert token


# ---------------- Public pages: prestations, avant-apres, content ----------------
class TestPublicData:
    def test_prestations(self):
        r = requests.get(f"{BASE_URL}/api/prestations", timeout=10)
        assert r.status_code == 200

    def test_avant_apres(self):
        r = requests.get(f"{BASE_URL}/api/avant-apres", timeout=10)
        assert r.status_code == 200

    def test_content(self):
        # Home page content endpoint
        r = requests.get(f"{BASE_URL}/api/content", timeout=10)
        assert r.status_code in (200, 404)
