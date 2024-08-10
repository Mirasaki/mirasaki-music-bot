const { BiquadFilterType, useQueue } = require('discord-player');
const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Configure the biquad filter',
    options: [
      {
        name: 'filter',
        description: 'The biquad filter to use',
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: 'Disable',
            value: 'null'
          },
          ...Object.keys(BiquadFilterType)
            .map((e) => ({
              name: e,
              value: e
            }))
        ],
        required: true
      },
      {
        name: 'gain',
        description: 'The gain level to apply',
        type: ApplicationCommandOptionType.Integer,
        min_value: -100,
        max_value: 100,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      member, guild, options
    } = interaction;
    const filter = options.getString('filter');
    const gain = options.getInteger('gain');

    // Check conditions
    if (!requireSessionConditions(interaction, true)) return;

    // Check is playing
    const queue = useQueue(guild.id);
    if (!queue.isPlaying()) {
      interaction.reply(`${ emojis.error } ${ member }, please initialize playback/start a music session first - this command has been cancelled`);
      return;
    }

    // Check can be applied
    if (!queue.filters.biquad) {
      interaction.reply(`${ emojis.error } ${ member }, the biquad filter can't be applied to this queue - this command has been cancelled`);
      return;
    }

    try {
      if (filter === 'null' && queue.filters.biquad) queue.filters.biquad.disable();
      else if (queue.filters.biquad) {
        queue.filters.biquad.setFilter(BiquadFilterType[filter]);
        if (typeof gain === 'number') queue.filters.biquad.setGain(gain);
        queue.filters.biquad.enable();
      }

      // Feedback
      await interaction.reply({ content: `${ emojis.success } ${ member }, new biquad filter configuration applied (**\`${ filter === 'null' ? 'Disabled' : filter }\`**)\nBiquad filters apply on a per-session basis - this is intended behavior, the next time playback is initialized, the biquad filter wil always be disabled` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
