const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');

module.exports = new ChatInputCommand({
  enabled: process.env.NODE_ENV !== 'production',
  permLevel: 'Developer',
  data: {
    description: 'Test command for the developers',
    options: [
      {
        name: 'value',
        description: 'input',
        type: ApplicationCommandOptionType.String,
        required: true
      }
    ],
    // Unavailable to non-admins in guilds
    default_member_permissions: 0
  },

  run: (client, interaction) => {
    // ...
  }
});

