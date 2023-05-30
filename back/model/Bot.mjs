class Bot {
    constructor(name,id,port,brain,discord_token,mastodon_token) {
        this.name = name;
        this.id = id;
        this.port = port;
        this.brain = brain;
        this.discord_token = discord_token;
        this.mastodon_token = mastodon_token;
      }
}

export {Bot}
