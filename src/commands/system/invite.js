const { getBotInviteLink, colorResolver } = require('../../util');
const { ChatInputCommand } = require('../../classes/Commands');

// Not really needed with the release of the button on bot profiles in Discord
// and soon, Bot/App Discovery

module.exports = new ChatInputCommand({
  global: true,
  cooldown: {
    // Use guild/server cooldown instead of default member
    type: 'guild',
    usages: 3,
    duration: 10
  },
  clientPerms: [ 'EmbedLinks' ],
  data: { description: 'Add the bot to your server!' },

  run: async (client, interaction) => {
    // Replying to the interaction with the bot-invite link
    // Not a top-level static variable to take /reload
    // changes into consideration
    interaction.reply({ embeds: [
      {
        color: colorResolver(client.container.colors.invisible),
        description: `[Add me to your server](${ getBotInviteLink(client) })`
      }
    ] });
  }
});
