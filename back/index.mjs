import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import fs, { cp } from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { fileURLToPath } from 'url';
import RiveScript from 'rivescript';
import discord from 'discord.js'
import Mastodon from 'mastodon-api';

import {BotHandler} from "./model/BotHandler.mjs";
import {UserHandler} from "./model/UserHandler.mjs";

//permet de créer le gestionnaire de bots servant à ajouter, mettre à jour, récupérer et supprimer le bot (CRUD)
const botHandler = new BotHandler();
//permet de créer le gestionnaire d'utilisateurs servant à créer un utilisateur, le mettre à jour et le récupérer (CRU)
const userHandler = new UserHandler();
await botHandler.connectToDatabase();
await userHandler.connectToDatabase();

//HashMap permettant de stocker les serveurs des n bots démarrés
const serverMap = new Map();
//HashMap permettant de stocker les n bots démarrés
const riveScriptMap = new Map();

const app = express();
//permet aux différents serveurs de communiquer entre eux
app.use(cors()); // Enable ALL CORS request
//port du serveur principal
const port = 3000

//à enlever ? inutile car on utilise pas ejs
app.set('view engine', 'ejs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Définir le chemin des vues
app.set('views', path.join(__dirname, '../front/views')); 

const assetsPath = path.join(__dirname, '../front/assets');
app.use('/assets', express.static(assetsPath));

//permet de créer une session (pour la connexion)
app.use(session({
	secret: 'bot_secret_key',
	resave: false,
	saveUninitialized: true
}));

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true }))

//récupére le dossier contenant tous les fichiers rive
const folderBrains = path.join(__dirname, '../front/brains');

//variable contenant le nom d'utilisateur de l'utilisateur connecté
var username_connected = null

// PARTIE ROUTAGE (pour sessions et accès aux vues de manière simple)

/**
 * Méthode permettant d'accéder à l'index du site ou au login si l'utilisateur n'est pas connecté
 */
app.get('/', (req, res) => {
	if(!username_connected){
		res.sendFile(path.join(__dirname, '../front/views/login.html'));
	} else {
		res.sendFile(path.join(__dirname, '../front/views/index.html'));
	}
});

/**
 * Méthode permettant d'accéder à la page de connexion
 */
app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname, '../front/views/login.html'));
});

/**
 * Méthode permettant d'accéder à la page d'inscription
 */
app.get('/register', (req, res) => {
	res.sendFile(path.join(__dirname, '../front/views/register.html'));
});

/**
 * Méthode permettant d'accéder à la page des conversations (avec les bots allumés)
 * Redirige vers la connexion si l'utilisateur n'est pas connecté
 */
app.get('/conversations', (req, res) => {
	if(!username_connected){
		res.sendFile(path.join(__dirname, '../front/views/login.html'));
	} else {
		res.sendFile(path.join(__dirname, '../front/views/conversations.html'));
	}
});

/**
 * Méthode permettant d'accéder à la page de chat avec un bot lancé sur le port passé en argument
 */
app.get('/chat/:port', (req, res) => {
	const { port } = req.params;
	const filePath = path.join(__dirname, '../front/views/chat.html');
  
	fs.readFile(filePath, 'utf8', (err, data) => {
	  if (err) {
		console.error('Erreur lors de la lecture du fichier HTML:', err);
		return res.status(500).send('Erreur interne du serveur');
	  }
  	  const modifiedData = data.replace('{{port}}', port);
  
	  res.send(modifiedData);
	});
}); 

/**
 * Méthode permettant d'accéder à la page d'ajout de bots
 * Redirige vers la connexion si l'utilisateur n'est pas connecté
 */
app.get('/add_bot', (req, res) => {
	if(!username_connected){
		res.sendFile(path.join(__dirname, '../front/views/login.html'));
	} else {
		res.sendFile(path.join(__dirname, '../front/views/add_bot.html'));
	}
});

/**
 * Méthode permettant de gérer la connexion de l'utilisateur
 * Utilisation de bcrypt car le mot de passe est chiffré à l'inscription
 */
app.post('/login', async (req, res) => {
	const { username, password } = req.body;

	const user = await userHandler.getUserByUsername(username);
	if(!user){
		return res.status(400).json({ message: 'Cet utilisateur n\'existe pas !' });
	}

	const match = await bcrypt.compare(password, user.password);
	
	if (match) {
		req.session.connected = true;
		username_connected = username;
	  	req.session.username = username;
	  	res.status(200).send({ success: true });
	} else {
		res.status(401).send({ success: false, message: 'Identifiants invalides' });
	}
});

/**
 * Méthode permettant de gérer l'inscription d'un utilisateur
 * Le mot de passe est chiffré avec un sel de longueur 10
 */
