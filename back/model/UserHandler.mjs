import {User} from "./User.mjs";
import {MongoClient} from 'mongodb';

class UserHandler {
    constructor(){
        this.dbURL = "mongodb://localhost:27017/";
        this.dbName = "penavaire_delaunay_bot";
        this.client = new MongoClient(this.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });
        this.usersCollection = null;
    }

    async connectToDatabase(){
        try {
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.db.listCollections({ name: "users" }).next(function(err, collinfo) {
                if (err) throw err;
                if (collinfo) {
                    console.log("La collection de users existe déjà !");
                    this.client.close();
                    return;
                }
        
                this.db.createCollection("users", function(err, res) {
                    if (err) {
                        console.error("Erreur lors de la création de la collection de users :", err);
                        this.client.close();
                        return;
                    }
                    console.log("La collection de users a été créée !");
                    this.client.close();
                });
            });
            this.usersCollection = this.db.collection("users");
        } catch (error) {
            console.error("Erreur lors de la connexion MongoDB :", error);
        }
    }

    async createUser(user){
        const newUser = { username: user.username, password: user.password };
        await this.usersCollection.insertOne(newUser, function(err, res) {
                if (err) throw err;
                this.client.close();
        });
        return "L'utilisateur " + newUser.username + " a été crée";
    }

    async getUser(user_arg) {
        try {
          await this.client.connect();
          const user = await this.usersCollection.findOne({ username: user_arg.username });
          if (!user) {
            console.log(`L'utilisateur dont le username est ${user_arg.username} n'existe pas.`);
            return null;
          }
          const result = new User(user.username,user.password,user.data);
          return result;
        } catch (error) {
          console.error(error);
          throw error;
        }
    }

    async getUserByUsername(user_arg) {
        try {
          await this.client.connect();
          const user = await this.usersCollection.findOne({ username: user_arg });
          if (!user) {
            console.log(`L'utilisateur dont le username est ${user_arg} n'existe pas.`);
            return null;
          }
          const result = new User(user.username,user.password,user.data);
          return result;
        } catch (error) {
          console.error(error);
          throw error;
        }
    }
}

export {UserHandler}