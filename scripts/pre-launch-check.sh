#!/usr/bin/env bash
set -euo pipefail

# ─── THE OFFICE LEAGUE — Checklist pré-lancement ───

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; ((WARN++)); }

cd "$(dirname "$0")/.."

echo ""
echo "═══════════════════════════════════════════════"
echo "  THE OFFICE LEAGUE — Pre-launch Checklist"
echo "═══════════════════════════════════════════════"
echo ""

# ─── 1. Fichiers de config ───
echo "📁 Configuration"
[ -f ".env" ] && pass ".env existe" || fail ".env manquant (cp .env.example .env)"
[ -f ".firebaserc" ] && pass ".firebaserc existe" || fail ".firebaserc manquant (firebase use --add)"
[ -f "firebase.json" ] && pass "firebase.json existe" || fail "firebase.json manquant"
[ -f "firestore.rules" ] && pass "firestore.rules existe" || fail "firestore.rules manquant"
[ -f "firestore.indexes.json" ] && pass "firestore.indexes.json existe" || fail "firestore.indexes.json manquant"

# ─── 2. Variables d'environnement ───
echo ""
echo "🔑 Variables d'environnement"
if [ -f ".env" ]; then
  grep -q "VITE_FIREBASE_API_KEY=." .env 2>/dev/null && pass "VITE_FIREBASE_API_KEY défini" || fail "VITE_FIREBASE_API_KEY vide"
  grep -q "VITE_FIREBASE_PROJECT_ID=." .env 2>/dev/null && pass "VITE_FIREBASE_PROJECT_ID défini" || fail "VITE_FIREBASE_PROJECT_ID vide"
  grep -q "VITE_FIREBASE_AUTH_DOMAIN=." .env 2>/dev/null && pass "VITE_FIREBASE_AUTH_DOMAIN défini" || fail "VITE_FIREBASE_AUTH_DOMAIN vide"
  grep -q "VITE_API_FOOTBALL_KEY=." .env 2>/dev/null && pass "VITE_API_FOOTBALL_KEY défini" || warn "VITE_API_FOOTBALL_KEY vide (matchs ne fonctionneront pas)"
else
  fail "Impossible de vérifier les variables (.env manquant)"
fi

# ─── 3. Dépendances ───
echo ""
echo "📦 Dépendances"
[ -d "node_modules" ] && pass "node_modules installé" || fail "node_modules manquant (npm install)"
command -v firebase >/dev/null 2>&1 && pass "Firebase CLI installé" || fail "Firebase CLI manquant (npm i -g firebase-tools)"

# ─── 4. Build ───
echo ""
echo "🔨 Build"
if npm run build > /tmp/office-league-build.log 2>&1; then
  pass "Build de production réussi"
  [ -f "dist/index.html" ] && pass "dist/index.html généré" || fail "dist/index.html manquant"
else
  fail "Build échoué (voir /tmp/office-league-build.log)"
fi

# ─── 5. TypeScript ───
echo ""
echo "📝 TypeScript"
if npx tsc --noEmit > /tmp/office-league-tsc.log 2>&1; then
  pass "Aucune erreur TypeScript"
else
  ERRORS=$(wc -l < /tmp/office-league-tsc.log)
  fail "$ERRORS lignes d'erreurs TypeScript (voir /tmp/office-league-tsc.log)"
fi

# ─── 6. Lint ───
echo ""
echo "🔍 Lint"
if npm run lint > /tmp/office-league-lint.log 2>&1; then
  pass "ESLint propre"
else
  warn "Warnings ou erreurs ESLint (voir /tmp/office-league-lint.log)"
fi

# ─── 7. Fichiers critiques ───
echo ""
echo "📄 Fichiers critiques"
[ -f "src/services/firebase.ts" ] && pass "Firebase service existe" || fail "src/services/firebase.ts manquant"
[ -f "src/services/notifications.ts" ] && pass "Notifications service existe" || fail "src/services/notifications.ts manquant"
[ -f "src/services/leaderboard.ts" ] && pass "Leaderboard service existe" || fail "src/services/leaderboard.ts manquant"
[ -f "src/services/dundie-awards.ts" ] && pass "Dundie Awards service existe" || fail "src/services/dundie-awards.ts manquant"
[ -f "src/context/AuthContext.tsx" ] && pass "AuthContext existe" || fail "src/context/AuthContext.tsx manquant"
[ -f "src/context/NotificationContext.tsx" ] && pass "NotificationContext existe" || fail "src/context/NotificationContext.tsx manquant"

# ─── 8. Sécurité ───
echo ""
echo "🔒 Sécurité"
if [ -f ".gitignore" ]; then
  grep -q ".env" .gitignore 2>/dev/null && pass ".env dans .gitignore" || warn ".env non exclu du git"
  grep -q "node_modules" .gitignore 2>/dev/null && pass "node_modules dans .gitignore" || warn "node_modules non exclu du git"
else
  warn ".gitignore manquant"
fi

# ─── Résumé ───
echo ""
echo "═══════════════════════════════════════════════"
echo -e "  Résultat : ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}  ${YELLOW}${WARN} warnings${NC}"
echo "═══════════════════════════════════════════════"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}⚠  Corrige les erreurs avant de déployer !${NC}"
  exit 1
else
  echo -e "${GREEN}🚀 Prêt pour le déploiement !${NC}"
  exit 0
fi
