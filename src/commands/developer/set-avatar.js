const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');

module.exports = new ChatInputCommand({
  permLevel: 'Developer',
  // Global rate limit of 5 requests per hour
  cooldown: {
    usages: 5,
    duration: 3600,
    type: 'global'
  },
  data: {
    description: 'Update the bot\'s avatar',
    options: [
      {
        type: ApplicationCommandOptionType.Attachment,
        name: 'avatar',
        description: 'The bot\'s new avatar',
        required: true
      }
    ]
  },

  run: async (client, interaction) => {
    const { member, options } = interaction;
    const { emojis } = client.container;
    const attachment = options.getAttachment('avatar');

    // Check content type
    if (!attachment.contentType.startsWith('image/')) {
      interaction.reply(`${ emojis.error } ${ member }, expected an image - you provided **\`${ attachment.contentType }\`** instead, this command has been cancelled`);
      return;
    }

    client.user
      .setAvatar(attachment.url)
      .then(() => interaction.reply(`${ emojis.success } ${ member }, avatar was successfully updated!`))
      .catch((err) => interaction.reply(`${ emojis.error } ${ member }, couldn't update bot's avatar:\n\n${ err.message }`));
  }
});
