# Application web de gestion et de conversation avec des bots.

Ce projet a pour objectif de développer une application web permettant de créer des bots grâce à la technologie Rivescript et de pouvoir converser avec eux en choisissant leur(s) cerveau(x).

## Prérequis

- Framework NodeJS
  - bcrypt : pour le chiffrement sécurisé du mot de passe de l'utilisateur
  - cors : pour permettre aux différents serveurs de communiquer
  - express : framework basé sur NodeJS et permettant de construire notre application web
  - express-session : pour la gestion de la session utilisateur
  - mongodb : pour le stockage des données utilisateurs et des bots
  - nodemon : utilitaire utile pendant le développement
  - rivescript : permet de converser avec les bots
  - discord.js : implémentation de discord dans le projet afin de pouvoir envoyer un bot sur la plateforme
- Base de données (MongoDB) : la base de données est créée dans le code

## Installation

1. Cloner le dépôt ( https://github.com/Gurwan/Services-Web-ChatBot.git )
2. Se rendre dans le dossier back
3. Lancer le serveur avec la commande : npm run nodemon
4. Accéder à l'application web via l'URL fournie par le serveur

## Procédure de test

### Pour discord 

1. Créer une application et un bot dans l'espace développeur de Discord
2. Copiez le token et ajoutez le à votre bot sur l'application TalkBot
3. Ajoutez le bot au serveur de votre choix en accédant à l'URL : https://discord.com/oauth2/authorize?client_id=%CLIENT_ID%&scope=bot&permissions=0
4. Lancez votre bot sur discord en cliquant sur le bouton à droite du token discord.
5. Pour parler avec lui (depuis votre serveur Discord), il faut commencer le message par un @NOM_DU_BOT

## Auteurs

- Gurwan DELAUNAY
- Mathias PENAVAIRE

