# THE OFFICE LEAGUE — Guide de Deploiement

> "Would I rather be feared or loved? Easy. Both." — Michael Scott

## Pre-requis

- **Node.js** >= 18
- **npm** >= 9
- **Firebase CLI** : `npm install -g firebase-tools`
- Un compte [Firebase](https://console.firebase.google.com)
- Une cle API [API-Football](https://www.api-football.com/) (plan gratuit = 100 requetes/jour)

---

## 1. Setup Firebase

### 1.1 Creer le projet Firebase

```bash
# Se connecter
firebase login

# Creer un nouveau projet (ou utiliser un existant)
firebase projects:create the-office-league --display-name "THE OFFICE LEAGUE"

# Associer le projet
firebase use the-office-league
```

### 1.2 Activer les services dans la console Firebase

Aller sur [console.firebase.google.com](https://console.firebase.google.com) :

1. **Authentication** → Sign-in method
   - Activer **Email/Password**
   - Activer **Google** (optionnel mais recommande)

2. **Cloud Firestore** → Create database
   - Choisir **Production mode**
   - Region : `europe-west1` (Belgique) ou `europe-west3` (Francfort)

3. **Hosting** → Get started
   - Suivre les instructions de base

### 1.3 Recuperer les cles Firebase

Dans les parametres du projet (roue crantee) → General → Your apps → Web app :

```
apiKey: "AIza..."
authDomain: "the-office-league.firebaseapp.com"
projectId: "the-office-league"
storageBucket: "the-office-league.appspot.com"
messagingSenderId: "123..."
appId: "1:123...:web:abc..."
```

---

## 2. Configuration locale

### 2.1 Variables d'environnement

```bash
cp .env.example .env
```

Remplir le fichier `.env` :

```env
# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=the-office-league.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=the-office-league
VITE_FIREBASE_STORAGE_BUCKET=the-office-league.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# API-Football
VITE_API_FOOTBALL_KEY=your_api_key_here
```

### 2.2 Installer les dependances

```bash
npm install
```

### 2.3 Lancer en local

```bash
npm run dev
```

Le site est accessible sur `http://localhost:5173`

---

## 3. Deploiement

### 3.1 Via le script (recommande)

```bash
# Setup initial (premiere fois)
./scripts/deploy.sh setup

# Deploiement complet
./scripts/deploy.sh

# Deployer uniquement le hosting
./scripts/deploy.sh hosting

# Deployer uniquement les regles Firestore
./scripts/deploy.sh rules
```

### 3.2 Commandes manuelles

```bash
# Build
npm run build

# Deployer tout
firebase deploy

# Deployer uniquement le hosting
firebase deploy --only hosting

# Deployer uniquement les regles
firebase deploy --only firestore:rules

# Deployer uniquement les indexes
firebase deploy --only firestore:indexes
```

### 3.3 Preview channel (staging)

```bash
# Creer un channel de preview
firebase hosting:channel:deploy staging --expires 7d

# Lister les channels actifs
firebase hosting:channel:list
```

---

## 4. Domaine personnalise

### 4.1 Firebase Hosting

```bash
# Dans la console Firebase → Hosting → Add custom domain
# ou via CLI :
firebase hosting:sites:list
```

1. Ajouter le domaine dans Firebase Console → Hosting
2. Configurer les DNS :
   - Type A : pointer vers l'IP fournie par Firebase
   - Attendre la verification (peut prendre quelques heures)
3. Le SSL est automatique via Let's Encrypt

### 4.2 Configuration DNS typique

```
Type    Host    Value
A       @       151.101.1.195
A       @       151.101.65.195
CNAME   www     the-office-league.web.app
```

---

## 5. Firestore — Regles de securite

Les regles sont dans `firestore.rules`. Points importants :

| Collection      | Read                | Write                          |
|-----------------|---------------------|--------------------------------|
| `users`         | Tout user auth      | Owner uniquement               |
| `offices`       | Membres de l'office | Membres (update) / Auth (create) |
| `matches`       | Tout user auth      | Auth (update)                  |
| `bets`          | Membres de l'office | Membres (create/update)        |
| `polls`         | Membres de l'office | Membres                        |
| `leaderboard`   | Membres de l'office | Membres (rankings)             |
| `dundieAwards`  | Membres de l'office | Membres (create/update)        |
| `notifications` | Owner uniquement    | Auth (create) / Owner (update) |
| `apiCache`      | Tout user auth      | Tout user auth                 |

Deployer les regles :

```bash
firebase deploy --only firestore:rules
```

---

## 6. Firestore — Index composites

Les index sont dans `firestore.indexes.json`. Ils couvrent :

- **bets** : officeId+createdAt, userId+createdAt, matchId+officeId, officeId+status+createdAt
- **matches** : status+startTime, league+startTime, status+league+startTime
- **polls** : officeId+createdAt, officeId+closesAt
- **rankings** : points (desc)
- **dundieAwards** : officeId+season, officeId+createdAt, winnerId+createdAt
- **notifications** : userId+createdAt, userId+read+createdAt

Deployer les index :

```bash
firebase deploy --only firestore:indexes
```

> Les index prennent quelques minutes a se creer. Surveille l'avancement dans la console Firebase.

---

## 7. Checklist pre-lancement

Lancer le script automatique :

```bash
./scripts/pre-launch-check.sh
```

Ou verifier manuellement :

- [ ] **Auth** : Inscription + connexion fonctionnent
- [ ] **Office** : Creation + join avec code d'invitation
- [ ] **Matchs** : Affichage des matchs via API-Football
- [ ] **Paris** : Placer un pari, voir l'historique
- [ ] **Sondages** : Creer, voter, voir les resultats
- [ ] **Leaderboard** : Classement avec titres dynamiques
- [ ] **Dundies** : Attribution automatique visible
- [ ] **Notifications** : Bell + dropdown + mark as read
- [ ] **Responsive** : Mobile bottom nav + desktop sidebar
- [ ] **Performance** : Lighthouse > 90 (Performance, Accessibility, Best Practices)

---

## 8. Post-lancement

### 8.1 Monitoring

```bash
# Voir les logs Firebase
firebase functions:log  # si tu ajoutes des Cloud Functions

# Dashboard Analytics
# → console.firebase.google.com → Analytics
```

### 8.2 Firebase Analytics (optionnel)

Deja integre dans le SDK Firebase. Pour activer :
1. Console Firebase → Analytics → Enable
2. Les events sont automatiquement trackes (page_view, screen_view, etc.)

### 8.3 Performance Monitoring

Ajouter dans `src/services/firebase.ts` :

```typescript
import { getPerformance } from 'firebase/performance';

// Apres initializeApp
const perf = getPerformance(app);
```

### 8.4 Crashlytics (pour les erreurs JS)

```typescript
import { initializeApp } from 'firebase/app';
// Crashlytics est disponible via Firebase JS SDK
// Les erreurs non-catchees sont automatiquement reportees
```

### 8.5 A/B Testing

Utiliser Firebase Remote Config pour tester :
- Differents textes de CTA
- Montant initial d'OfficeCoins
- Nombre de paris maximum par match

---

## 9. Architecture des collections Firestore

```
firestore/
├── users/{userId}
│   ├── uid, email, displayName, photoURL
│   ├── officeId, coins, totalWins, totalLosses, streak
│   └── dundieAwards[]
├── offices/{officeId}
│   ├── name, inviteCode, createdBy, membersCount
│   └── createdAt
├── matches/{matchId}
│   ├── homeTeam, awayTeam, league, status
│   ├── score, odds, startTime
│   └── apiFootballId
├── bets/{betId}
│   ├── userId, officeId, matchId
│   ├── prediction, amount, status, payout
│   └── createdAt
├── polls/{pollId}
│   ├── officeId, createdBy, question, options[]
│   ├── votes{}, category, emoji
│   └── createdAt, closesAt
├── leaderboard/{officeId}/rankings/{userId}
│   ├── userId, displayName, photoURL
│   ├── points, wins, losses, streak
│   └── totalBets, favoriteRate
├── dundieAwards/{awardId}
│   ├── officeId, winnerId, winnerName
│   ├── title, emoji, description
│   ├── season, dundieType, period
│   └── createdAt
├── notifications/{notifId}
│   ├── userId, officeId, type, emoji
│   ├── title, message, read, data{}
│   └── createdAt
└── apiCache/{cacheId}
    ├── key, data, expiresAt
    └── createdAt
```

---

## 10. Commandes utiles

```bash
# Dev local
npm run dev

# Build production
npm run build

# Preview du build
npm run preview

# Lint
npm run lint

# Deploiement complet
npm run deploy

# Checklist pre-lancement
npm run check

# Emulateurs Firebase (dev local sans toucher a la prod)
firebase emulators:start --only auth,firestore,hosting
```

---

## Troubleshooting

| Probleme | Solution |
|----------|----------|
| `PERMISSION_DENIED` Firestore | Verifier firestore.rules + redeploy |
| Index manquant (erreur console) | Le lien dans l'erreur cree l'index automatiquement |
| CORS sur API-Football | Utiliser un proxy ou Cloud Function |
| Build echoue | `rm -rf node_modules && npm install` |
| Emulateurs ne demarrent pas | `firebase emulators:start --only firestore` |
| SSL custom domain | Attendre 24-48h apres config DNS |

---

*"I'm not superstitious, but I am a little stitious."* — Michael Scott
