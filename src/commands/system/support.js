const { stripIndents } = require('common-tags');
const { ChatInputCommand } = require('../../classes/Commands');
const { colorResolver } = require('../../util');

module.exports = new ChatInputCommand({
  global: true,
  cooldown: {
    // Use channel cooldown type instead of default member,
    type: 'channel',
    usages: 1,
    duration: 15
  },
  clientPerms: [ 'EmbedLinks' ],
  data: {
    name: 'support',
    description: 'Get a link to this bot\'s support server'
  },

  run: (client, interaction) => {
    interaction.reply({ embeds: [
      {
        // Not passing an parameter to colorResolver
        // will fall-back to client.container.colors.main
        color: colorResolver(),
        author: {
          name: client.user.username,
          iconURL: client.user.avatarURL({ dynamic: true })
        },
        // Strip our indentation using common-tags
        description: stripIndents`
          [${ client.user.username } Support Server](${ client.container.config.supportServerInviteLink } "${ client.user.username } Support Server")

          **__Use this server for:__**
          \`\`\`diff
            + Any issues you need support with
            + Bug reports
            + Giving feedback
            + Feature requests & suggestions
            + Testing beta features & commands
            + Be notified of updates
          \`\`\`
        `
      }
    ] });
  }
});
