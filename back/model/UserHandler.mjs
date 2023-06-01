import {User} from "./User.mjs";
import {MongoClient} from 'mongodb';

/**
 * Classe servant de gestionnaire aux utilisateurs
 */
class UserHandler {
    constructor(){
        //adresse de la base de données MongoDB
        this.dbURL = "mongodb://localhost:27017/";
        //nom de notre base de données
        this.dbName = "penavaire_delaunay_bot";
        this.client = new MongoClient(this.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });
        this.usersCollection = null;
    }

    /**
    * Méthode permettant d'initialiser la connexion à la base de données
    */
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

    /**
     * Méthode permettant d'ajouter un utilisateur à la base de données
     * @param {User} user utilisateur à ajouter en base de données
     * @returns string indiquant que l'opération est un succès
     */
    async createUser(user){
        const newUser = { username: user.username, password: user.password, data: user.data };
        await this.usersCollection.insertOne(newUser, function(err, res) {
                if (err) throw err;
                this.client.close();
        });
        return "L'utilisateur " + newUser.username + " a été crée";
    }

    /**
     * Méthode permettant de mettre à jour les données d'un utilisateur
     * @param {*} username nom d'utilisateur de l'utilisateur 
     * @param {*} data nouvelles données de l'utilisateur
     * @returns string indiquant que l'opération est un succès
     */
    async updateData(username,data){
      try {
        await this.client.connect();
        await this.usersCollection.updateOne({username: username}, {$set: {data: data}});
        return "Les données de l'utilisateur " + username + " ont été mises à jour";
      } catch (err){
        throw err;
      }
    }

    /**
     * Méthode permettant de récupérer un utilisateur par son nom d'utilisateur
     * @param {*} user_arg nom d'utilisateur de l'utilisateur recherché 
     * @returns l'utilisateur si trouvé sinon null 
     */
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