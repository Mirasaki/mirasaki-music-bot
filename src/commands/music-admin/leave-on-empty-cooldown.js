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
    description: 'Change the amount of seconds to wait before leaving when channel is empty',
    options: [
      {
        name: 'seconds',
        description: 'The amount of seconds to wait',
        type: ApplicationCommandOptionType.Integer,
        min_value: 1,
        max_value: Number.MAX_SAFE_INTEGER,
        required: false
      },
      {
        name: 'status',
        description: 'Enable/disable leave-on-empty, uses a lot more bandwidth when disabled',
        type: ApplicationCommandOptionType.Boolean,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;
    const seconds = interaction.options.getInteger('seconds');
    const status = interaction.options.getBoolean('status') ?? true;
    const guilds = db.getCollection('guilds');

    // Check conditions/state
    if (!requireSessionConditions(interaction, false)) return;

    // Resolve settings
    const settings = getGuildSettings(guild.id);
    if (!seconds) {
      interaction.reply(`${ emojis.success } ${ member }, the amount of seconds to wait before leaving when channel is empty is currently set to **\`${ settings.leaveOnEmptyCooldown ?? clientConfig.defaultLeaveOnEmptyCooldown }\`**`);
      return;
    }

    try {
      // Perform and notify collection that the document has changed
      settings.leaveOnEmpty = status;
      settings.leaveOnEmptyCooldown = seconds;
      guilds.update(settings);
      saveDb();

      // Feedback
      if (status !== true) interaction.reply({ content: `${ emojis.success } ${ member }, leave-on-empty has been disabled` });
      else interaction.reply({ content: `${ emojis.success } ${ member }, leave-on-empty cooldown set to \`${ msToHumanReadableTime(seconds * MS_IN_ONE_SECOND) }\`\nThis change will take effect the next time playback is initialized` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
