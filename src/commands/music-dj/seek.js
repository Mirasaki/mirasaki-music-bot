const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { ApplicationCommandOptionType } = require('discord.js');
const { MS_IN_ONE_SECOND } = require('../../constants');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Jump to a specific time in the current song',
    options: [
      {
        name: 'minutes',
        description: 'The minute to jump to',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 0,
        max_value: 999_999
      },
      {
        name: 'seconds',
        description: 'The seconds to jump to',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 0,
        max_value: 59
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      guild, member, options
    } = interaction;
    const minutes = Number(options.getInteger('minutes') ?? 0);
    const seconds = Number(options.getInteger('seconds') ?? 0);
    const totalMs = (minutes * 60 + seconds) * MS_IN_ONE_SECOND;

    // Check is default params
    if (totalMs === 0) {
      interaction.reply(`${ emojis.error } ${ member }, default command options provided, if you want to replay a track, use \`/replay\` - this command has been cancelled`);
      return;
    }


    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    // Not a point in duration
    if (totalMs > useQueue(guild.id).currentTrack?.durationMS) {
      interaction.reply(`${ emojis.error } ${ member }, not a valid timestamp for song - this action has been cancelled`);
      return;
    }

    try {
      const queue = useQueue(guild.id);
      queue.node.seek(totalMs);
      await interaction.reply(`🔍 ${ member }, setting playback timestamp to ${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
