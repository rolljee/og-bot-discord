const Discord = require('discord.js');

const { createLink } = require('./create-link');
const { getAlliance } = require('./alliances');
const { getCommerceMessage } = require('./commerce');
const { getExpeditions } = require('./expeditions');
const { getPlayer } = require('./players');
const { getUniverseData } = require('./serverData');
const { moonBreak } = require('./mb');

const client = new Discord.Client();

function getHelpMessage() {
  const embed = new Discord.MessageEmbed()
    .setTitle('Commandes du plugins\n\u200b')
    .setAuthor(client.user.username, client.user.avatarURL())
    .setColor('#000000')
    .setThumbnail(
      'https://apprecs.org/ios/images/app-icons/256/a7/553453991.jpg',
    )
    .addField(
      '`!ogp <n°> <lang> <Nom du joueur>`',
      'Affiche les planètes d\'un joueur\n\u200b',
    )
    .addField(
      '`!ogc <M|C|D> <60/40> <2:1.5:1> <nombre>`',
      'Commerce de ressources\n\u200b',
    )
    .addField(
      '`!ogs <n°> <lang>`',
      'Affiche les informations d\'un serveur\n\u200b',
    )
    .addField(
      '`!oge <n°> <lang> <niveau de recherche hyperespace>`',
      'Affiche les informations d\'expedition d\'un serveur\n\u200b',
    )
    .addField(
      '`!ogl <n°> <lang|fr> <pos>`',
      'Affiche un lien vers la position donnée + info de lune\n\u200b',
    )
    .addField(
      '`!oga <n°> <lang> alliances`',
      'Affiche les joueur d\'une alliance \n\u200b',
    )
    .addField('`!mb <taille> <Rips>`', 'Calcul de probabilites d\'un moonbreak');

  return embed;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  try {
    if (msg.author.bot) {
      return;
    }

    const auth_member = msg.guild.member(msg.author);
    if (!auth_member) {
      return;
    }

    if (msg.content.startsWith('!ogp')) {
      const message = await getPlayer(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!mb')) {
      const message = moonBreak(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!ogc')) {
      const message = getCommerceMessage(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!ogs')) {
      const message = await getUniverseData(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!oge')) {
      const message = await getExpeditions(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!ogl')) {
      const message = await createLink(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!oga')) {
      const message = await getAlliance(msg.content);
      msg.channel.send(message);
    } else if (msg.content.startsWith('!og help')) {
      msg.channel.send(getHelpMessage());
    }
  } catch (error) {
    console.error(error);
    msg.channel.send(getHelpMessage());
  }
});

client.login(process.env.DISCORD_TOKEN);
