# Application web de gestion et de conversation avec des bots.

<p align="center">
  <img src="https://github.com/Gurwan/TalkBot/blob/main/front/assets/img/bot.png" width="250" style="max-width:100%;">
</p>
<p align="center">
  <strong>TalkBot</strong>
</p>

<p align="center">
  
https://github.com/Gurwan/TalkBot/assets/34190539/ebe3f8d4-8b60-42ab-ac6c-ca7ab0d4e892

</p>

<hr> </hr>

Ce projet a pour objectif de développer une application web permettant de créer des bots grâce à la technologie Rivescript et de pouvoir converser avec eux en choisissant leur(s) cerveau(x).

## Prérequis

- Framework NodeJS (pour tout installer, tapez la commande : npm install dans /back)
  - bcrypt : pour le chiffrement sécurisé du mot de passe de l'utilisateur
  - cors : pour permettre aux différents serveurs de communiquer
  - express : framework basé sur NodeJS et permettant de construire notre application web
  - express-session : pour la gestion de la session utilisateur
  - mongodb : pour le stockage des données utilisateurs et des bots
  - nodemon : utilitaire utile pendant le développement
  - rivescript : permet de converser avec les bots
  - discord.js : implémentation de discord dans le projet afin de pouvoir envoyer un bot sur la plateforme
  - mastodon-api : implémentation de mastodon dans le projet afin de pouvoir envoyer un bot sur la plateforme
- Base de données (MongoDB) : la base de données est créée dans le code

## Installation

1. Cloner le dépôt ( https://github.com/Gurwan/Services-Web-ChatBot.git )
2. Se rendre dans le dossier back
3. Lancer le serveur avec la commande : npm run nodemon
4. Accéder à l'application web via l'URL fournie par le serveur

## Fonctionnalités implémentées

- Création d'un compte utilisateur
- Connexion obligatoire pour accéder au site
- Création d'un ChatBot ayant des fonctionnalités minimales
- Pouvoir lancer le serveur d'un ChatBot
- Converser avec un bot
- Sélectionner le(s) cerveau(x) du bot avant de le lancer
- (BONUS) Pouvoir changer les cerveaux alors que le serveur est allumé (bot change de personnalité pendant conversation)
- Le ChatBot garde en mémoire des informations personnelles
- (BONUS) Utilisation de MongoDB pour mémoriser durablement ces informations
- Intégration du ChatBot à Discord (testé)
- Intégration du ChatBot à Mastodon (implémenté mais pas testé)
- (BONUS) L'instance du ChatBot présent sur Discord partage sa mémoire avec celle de TalkBot
- Les accès à Discord et Mastodon peuvent être réfutés en supprimant les tokens
- Etats des ChatBot visible (les bots démarrés se trouvent dans l'onglet conversation et le bouton de démarrage change d'apparence en fonction de l'état du bot)
- (BONUS) Les informations personnelles des utilisateurs sont partagées aux mémoires de chaque ChatBot


## Procédure de test

### Pour Discord 

1. Créer une application et un bot dans l'espace développeur de Discord
2. Copiez le token et ajoutez le à votre bot sur l'application TalkBot
3. Ajoutez le bot au serveur de votre choix en accédant à l'URL : https://discord.com/oauth2/authorize?client_id=%CLIENT_ID%&scope=bot&permissions=0
4. Lancez votre bot sur discord en cliquant sur le bouton à droite du token discord.
5. Pour parler avec lui (depuis votre serveur Discord), il faut commencer le message par un @NOM_DU_BOT

### Pour Mastodon

Cette fonctionnalité n'a pas été testé car nous ne possédons pas de compte Mastodon validé. La demande a été effectuée il y a plusieurs jours sans succès. Voici tout de même la démarche de test prévue :
1. Se connecter à son compte Mastodon
2. Créer une application Mastodon depuis Botsin.space et autorisé un bot sur cette instance
3. Copier l'access_token et le coller dans le champ mastodon token d'un bot sur TalkBot
4. Lancer votre bot sur Mastodon en cliquant sur le bouton à droite du token mastodon.
5. Pour parler avec lui (depuis Mastodon), envoyez-lui un message privé.

## Auteurs

- Gurwan DELAUNAY
- Mathias PENAVAIRE

