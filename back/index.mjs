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

const app = express();
app.use(cors()); // Enable ALL CORS request
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); //Swagger Middleware to produce doc
const port = 3000

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 

var url = "mongodb://localhost:27017/mydb";

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("La base de données a été crée");
    db.close();
});

app.get('/',(req,res) => {
	try{
		let arrayBots = [];
		if( undefined == (arrayBots = botHandler.getAllBots() )){
			throw new Error("No bots to get");
		}
		res.status(200).json(arrayBots);
	}
	catch(err){
		console.log(`Error ${err} thrown... stack is : ${err.stack}`);
		res.status(404).send('NOT FOUND');
	}
})

app.post('/',(req,res)=>{

    /*
	let thePersonToAdd = req.body;
	personServiceInstance
		.addPerson(thePersonToAdd) 
		.then((returnString)=>{
			console.log(returnString);
			res.status(201).send('All is OK');
		})
		.catch((err)=>{
			console.log(`Error ${err} thrown... stack is : ${err.stack}`);
			res.status(400).send('BAD REQUEST');
		});*/	
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
});


