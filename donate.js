import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const DEFAULT_DONATE_URL = 'https://buymeacoffee.com/rolljee';

// Le lien est public, donc versionné en dur. DONATE_URL permet de le surcharger
// (fork, changement de plateforme) et `DONATE_URL=` de désactiver la commande :
// sans URL, elle reste muette et l'aide masque l'entrée plutôt que d'afficher un
// lien mort.
export function getDonateUrl() {
  return process.env.DONATE_URL ?? DEFAULT_DONATE_URL;
}

export function getDonateMessage(client) {
  const url = getDonateUrl();

  if (!url) {
    return null;
  }

  const embed = new EmbedBuilder()
    .setTitle('Offrir un café ☕')
    .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
    .setColor('#FFDD00')
    .setDescription(
      'Le bot est gratuit et sans pub. Si il te fait gagner du temps, '
      + 'tu peux participer à l\'hébergement :',
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Buy me a coffee')
      .setEmoji('☕')
      .setStyle(ButtonStyle.Link)
      .setURL(url),
  );

  return { embeds: [embed], components: [row] };
}