app.post('/register', async (req, res) => {
	const { username, password } = req.body;

	try {
		const alreadyExists = await userHandler.getUserByUsername({ username });
		if (alreadyExists) {
		  return res.status(400).json({ message: 'Un utilisateur avec ce nom utilisateur existe déjà' });
		}
		const hash = await bcrypt.hash(password, 10);
		const newUser = { username, password: hash };
	
		await userHandler.createUser(newUser);
		res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
	} catch(error){
		res.status(500).json({ message: 'Erreur lors de l\'inscription de l\'utilisateur' });
	}
});

/**
 * Méthode permettant à l'utilisateur de se déconnecter
 * Cette méthode supprime les cookies et variables de sessions initialisés
 */
app.post('/logout', (req, res) => {
	req.session.destroy((err) => {
	  if (err) {
		console.error('Erreur lors de la déconnexion :', err);
	  } else {
		username_connected = null;
		res.clearCookie('connect.sid'); 
		res.status(200).send({ success: true });
	}
	});
});

// PARTIE API

/**
 * Méthode permettant de récupérer tous les bots présents dans la base de données
 */
app.get('/get-all-bots', async (req,res) => {
	try{
		let arrayBots = await botHandler.getAllBots();
		res.status(200).json(arrayBots);
	}
	catch(err){
		console.log(`Error ${err} thrown... stack is : ${err.stack}`);
		res.status(404).send('NOT FOUND');
	}
})

/**
 * Méthode permettant de récupérer tous les bots dont le serveur est allumé
 * Sert pour récupérer les bots dans l'onglet conversation
 */
app.get('/get-all-bots-started', async (req,res) => {
	try{
		let arrayBots = await botHandler.getAllBots();
		let i = 0;
		while (i < arrayBots.length) {
		  const a = arrayBots[i];
		  if (!serverMap.get(a.id) && !serverMap.get((a.id).toString())) {
			arrayBots.splice(i, 1);
		  } else {
			i++;
		  }
		}
		res.status(200).json(arrayBots);
	}
	catch(err){
		console.log(`Error ${err} thrown... stack is : ${err.stack}`);
		res.status(404).send('NOT FOUND');
	}
})

/**
 * Méthode permettant de récupérer le nom d'un bot afin de l'afficher dans l'onglet conversation
 */
app.get('/get-name-bot/:port', async (req,res) => {
	const port = req.params.port;

	let botName = await botHandler.getBotNameByPort(port);
	if(botName != null){
		res.status(200).json(botName);
	} else {
		res.status(404).json({message: 'Aucun bot ne possède ce port'});
	}
})

/**
 * Méthode permettant de récupérer tous les cerveaux présents dans le dossier brains de front
 */
app.get('/get-brains', (req, res) => {
	fs.readdir(folderBrains, (err, files) => {
		if (err) {
		  console.error(`Erreur lors de la lecture du dossier "${folderBrains}" : ${err.message}`);
		  return res.status(500).send('Erreur lors de la lecture du dossier "brains".');
		}
	
		// Retourner la liste des fichiers au format JSON
		res.json(files.filter(file => file.endsWith('.rive')));
	});
})

/**
 * Méthode permettant de vérifier si un bot est connecté
 * Permet notamment de changer le bouton démarrer en bouton éteindre
*/
app.get('/checkServer/:id', (req, res) => {
	const id = req.params.id;
	const serverExists = serverMap.has(id);
	res.json({ exists: serverExists });
});

/**
 * Méthode permettant de créer un nouveau bot et de l'ajouter en base de données
 */
app.post('/',(req,res)=>{
	let newBot = req.body.name;
	botHandler
		.createBot(newBot) 
		.then((returnString)=>{
			console.log(returnString);
			res.status(201).json({message: 'All is OK'});
		})
		.catch((err)=>{
			console.log(`Error ${err} thrown... stack is : ${err.stack}`);
			res.status(400).json({message: 'BAD REQUEST'});
		});
});

/**
 * Méthode permettant de démarrer ou d'éteindre un bot
 * Cette méthode peut créer/détruire un serveur sur le port associé au bot
 */
