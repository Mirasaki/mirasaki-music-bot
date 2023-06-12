const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const {
  getGuildSettings, db, saveDb
} = require('../../modules/db');
const { clientConfig, msToHumanReadableTime } = require('../../util');
const { MS_IN_ONE_SECOND } = require('../../constants');

module.exports = new ChatInputCommand({
  global: true,
  permLevel: 'Administrator',
  data: {
    description: 'Change the amount of seconds to wait before leaving channel when playback finishes',
    options: [
      {
        name: 'seconds',
        description: 'The amount of seconds to wait',
        type: ApplicationCommandOptionType.Integer,
        min_value: 1,
        max_value: Number.MAX_SAFE_INTEGER,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;
    const seconds = interaction.options.getInteger('seconds');
    const guilds = db.getCollection('guilds');

    // Check conditions/state
    if (!requireSessionConditions(interaction, false)) return;

    // Resolve settings
    const settings = getGuildSettings(guild.id);
    if (!seconds) {
      interaction.reply(`${ emojis.success } ${ member }, the amount of seconds to wait before leaving channel when playback finishes is currently set to **\`${ settings.leaveOnEndCooldown ?? clientConfig.defaultLeaveOnEndCooldown }\`**`);
      return;
    }

    try {
      // Perform and notify collection that the document has changed
      settings.leaveOnEndCooldown = seconds;
      guilds.update(settings);
      saveDb();

      // Feedback
      await interaction.reply({ content: `${ emojis.success } ${ member }, leave-on-end cooldown set to \`${ msToHumanReadableTime(seconds * MS_IN_ONE_SECOND) }\`\nThis change will take effect the next time playback is initialized` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
