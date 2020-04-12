const Discord = require('discord.js');

const { processInput } = require('./players');
const { moonBreak } = require('./mb');
const { getCommerceMessage } = require('./commerce')

const client = new Discord.Client();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
	try {
		if (msg.author.bot) {
			return;
		}

		const auth_member = msg.guild.member(msg.author);
		if (!auth_member) {
			return;
		}

		if (msg.content.startsWith('!ogp')) {
			const message = await processInput(msg.content);
			msg.channel.send(message);
		} else if (msg.content.startsWith('!mb')) {
			const message = moonBreak(msg.content);
			msg.channel.send(message);
		} else if (msg.content.startsWith('!ogc')) {
			const message = getCommerceMessage(msg.content);
			msg.channel.send(message);
		} else if (msg.content.startsWith('!og help')) {
			msg.channel.send(`
Les commandes possibles sont:.
- !ogp <n°> <lang> <Nom du joueur>
- !ogc <M|C|D> <60/40> <2:1.5:1> <nombre>
- !mb <taille> <Rips>
			`);
		}
	} catch (error) {
		console.error(error);
		msg.channel.send(`
Erreur lors de la commande du bot.
- !ogp <n°> <lang> <Nom du joueur>
- !ogc <M|C|D> <60/40> <2:1.5:1> <nombre>
- !mb <taille> <Rips>
		`);
	}
});

client.login(process.env.DISCORD_TOKEN);
