import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import RiveScript from 'rivescript';

import {MongoClient, MongoParseError} from 'mongodb';
import {BotHandler} from "./model/BotHandler.mjs";


/// SWAGGER PART
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Administration de Rive',
    version: '1.0.0',
    description: '',
  	servers:[
  		{
  			url:'http://localhost:3000',
  			description:'Development server',
  		},
  	],
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./*.mjs', './model/*.mjs'],
};

const swaggerSpec = swaggerJSDoc(options);
const botHandler = new BotHandler();
await botHandler.connectToDatabase();

const serverMap = new Map();
const riveScriptMap = new Map();

const app = express();
app.use(cors()); // Enable ALL CORS request
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); //Swagger Middleware to produce doc
const port = 3000

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const folderBrains = path.join(__dirname, '../front/brains');

app.get('/', async (req,res) => {
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

			app.get('/message/:message', (req, res) => {
				const message = req.params.message;
				const reply = riveScriptMap.get(id).reply('local-user', message);
				res.send(reply);
			  });

			res.status(201).send('Bot started');
		})
	
		serverMap.set(id,server);
		riveScriptMap.set(id,new RiveScript());
	}
})

app.post('/add-brain/:id/:brain', async (req,res) => {
	const id = req.params.id;
	const brain = req.params.brain;

	const bot = await botHandler.getBot(id);
	bot.brain.push(brain)

	botHandler
		.addBrain(id,brain)
		.then((returnString)=>{
			const botRivescript = riveScriptMap.get(id);
			botRivescript.loadDirectory(bot.brain, () => {
				console.log(`Le cerveau du bot ${bot.name}! a été chargé`);
				botRivescript.sortReplies();
			})
			console.log(returnString);
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

	const bot = await botHandler.getBot(id);

	const index = bot.brain.indexOf(brain);
	if (index !== -1) {
		bot.brain.splice(index,1)
	}

	botHandler
		.removeBrain(id,brain)
		.then((returnString)=>{
			const botRivescript = riveScriptMap.get(id);
			botRivescript.loadDirectory(bot.brain, () => {
				console.log(`Le cerveau du bot ${bot.name}! a été chargé`);
				botRivescript.sortReplies();
			})
			console.log(returnString);
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

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
});

function isInt(value) {
	let x = parseFloat(value);
	return !isNaN(value) && (x | 0) === x;
}

