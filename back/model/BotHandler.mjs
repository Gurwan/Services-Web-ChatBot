import {Bot} from "./Bot.mjs";
import {MongoClient} from 'mongodb';

class BotHandler {
    constructor(){
        this.dbURL = "mongodb://localhost:27017/";
        this.dbName = "penavaire_delaunay_bot";
        this.client = new MongoClient(this.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });
        this.botsCollection = null;
    }

    async connectToDatabase(){
        try {
            await this.client.connect();
            console.log("Connexion MongoDB établie !");
            this.db = this.client.db(this.dbName);
            this.db.listCollections({ name: "bots" }).next(function(err, collinfo) {
                if (err) throw err;
        
                if (collinfo) {
                    console.log("La collection de bots existe déjà !");
                    this.client.close();
                    return;
                }
        
                this.db.createCollection("bots", function(err, res) {
                    if (err) {
                        console.error("Erreur lors de la création de la collection de bots :", err);
                        this.client.close();
                        return;
                    }
                    console.log("La collection de bots a été créée !");
                    this.client.close();
                });
            });
            this.botsCollection = this.db.collection("bots");
        } catch (error) {
            console.error("Erreur lors de la connexion MongoDB :", error);
        }
    }

    async createBot(botName){
        let newId = await this.getNextValue("idBot");
        let newPort = await this.getNextValue("port");
        const newBot = { id: newId, name: botName, port: newPort, brain: ['standard.rive'] };
        await this.botsCollection.insertOne(newBot, function(err, res) {
                if (err) throw err;
                this.client.close();
        });
        return "Le bot " + newBot.name + " a été crée, il a pour id " + newBot.id + " et pour port " + newBot.port;
    }

    async getBot(idBot) {
        idBot = parseInt(idBot);
        try {
          await this.client.connect();
          const bot = await this.botsCollection.findOne({ id: idBot });
          if (!bot) {
            console.log(`Bot avec ID ${idBot} n'a pas été trouvé.`);
            return null;
          }
          const result = new Bot(bot.name, bot.id, bot.port, bot.brain, bot.discord_token, bot.mastodon_token);
          return result;
        } catch (error) {
          console.error(error);
          throw error;
        }
    }

    async addBrain(idBot,brain){
        idBot = parseInt(idBot);
        await this.client.connect();
        const res = await this.botsCollection.updateOne({ id: idBot }, {$addToSet: {brain:brain}});
        if (res.modifiedCount === 1) {
            return `Le cerveau ${brain} a été ajouté au bot ${idBot}`;
        } else {
            return `L'ajout du cerveau ${brain} au bot ${idBot} a échoué`;
        }
    }

    async updateTokenMastodon(idBot, token) {
        idBot = parseInt(idBot);
        await this.client.connect();
        const res = await this.botsCollection.updateOne({ id: idBot }, { $set: { mastodon_token: token } });
        if (res.modifiedCount === 1) {
          return `Le token Mastodon a été mis à jour pour le bot ${idBot}`;
        } else {
          return `La mise à jour du token Mastodon pour le bot ${idBot} a échoué`;
        }
    }
      
    async updateTokenDiscord(idBot, token) {
      idBot = parseInt(idBot);
      await this.client.connect();
      const res = await this.botsCollection.updateOne({ id: idBot }, { $set: { discord_token: token } });
      if (res.modifiedCount === 1) {
        return `Le token Discord a été mis à jour pour le bot ${idBot}`;
      } else {
        return `La mise à jour du token Discord pour le bot ${idBot} a échoué`;
      }
    }   

    async removeBrain(idBot,brain){
        idBot = parseInt(idBot);
        await this.client.connect();
        const bot = await this.getBot(idBot);
        const updatedBrains = bot.brain.filter((b) => b !== brain);
        const res = await this.botsCollection.updateOne({ id: idBot }, {$set: {brain:updatedBrains}});
        if (res.modifiedCount === 1) {
            return `Le cerveau ${brain} a été supprimé du bot ${idBot}`;
        } else {
            return `La suppression du cerveau ${brain} au bot ${idBot} a échoué`;
        }
    }

    async getNextValue(name) {
        await this.client.connect();
        const sequenceCollection = this.db.collection("counters");
        let sequenceDocument = await sequenceCollection.findOne({ _id: name });
        if (!sequenceDocument) {
            if(name == "port"){
                sequenceDocument = { _id: name, sequence_value: 3001 };
            } else {
                sequenceDocument = { _id: name, sequence_value: 0 };
            }
            await sequenceCollection.insertOne(sequenceDocument);
        }
        const result = await sequenceCollection.findOneAndUpdate(
            { _id: name },
            { $inc: { sequence_value: 1 } },
            { returnOriginal: false }
        );
        //this.client.close();
        return result.value.sequence_value;
    }

    async getAllBots(){
        await this.client.connect();
        let arrayBots = await this.botsCollection.find({}).toArray();
        let result = arrayBots.map(element => new Bot(element.name, element.id, element.port, element.brain, element.discord_token, element.mastodon_token));
        return result;
    }

    async removeBot(idBot){
        let ret = "";
        idBot = parseInt(idBot);
        try {
            await this.client.connect();
            const bot = await this.getBot(idBot);
            if(bot !== null){
                const result = await this.botsCollection.deleteOne({ id: idBot });
                if (result.deletedCount === 1) {
                    ret = `Bot avec id ${idBot} supprimé avec succès.`;
                } else {
                    ret = `La suppression du bot avec id ${idBot} a échoué.`;
                }
            } else {
                ret = `La suppression du bot avec id ${idBot} est impossible car ce bot n'existe pas.`;
            }
        } catch (err) {
            console.error("Erreur lors de la suppression du bot : " + err);
        } finally {
            await this.client.close();
        }
        return ret;
	}
}

export {BotHandler}