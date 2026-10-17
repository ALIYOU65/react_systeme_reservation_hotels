# 🏨 HOTELBOOKING - Système de Réservation d'Hôtels

## 📌 Présentation

**HOTELBOOKING** est une plateforme web full-stack de réservation d’hôtels permettant aux clients de rechercher, consulter et réserver des chambres, tout en offrant aux personnels d’hôtel et aux modérateurs(administrateurs) des outils de gestion complets.

Le projet a été développé dans le cadre du dispositif PASSE de ma formation de Développeur Web et Web Mobile (dispositif permettant aux stagiaires sans stage en entreprise de réaliser un projet concret).

---

## 🎯 Objectifs

- Permettre aux clients de rechercher et réserver des chambres d’hôtel facilement
- Offrir aux personnels d’hôtel une interface pour gérer leurs établissements et chambres
- Permettre aux modérateurs de valider les hôtels et de gérer les utilisateurs
- Assurer une expérience utilisateur fluide, moderne et responsive

---

## 👥 Acteurs / Rôles

| Rôle            | Description                                      |
|-----------------|--------------------------------------------------|
| **Visiteur**    | Consulte les hôtels sans connexion               |
| **Client**      | Recherche, réserve, laisse des avis              |
| **Personnel**   | Gère ses hôtels et ses chambres                  |
| **Modérateur**  | Valide les hôtels, gère les utilisateurs et les avis |

---

## 🚀 Fonctionnalités principales

### Côté Client / Visiteur
- Recherche d’hôtels (ville, dates, prix max)
- Catalogue d’hôtels avec notes et avis
- Fiche détail hôtel + liste des chambres
- Réservation de chambres
- Consultation de ses réservations et factures
- Dépôt d’avis

### Côté Personnel d’hôtel
- Dashboard Personnel
- Création et gestion des hôtels
- Gestion des chambres (ajout, modification, disponibilité)
- Upload de photos

### Côté Modérateur / Admin
- Validation des hôtels mis en ligne
- Gestion des utilisateurs (changement de rôle, suppression)
- Modération des avis

### Authentification
- Inscription / Connexion
- Gestion des rôles (Client, Personnel, Modérateur)

---

## 🛠️ Technologies utilisées

| Couche              | Technologies                                      |
|---------------------|---------------------------------------------------|
| **Frontend**        | React.js (Vite), CSS                              |
| **Backend**         | Node.js, Express.js, Mongoose                     |
| **Base de données** | MongoDB                                           |
| **Authentification**| JWT                                               |
| **Upload d’images** | Multer                                            |
| **Paiement**        | Stripe (simulation)                               |

---

## 📁 Structure du projet

### 🟢 Backend (Node.js)
```bash
node_systeme_reservation_hotels/
├── controllers/          # hotel, chambre, reservation, user, payment...
├── models/               # hotel, chambre, reservation, user, avis...
├── routes/               # hotel, chambre, reservation, user...
├── middlewares/          # auth, roles, multer, upload
├── validations/
├── uploads/
├── db/
├── .env
├── package.json
└── server.js

```

### 🔵 Frontend (React)
```bash
react_systeme_reservation_hotels/
├── public/
│   └── images/
├── src/
│   ├── components/       # Header, Footer
│   ├── pages/            # Accueil, HotelList, HotelDetail, Dashboard...
│   ├── utils/            # auth, axiosConfig
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js

```

## 📷 Captures d'écran

### 🏠 Page d'accueil
![Accueil](public/images/accueil_booking.png)

### 📋 Catalogue des hôtels
![Catalogue](public/images/catalogue_booking.png)

### 🛏️ Fiche détail hôtel + chambres
![Detail Hotel](public/images/detail_hotel_booking.png)

### 🔐 Inscription / Connexion
![Inscription Connexion](public/images/inscription-connexion_booking.png)

### 🛡️ Dashboard Modérateur
![Dashboard Moderateur](public/images/dashboard-moderateur_booking.png)

### 🏨 Dashboard Personnel
![Dashboard Personnel](public/images/dashboard-personnel_booking.png)

### 👤 Dashboard client
![Dashboard Client](public/images/dashboard-client_booking.png)

---

## 💻 Installation et Lancement

### 1. Cloner les projets

```bash
# Frontend
git clone https://github.com/ALIYOU65/react_systeme_reservation_hotels.git

# Backend
git clone https://github.com/ALIYOU65/node_systeme_reservation_hotels.git
```

### 2. Backend

```bash
cd node_systeme_reservation_hotels
npm install
```
Créer un fichier `.env` :

```env
MONGO_URI=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
```

Puis lancer le serveur :

```bash
npm run dev
```

### 3. Frontend

```bash
cd react_systeme_reservation_hotels
npm install
npm run dev
```
---

## 📈 Améliorations prévues

- Paiement Stripe en production
- Notifications par email
- Filtres de recherche plus avancés
- Tableau de bord statistiques
- Version mobile optimisée

---

## 👨‍💻 Auteur

**KOUOTOU ALIYOU**  
Développeur Full Stack Web & Mobile

📧 ali3bakar@gmail.com
🔗 [GitHub](https://github.com/ALIYOU65)