app.post('/start-stop/:id', async (req,res) => {
	let id = req.params.id;
	let botToStart = await botHandler.getBot(id);

	if(botToStart == null){
		res.status(404).send("Ce bot n'existe pas");
		return
	}
	const serverToClose = serverMap.get(id);
	//si le serveur est démarré alors on va l'éteindre
	if(serverToClose){
		serverToClose.close(() => {
			console.log(`Le bot ` + botToStart.name + " a été arrêté sur le port : " + botToStart.port);
			serverMap.delete(id);
			riveScriptMap.delete(id);
			res.status(201).send('Bot stopped');
		})
	} else {
		//sinon on démarre le serveur sur le port associé au bot
		const server = app.listen(botToStart.port, async () => {
			console.log(`Le bot ` + botToStart.name + " a été démarré sur le port : " + botToStart.port);

			const user = await userHandler.getUserByUsername(username_connected)
			//on récupère dans les données de l'utilisateur, les informations qu'il a fourni à un bot
			if(user != null && user.data && typeof user.data === 'object'){
				for (const [key, value] of Object.entries(user.data)) {
					//on charge ces informations dans le cerveau du bot
					riveScriptMap.get(id).setUservar(username_connected, key, value);
				}
			} 

			/**
			 * Méthode permettant de recevoir un message de l'utilisateur et de lui répondre
			 * Cette méthode va analyser le message pour en resortir une information personnelle
			 */
			app.get('/message/:message', async (req, res) => {
				const message = req.params.message;

				const regex = /my (\w+) is (\w+|\d+)/i;

				const match = message.match(regex);

				if (match && match.length === 3) {
					const category = match[1]; 

					let value = match[2]; 

					//si l'utilisateur n'a aucune donnée
					if(!(user.data)){
						user.data = new Map();
					}

					if(typeof user.data != Map){
						user.data = new Map(Object.entries(user.data));
					} 

					user.data.set(category, value);


					let retUpdateData = await userHandler.updateData(user.username,user.data);

					//on enregistre une nouvelle donnée dans le cerveau du bot
					riveScriptMap.get(id).setUservar(username_connected, category, value);
				}

				riveScriptMap.get(id).sortReplies();
				//on répond à l'utilisateur en prenant en compte son identité pour récupérer des informations personnelles
				const reply = await riveScriptMap.get(id).reply(username_connected, message);
				res.send(reply);
			});

			/**
			 * Méthode permettant d'envoyer un bot sur Discord
			 */
			app.get('/go-discord', async (req, res) => {
				const client = new discord.Client({
					intents: [
						discord.IntentsBitField.Flags.Guilds,
						discord.IntentsBitField.Flags.GuildMessages,
						discord.IntentsBitField.Flags.DirectMessages,
					]});
				const bot = await botHandler.getBot(id);

				client.on('ready', () => {
					console.log(`${bot.name} est connecté en tant que ${client.user.tag} sur discord`);
				});

				/**
				 * Méthode déclenchée lorsque un utilisateur discord identifie notre bot
				 * Exemple : @NOM_BOT hello
				 */
				client.on('messageCreate', async (msg) => {
					let content = msg.content.split(' ');
					if(content.length < 2) return;
					if(msg.author.bot) return;
					content.shift();
					content = content.join(' ');
					if(content != " ") {
						riveScriptMap.get(id).sortReplies();
						//répond en prenant les données de l'utilisateur connecté à Talkbot en compte
						//attention : non sécurisé en pratique mais utile dans le test du partage de mémoire
						const reply = await riveScriptMap.get(id).reply(username_connected, content);
						msg.channel.send(reply);
					} 
				})

				//si le bot a un token discord défini alors on connecte le bot à discord
				if(bot.discord_token != null && bot.discord_token != undefined && bot.discord_token != ''){
					client.login(bot.discord_token);
				}

			});

			/**
			 * Méthode permettant d'envoyer un bot sur Mastodon
			 * ! Méthode non testée car pas d'accès à Mastodon (inscription en attente de validation)
			 */
			app.get('/go-mastodon', async (req, res) => {
				const bot = await botHandler.getBot(id);

				//si le bot a un token mastodon alors on établit la connexion
				if(bot.mastodon_token != null && bot.mastodon_token != undefined && bot.mastodon_token != ''){
					const mastodon = new Mastodon({
						access_token: bot.mastodon_token,
						api_url: 'https://botsin.space/api/v1/'
					})

					//si le bot reçoit un message privé sur Mastodon
					mastodon.stream('streaming/user', (stream) => {
						stream.on('message', async (notification) => {
						  if (notification.type === 'direct_message') {
							const message = notification.data;
							const sender = message.account.username;
							const content = message.content;
					  
							console.log(`Nouveau message direct de ${sender}: ${content}`);

							if(content != " ") {
								riveScriptMap.get(id).sortReplies();
								//répond en prenant les données de l'utilisateur connecté à Talkbot en compte
								//attention : non sécurisé en pratique mais utile dans le test du partage de mémoire
								const reply = await riveScriptMap.get(id).reply(username_connected, content);
							
								mastodon.post(`statuses`, { status: reply, in_reply_to_id: message.id }, (error, data) => {
									if (error) {
										console.error('Erreur lors de la réponse au message direct :', error);
									} else {
										console.log('Réponse au message direct envoyée avec succès :', data);
									}
								});
							} 	
						  }
						});
					  
						stream.on('error', (error) => {
						  console.error('Une erreur s\'est produite lors de conversation :', error);
						});
					  });
				}

			});

			/**
			 * Méthode permettant de charger un ou plusieurs cerveaux dans un bot démarré
			 */
			app.get('/load-brain', async (req,res) => {
				const bot = await botHandler.getBot(id);
				const botRivescript = riveScriptMap.get(id);
				if(bot != null){
					bot.brain.forEach(br => {
						const brPath = `${folderBrains}/${br}`;
						if(botRivescript != null){
							botRivescript
							.loadFile(brPath)
							.then(() => {
							})
							.catch((err) => {
							});
						}
					})
					botRivescript.sortReplies();
					//tentative de changement du nom du bot : échec ?
					botRivescript.setVariable('name',botToStart.name)
					res.status(201).json({ data: 'Les cerveaux ont bien été chargés' });

				}                            
			})

			res.status(201).send('Bot started');
		})
	
		//ajoute le serveur dans le HashMap pour ne pas le perdre
		serverMap.set(id,server);
		//ajoute le bot dans le HashMap pour ne pas le perdre
		riveScriptMap.set(id,new RiveScript());
	}
})

