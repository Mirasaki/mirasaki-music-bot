const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const {
  getGuildSettings, db, saveDb
} = require('../../modules/db');

module.exports = new ChatInputCommand({
  global: true,
  permLevel: 'Administrator',
  data: {
    description: 'When using Thread Sessions, requires all related music commands to be in the dedicated thread',
    options: [
      {
        name: 'set',
        description: 'Enable or disable this setting',
        type: ApplicationCommandOptionType.Boolean,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;
    const newSetting = interaction.options.getBoolean('set');
    const guilds = db.getCollection('guilds');

    // Check conditions/state
    if (!requireSessionConditions(interaction, false)) return;

    // Resolve settings
    const settings = getGuildSettings(guild.id);
    if (typeof newSetting === 'undefined' || newSetting === null) {
      // eslint-disable-next-line sonarjs/no-nested-template-literals
      interaction.reply(`${ emojis.success } ${ member }, \`Use Strict Thread Sessions\` is currently **${ settings.threadSessionStrictCommandChannel ? `${ emojis.success } Enabled` : `${ emojis.error } Disabled` }**`);
      return;
    }

    try {
      // Perform and notify collection that the document has changed
      settings.threadSessionStrictCommandChannel = newSetting;
      guilds.update(settings);
      saveDb();

      // Feedback
      // eslint-disable-next-line sonarjs/no-nested-template-literals
      await interaction.reply({ content: `${ emojis.success } ${ member }, \`Use Strict Thread Sessions\` has been **${ newSetting === true ? `${ emojis.success } Enabled` : `${ emojis.error } Disabled` }**` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
