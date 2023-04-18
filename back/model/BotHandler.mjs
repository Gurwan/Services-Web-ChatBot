import {Bot} from "./Bot.mjs";
import {MongoClient} from 'mongodb';

class BotHandler {
    constructor(){
        this.dbURL = "mongodb://localhost:27017/";
        MongoClient.connect(this.dbURL, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.createCollection("bots", function(err, res) {
                if (err) throw err;
                console.log("La collection de bots a été crée");
                db.close();
            });
        });
    }

    async createBot(bot){
        MongoClient.connect(this.dbURL, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            var newBot = { id: bot.id, name: bot.name, port: bot.port };
            dbo.collection("bots").insertOne(newBot, function(err, res) {
                if (err) throw err;
                console.log("Le bot a été crée");
                db.close();
            });
        });
    }

    getBot(id){
		MongoClient.connect(this.dbURL, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection("bots").findOne({id: id}, function(err,result) {
                if (err) throw err;
                db.close();
                return new Bot(result.name,result.id,result.port);
            })
        })	
	}

	getAllBots(){
        let arrayBots = []
        MongoClient.connect(this.dbURL, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection("bots").find({}).toArray(function(err, result) {
              if (err) throw err;
              result.forEach(element => {
                    arrayBots.push(new Bot(element.name, element.id, element.port))
              });
              db.close();
            });
          });
		return arrayBots;
	}
}

export {BotHandler}