const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { ApplicationCommandOptionType } = require('discord.js');

const SONG_POSITION_OPTION_ID = 'song-position';

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Remove a song that is current in /queue',
    options: [
      {
        name: SONG_POSITION_OPTION_ID,
        description: 'The position of the source song',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
        max_value: 999_999
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      member, guild, options
    } = interaction;
    const songPosition = Number(options.getInteger(SONG_POSITION_OPTION_ID)) - 1;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const queue = useQueue(guild.id);

      // Not enough songs in queue
      if ((queue?.size ?? 0) < 2) {
        interaction.reply(`${ emojis.error } ${ member }, not enough songs in queue to perform any move action - this command has been cancelled`);
        return;
      }

      // Check bounds/constraints
      const queueSizeZeroOffset = queue.size - 1;
      if (songPosition > queueSizeZeroOffset) {
        interaction.reply(`${ emojis.error } ${ member }, the \`${
          SONG_POSITION_OPTION_ID + '` parameter is'
        } not within valid range of 1-${ queue.size } - this command has been cancelled`);
        return;
      }

      // Remove song - assign track before #removeTrack
      const track = queue.tracks.data.at(songPosition);
      queue.removeTrack(songPosition);
      interaction.reply(`${ emojis.success } ${ member }, **\`${ track.title }\`** has been removed from the queue`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
