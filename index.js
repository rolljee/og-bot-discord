import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

import { createLink } from './create-link.js';
import { getAlliance } from './alliances.js';
import { getCommerceMessage } from './commerce.js';
import { getExpeditions } from './expeditions.js';
import { getPlayer } from './players.js';
import { getUniverseData } from './serverData.js';
import { moonBreak } from './mb.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function getHelpMessage() {
  return new EmbedBuilder()
    .setTitle('Commandes du plugins\n​')
    .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
    .setColor('#000000')
    .setThumbnail('https://apprecs.org/ios/images/app-icons/256/a7/553453991.jpg')
    .addFields(
      { name: '`!ogp <n°> <lang> <Nom du joueur>`', value: 'Affiche les planètes d\'un joueur\n​' },
      { name: '`!ogc <M|C|D> <60/40> <2:1.5:1> <nombre>`', value: 'Commerce de ressources\n​' },
      { name: '`!ogs <n°> <lang>`', value: 'Affiche les informations d\'un serveur\n​' },
      { name: '`!oge <n°> <lang> <niveau de recherche hyperespace>`', value: 'Affiche les informations d\'expedition d\'un serveur\n​' },
      { name: '`!ogl <n°> <lang|fr> <pos>`', value: 'Affiche un lien vers la position donnée + info de lune\n​' },
      { name: '`!oga <n°> <lang> alliances`', value: 'Affiche les joueur d\'une alliance\n​' },
      { name: '`!mb <taille> <Rips>`', value: 'Calcul de probabilites d\'un moonbreak' },
    );
}

// Sends a string as message content or an EmbedBuilder as an embed.
function reply(channel, message) {
  if (message instanceof EmbedBuilder) {
    return channel.send({ embeds: [message] });
  }
  return channel.send(message);
}

client.on('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
  try {
    if (msg.author.bot || !msg.guild) {
      return;
    }

    if (msg.content.startsWith('!ogp')) {
      await reply(msg.channel, await getPlayer(msg.content));
    } else if (msg.content.startsWith('!mb')) {
      await reply(msg.channel, moonBreak(msg.content));
    } else if (msg.content.startsWith('!ogc')) {
      await reply(msg.channel, getCommerceMessage(msg.content));
    } else if (msg.content.startsWith('!ogs')) {
      await reply(msg.channel, await getUniverseData(msg.content));
    } else if (msg.content.startsWith('!oge')) {
      await reply(msg.channel, await getExpeditions(msg.content));
    } else if (msg.content.startsWith('!ogl')) {
      await reply(msg.channel, await createLink(msg.content));
    } else if (msg.content.startsWith('!oga')) {
      await reply(msg.channel, await getAlliance(msg.content));
    } else if (msg.content.startsWith('!og help')) {
      await reply(msg.channel, getHelpMessage());
    }
  } catch (error) {
    console.error(error);
    await reply(msg.channel, getHelpMessage());
  }
});

client.login(process.env.DISCORD_TOKEN);
