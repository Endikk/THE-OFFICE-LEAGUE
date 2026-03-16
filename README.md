# THE OFFICE LEAGUE

Plateforme de paris sportifs virtuels et de votes entre collegues, inspiree de *The Office*.
**Pas de vrais paris d'argent** - uniquement des points fictifs appeles **OfficeCoins**.

## Tech Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React (Vite) + TypeScript + Tailwind CSS |
| Backend/DB | Firebase (Firestore + Auth + Hosting) - plan gratuit |
| API sportive | API-Football (api-football.com) - plan gratuit (100 req/jour) |
| Deploiement | Firebase Hosting (gratuit) |
| Icones | Lucide React |

## Structure du projet

```
src/
├── assets/                  # Images, logos
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx    # Formulaire connexion/inscription
│   ├── awards/
│   │   └── DundieCard.tsx   # Carte trophee Dundie
│   ├── bets/
│   │   └── BetModal.tsx     # Modal de placement de pari
│   ├── common/
│   │   └── LoadingSpinner.tsx
│   ├── layout/
│   │   └── Navbar.tsx       # Navigation principale
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx
│   ├── matches/
│   │   └── MatchCard.tsx    # Carte de match
│   ├── office/
│   │   └── JoinOffice.tsx   # Creer/rejoindre un bureau
│   └── polls/
│       └── PollCard.tsx     # Carte de sondage
├── context/
│   └── AuthContext.tsx       # Provider d'authentification
├── hooks/
│   └── useMatches.ts        # Hook pour les matchs API-Football
├── pages/
│   ├── AwardsPage.tsx       # Page Dundie Awards
│   ├── Dashboard.tsx        # Page d'accueil
│   ├── LeaderboardPage.tsx  # Classement du bureau
│   ├── MatchesPage.tsx      # Liste des matchs + paris
│   └── PollsPage.tsx        # Sondages du bureau
├── services/
│   ├── api-football.ts      # Client API-Football
│   ├── auth.ts              # Authentification Firebase
│   ├── bets.ts              # CRUD paris
│   ├── firebase.ts          # Configuration Firebase
│   ├── office.ts            # Gestion des bureaux
│   └── polls.ts             # CRUD sondages
├── types/
│   └── index.ts             # Types TypeScript
├── utils/
│   └── dundies.ts           # Logique d'attribution des Dundies
├── App.tsx                  # Routes + layout principal
├── main.tsx                 # Point d'entree
└── index.css                # Styles Tailwind
```

## Collections Firestore

| Collection | Champs cles |
|------------|-------------|
| `users` | uid, displayName, email, officeCoins (1000 initial), officeId, totalBets, wonBets, dundieAwards[] |
| `offices` | name, code (invitation 6 chars), ownerId, members[], createdAt |
| `bets` | userId, matchId, officeId, prediction (home/draw/away), amount, odds, status, potentialWin |
| `polls` | officeId, creatorId, question, options[{id, text, votes[]}], expiresAt |

## Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd THE-OFFICE-LEAGUE

# 2. Installer les dependances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir avec tes cles Firebase et API-Football

# 4. Lancer le serveur de dev
npm run dev
```

## Plan de developpement MVP - 3 Phases

### Phase 1 : Fondations (Semaine 1-2)
- [x] Setup Vite + React + TypeScript + Tailwind
- [x] Configuration Firebase (Auth + Firestore)
- [x] Systeme d'authentification (email + Google)
- [x] Creation/rejoindre un bureau (code d'invitation)
- [x] Structure des composants et routing
- [ ] Dashboard utilisateur avec stats
- [ ] Integration API-Football (matchs du jour)

### Phase 2 : Fonctionnalites Core (Semaine 3-4)
- [ ] Systeme de paris complet (placer, resoudre, historique)
- [ ] Classement en temps reel du bureau
- [ ] Sondages sportifs (creer, voter, resultats)
- [ ] Systeme de Dundie Awards automatiques
- [ ] Notifications in-app (nouveau pari, resultat, award)
- [ ] Filtrage par ligue (Ligue 1, PL, Liga, UCL)

### Phase 3 : Polish & Social (Semaine 5-6)
- [ ] Profil utilisateur avec historique et badges
- [ ] Chat/commentaires sur les matchs
- [ ] Systeme de "trash talk" entre collegues
- [ ] Mode sombre
- [ ] PWA (installable sur mobile)
- [ ] Deploiement Firebase Hosting
- [ ] Optimisation performance (lazy loading, cache API)

## Deploiement

```bash
npm run build
firebase deploy
```
