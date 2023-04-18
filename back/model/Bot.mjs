class Bot {
    constructor(name,id,port) {
        this.name = name;
        this.id = id++;
        this.port = port++;
      }
    
      start() {
        app.get(`/${this.name}`, (req, res) => {
          res.send(`Bonjour, je suis ${this.name}!`);
        });
    
        app.listen(this.port, () => {
          console.log(`Le bot ${this.name} est démarré sur le port ${this.port}`);
        });
    }
}

export {Bot}
