import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import RiveScript from 'rivescript';

import {BotHandler} from "./model/BotHandler.mjs";
import {UserHandler} from "./model/UserHandler.mjs";

const botHandler = new BotHandler();
const userHandler = new UserHandler();
await botHandler.connectToDatabase();
await userHandler.connectToDatabase();

const serverMap = new Map();
const riveScriptMap = new Map();

const app = express();
const port = 3000

app.set('view engine', 'ejs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set('views', path.join(__dirname, '../front/views')); // Définir le chemin des vues

const assetsPath = path.join(__dirname, '../front/assets');
app.use('/assets', express.static(assetsPath));

app.use(session({
	secret: 'bot_secret_key',
	resave: false,
	saveUninitialized: true
}));

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 
const folderBrains = path.join(__dirname, '../front/brains');

var username_connected = null

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

app.get('/get-state-bot/:id', async (req, res) => {
	let id = req.params.id;
	let botToExam = await botHandler.getBot(id);

	if(botToExam == null){
		res.status(404).send(false);
		return
	}

	const server = serverMap.get(id);
	if(server){
		res.status(201).send(true);
	} else {
		res.status(201).send(false);
	}
})

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

app.post('/start-stop/:id', async (req,res) => {
	let id = req.params.id;
	let botToStart = await botHandler.getBot(id);

	if(botToStart == null){
		res.status(404).send("Ce bot n'existe pas");
		return
	}

	const serverToClose = serverMap.get(id);
	if(serverToClose){
		serverToClose.close(() => {
			console.log(`Le bot ` + botToStart.name + " a été arrêté sur le port : " + botToStart.port);
			serverMap.delete(id);
			riveScriptMap.delete(id);
			res.status(201).send('Bot stopped');
		})
	} else {
		const server = app.listen(botToStart.port, () => {
			console.log(`Le bot ` + botToStart.name + " a été démarré sur le port : " + botToStart.port);

			app.get('/message/:message', async (req, res) => {
				const message = req.params.message;
				riveScriptMap.get(id).sortReplies();

				console.log(username_connected)

				const reply = await riveScriptMap.get(id).reply('local-user', message);
				res.send(reply);
			});

			app.get('/load-brain', async (req,res) => {
				const bot = await botHandler.getBot(id);
				const botRivescript = riveScriptMap.get(id);                            
				bot.brain.forEach(br => {
					const brPath = `${folderBrains}/${br}`;
					botRivescript
						.loadFile(brPath)
						.then(() => {
							console.log(`Le cerveau du bot ${bot.name} a été chargé avec ${brPath}`);
						})
						.catch((err) => {
						});
				})
				botRivescript.sortReplies();
			})

			res.status(201).send('Bot started');
		})
	
		serverMap.set(id,server);
		riveScriptMap.set(id,new RiveScript());
	}
})

app.get('/checkServer/:id', (req, res) => {
	const id = req.params.id;
	const serverExists = serverMap.has(id);
	res.json({ exists: serverExists });
});

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

app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname, '../front/views/login.html'));
});

app.get('/register', (req, res) => {
	res.sendFile(path.join(__dirname, '../front/views/register.html'));
});

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

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../front/views/index.html'));
});
  
app.get('/add_bot', (req, res) => {
	res.sendFile(path.join(__dirname, '../front/views/add_bot.html'));
});

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

app.post('/register', async (req, res) => {
	const { username, password } = req.body;

	try {
		const alreadyExists = await userHandler.getUser({ username });
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

const mainServer = app.listen(port, () => {
	console.log(`L'application web est lancée sur l'URL http://localhost:${port}`)
});

mainServer.on('close', () => {
	for (const server of serverMap.values()) {
	  server.close();
	}
  
	console.log('Tous les serveurs de bot ont été fermés.');
	console.log('Le serveur principal sur le port 3000 est fermé.');
});

function isInt(value) {
	let x = parseFloat(value);
	return !isNaN(value) && (x | 0) === x;
}

