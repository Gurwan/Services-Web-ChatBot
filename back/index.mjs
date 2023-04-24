import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import RiveScript from 'rivescript';

import {MongoClient} from 'mongodb';
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

const app = express();
app.use(cors()); // Enable ALL CORS request
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); //Swagger Middleware to produce doc
const port = 3000

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 

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

