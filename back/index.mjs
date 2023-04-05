import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import RiveScript from 'rivescript';

/// SWAGGER PART
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for TaskManagment',
    version: '1.0.0',
    description: 'This is a sample code for a bootstrap REST API following OpenAPI',
  	servers:[
  		{
  			url:'http://localhost:3001',
  			description:'Developpment server',
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


///////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
app.use(cors()); // Enable ALL CORS request
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); //Swagger Middleware to produce doc
const port = 3001

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 