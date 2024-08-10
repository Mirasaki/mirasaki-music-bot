const { EqualizerConfigurationPreset, useQueue } = require('discord-player');
const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const {
  db, getGuildSettings, saveDb
} = require('../../modules/db');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Configure the equalizer preset',
    options: [
      {
        name: 'equalizer',
        description: 'The equalizer preset to use',
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: 'Disable',
            value: 'null'
          },
          ...Object.keys(EqualizerConfigurationPreset)
            .map((e) => ({
              name: e,
              value: e
            }))
        ],
        required: true
      },
      {
        name: 'persistent',
        description: 'Persist the selected equalizer preset. Applies selected preset to new playback sessions',
        type: ApplicationCommandOptionType.Boolean,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      member, guild, options
    } = interaction;
    const equalizer = options.getString('equalizer') ?? 'null';
    const shouldSave = options.getBoolean('persistent') ?? false;

    // Check conditions
    if (!requireSessionConditions(interaction, true)) return;

    // Check is playing
    const queue = useQueue(guild.id);
    if (!queue.isPlaying()) {
      interaction.reply(`${ emojis.error } ${ member }, please initialize playback/start a music session first - this command has been cancelled`);
      return;
    }

    // Check can be applied
    if (!queue.filters.equalizer) {
      interaction.reply(`${ emojis.error } ${ member }, equalizers can't be applied to this queue - this command has been cancelled`);
      return;
    }

    try {
      if (equalizer === 'null' && queue.filters.equalizer) queue.filters.equalizer.disable();
      else if (queue.filters.equalizer) {
        queue.filters.equalizer.setEQ(EqualizerConfigurationPreset[equalizer]);
        queue.filters.equalizer.enable();
      }

      // Save for persistency
      if (shouldSave) {
        // Perform and notify collection that the document has changed
        const guilds = db.getCollection('guilds');
        const settings = getGuildSettings(guild.id);
        settings.equalizer = equalizer;
        guilds.update(settings);
        saveDb();
      }

      // Feedback
      await interaction.reply({ content: `${ emojis.success } ${ member }, new equalizer preset applied (**\`${ equalizer === 'null' ? 'Disabled' : equalizer }\`**)\n${ shouldSave
        ? 'Equalizer preset configuration will be persisted, meaning the preset is automatically applied when a new playback session is initialized'
        : 'Equalizer preset configuration will not be persisted, meaning the next time a playback session is initialized, your previous **persistent** equalizer settings will be used' }` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
