/**
 * Classe représentant un utilisateur
 */
class User {
    constructor(username,password,data) {
        this.username = username
        this.password = password
        //données personnelles échangées avec un bot lors d'une conversation
        //permet de conserver en mémoire afin de le charger dans le cerveau du bot lors d'une nouvelle conversation
        this.data = data;
    }
}

export {User}
