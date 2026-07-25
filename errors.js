// Erreur dont le message est destiné à l'utilisateur Discord: index.js le renvoie
// tel quel, au lieu de retomber sur le message d'aide générique.
export class UserError extends Error {}
