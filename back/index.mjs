import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

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

const app = express();
app.use(cors()); // Enable ALL CORS request
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); //Swagger Middleware to produce doc
const port = 3000

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("La base de données a été crée");
    db.close();
});


app.get('/',(req,res) => {
    try {
        let arrayBot;

    }
})