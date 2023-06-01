/**
 * Classe représentant un bot
 */
class Bot {
    constructor(name,id,port,brain,discord_token,mastodon_token) {
        //nom du bot
        this.name = name;
        //id du bot
        this.id = id;
        //port du bot permettant de lancer son serveur par la suite
        this.port = port;
        //cerveau(x) du bot
        this.brain = brain;
        //token de connexion à discord
        this.discord_token = discord_token;
        //token de connexion à mastodon
        this.mastodon_token = mastodon_token;
      }
}

export {Bot}
