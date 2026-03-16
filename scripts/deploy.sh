#!/usr/bin/env bash
set -euo pipefail

# ─── THE OFFICE LEAGUE — Script de déploiement ───
# Usage:
#   ./scripts/deploy.sh           → Deploy tout (hosting + firestore)
#   ./scripts/deploy.sh hosting   → Deploy uniquement le hosting
#   ./scripts/deploy.sh rules     → Deploy uniquement les rules + indexes
#   ./scripts/deploy.sh setup     → Setup initial Firebase

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info()  { echo -e "${BLUE}[i]${NC} $1"; }

# ─── Vérifications préalables ───
check_prereqs() {
  command -v node >/dev/null 2>&1 || error "Node.js non installé. Installe-le via https://nodejs.org"
  command -v npm >/dev/null 2>&1 || error "npm non trouvé."
  command -v firebase >/dev/null 2>&1 || error "Firebase CLI non installé. Lance: npm install -g firebase-tools"

  if [ ! -f ".env" ]; then
    warn "Fichier .env manquant ! Copie .env.example → .env et remplis les valeurs."
    warn "  cp .env.example .env"
  fi
}

# ─── Setup initial ───
setup() {
  info "Setup initial Firebase..."

  echo ""
  info "1. Connecte-toi à Firebase :"
  firebase login

  echo ""
  info "2. Sélection du projet :"
  firebase use --add

  echo ""
  info "3. Activation des services Firebase :"
  warn "Assure-toi d'avoir activé dans la console Firebase :"
  echo "   - Authentication (Email/Password + Google)"
  echo "   - Cloud Firestore (mode production)"
  echo "   - Hosting"
  echo ""

  info "4. Déploiement des règles et indexes Firestore :"
  firebase deploy --only firestore

  log "Setup terminé !"
  echo ""
  info "Prochaine étape : remplis ton .env puis lance ./scripts/deploy.sh"
}

# ─── Build ───
build() {
  info "Installation des dépendances..."
  npm ci

  info "Build de production..."
  npm run build

  if [ ! -d "dist" ]; then
    error "Le dossier dist/ n'a pas été créé. Vérifie les erreurs de build."
  fi

  log "Build réussi ! (dist/)"
}

# ─── Deploy hosting ───
deploy_hosting() {
  info "Déploiement du hosting..."
  firebase deploy --only hosting
  log "Hosting déployé !"
}

# ─── Deploy Firestore rules + indexes ───
deploy_rules() {
  info "Déploiement des règles Firestore..."
  firebase deploy --only firestore:rules

  info "Déploiement des indexes Firestore..."
  firebase deploy --only firestore:indexes

  log "Rules et indexes déployés !"
}

# ─── Deploy complet ───
deploy_all() {
  build
  echo ""
  deploy_rules
  echo ""
  deploy_hosting
  echo ""
  log "Déploiement complet terminé !"

  SITE_URL=$(firebase hosting:channel:list 2>/dev/null | grep "live" | awk '{print $NF}' || true)
  if [ -n "$SITE_URL" ]; then
    info "Site accessible sur : $SITE_URL"
  else
    info "Site accessible sur : https://$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4).web.app"
  fi
}

# ─── Main ───
cd "$(dirname "$0")/.."
check_prereqs

case "${1:-all}" in
  setup)
    setup
    ;;
  hosting)
    build
    deploy_hosting
    ;;
  rules)
    deploy_rules
    ;;
  all)
    deploy_all
    ;;
  *)
    echo "Usage: $0 [setup|hosting|rules|all]"
    exit 1
    ;;
esac
