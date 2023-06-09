const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');

module.exports = new ChatInputCommand({
  permLevel: 'Developer',
  // Global rate limit of 2 requests per hour
  cooldown: {
    usages: 2,
    duration: 3600,
    type: 'global'
  },
  data: {
    description: 'Update the bot\'s username',
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'name',
        description: 'The bot\'s new username',
        required: true
      }
    ]
  },

  run: async (client, interaction) => {
    const { member, options } = interaction;
    const { emojis } = client.container;
    const name = options.getString('name');
    client.user
      .setUsername(name)
      .then(() => interaction.reply(`${ emojis.success } ${ member }, name was successfully updated!`))
      .catch((err) => interaction.reply(`${ emojis.error } ${ member }, couldn't update bot's username:\n\n${ err.message }`));
  }
});