/**
 * Méthode permettant d'ajouter un nouveau cerveau à un bot
 */
app.post('/add-brain/:id/:brain', async (req,res) => {
	const id = req.params.id;
	const brain = req.params.brain;

	botHandler
		.addBrain(id,brain)
		.then(async (returnString)=>{
			console.log(returnString);
			if(serverMap.get(id)){
				//await serverMap.get(id).reloadBrain();
			}
			res.status(201).json({message: 'All is OK'});
		})
		.catch((err)=>{
			console.log(`Error ${err} thrown... stack is : ${err.stack}`);
			res.status(400).json({message: 'BAD REQUEST'});
		});
})

/**
 * Méthode permettant de mettre à jour / d'ajouter un token (discord ou mastodon) à un bot
 */
app.put('/update_token/:id', (req, res) => {
	const id = req.params.id;
	const { platform, token } = req.body;
  
	if (platform === 'discord') {
	  botHandler
		.updateTokenDiscord(id, token)
		.then(() => {
		  res.status(201).json({ message: 'Le token pour la plateforme Discord a bien été mise à jour' });
		})
		.catch((err) => {
		  console.log(`Error: ${err}`);
		  res.status(400).json({ message: 'Bad Request' });
		});
	} else if (platform === 'mastodon') {
	  botHandler
		.updateTokenMastodon(id, token)
		.then(() => {
		  res.status(201).json({ message: 'Le token pour la plateforme Mastodon a bien été mise à jour' });
		})
		.catch((err) => {
		  console.log(`Error: ${err}`);
		  res.status(400).json({ message: 'Bad Request' });
		});
	} else {
	  res.status(400).json({ message: 'Invalid platform' });
	}
});
  
/**
 * Méthode permettant de supprimer un cerveau d'un bot
 */
app.delete('/remove-brain/:id/:brain', async (req,res) => {
	const id = req.params.id;
	const brain = req.params.brain;

	botHandler
		.removeBrain(id,brain)
		.then(async (returnString)=>{				
			console.log(returnString);
			if(serverMap.get(id)){
				//await serverMap.get(id).reloadBrain();
			}
			res.status(201).json({message: 'All is OK'});
		})
		.catch((err)=>{
			console.log(`Error ${err} thrown... stack is : ${err.stack}`);
			res.status(400).json({message: 'BAD REQUEST'});
		});
})

/**
 * Méthode permettant de supprimer un bot
 */
app.delete('/:id',(req,res) => {
	let id = req.params.id;

	if(!isInt(id)) {
		res.status(400).send('BAD REQUEST');
	} else {
		botHandler
			.removeBot(id)
			.then((returnString)=>{
				console.log(returnString);
				res.status(201).send('All is OK');
			})
			.catch((err)=>{
				console.log(`Error ${err} thrown... stack is : ${err.stack}`);
				res.status(400).send('BAD REQUEST');
			});	
	}		
});

// lancer le serveur principal
const mainServer = app.listen(port, () => {
	console.log(`L'application web est lancée sur l'URL http://localhost:${port}`)
});

// en principe ferme tous les serveurs en cas de fermeture du serveur principal
mainServer.on('close', () => {
	for (const server of serverMap.values()) {
	  server.close();
	}
  
	console.log('Tous les serveurs de bot ont été fermés.');
	console.log('Le serveur principal sur le port 3000 est fermé.');
});

//permet de vérifier qu'une valeur est bien un integer
//utile pour vérifier que l'ID est numérique
function isInt(value) {
	let x = parseFloat(value);
	return !isNaN(value) && (x | 0) === x;
}

