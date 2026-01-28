#!/bin/bash

echo "🔍 DIAGNOSTIC DES IMAGES - Glowshape"
echo "===================================="
echo ""

echo "1️⃣ Logos publics (frontend):"
echo "   Logo principal : /logo_glowshape.png"
curl -s -I http://localhost:3000/logo_glowshape.png | head -1
echo "   Logo admin : /logo.png"
curl -s -I http://localhost:3000/logo.png | head -1
echo ""

echo "2️⃣ Images de la page d'accueil (depuis API):"
curl -s http://localhost:8001/api/homepage-content | jq '{hero_image: .hero_image[:60], about_image: .about_image[:60]}'
echo ""

echo "3️⃣ Images Avant/Après (depuis BDD):"
PGPASSWORD='GlowShape2002_' psql -h localhost -U glowshapeuser -d glowandshape -t -c "SELECT COUNT(*) FROM avant_apres;" | xargs echo "   Nombre d'images : "
echo ""

echo "4️⃣ Fichiers uploadés (backend):"
echo "   Nombre de fichiers : $(ls -1 /app/backend/uploads/*.png 2>/dev/null | wc -l)"
echo "   Test d'accès à une image uploadée :"
FIRST_IMAGE=$(ls -1 /app/backend/uploads/*.png 2>/dev/null | head -1 | xargs basename)
if [ ! -z "$FIRST_IMAGE" ]; then
  curl -s -I "http://localhost:8001/uploads/$FIRST_IMAGE" | head -1
fi
echo ""

echo "5️⃣ Test des URLs Unsplash (images par défaut) :"
curl -s -I "https://images.unsplash.com/photo-1722350766824-f8520e9676ac?w=400" | head -1
echo ""

echo "✅ Diagnostic terminé !"
