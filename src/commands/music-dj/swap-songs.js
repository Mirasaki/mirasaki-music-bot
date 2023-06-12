const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { ApplicationCommandOptionType } = require('discord.js');

const FIRST_POSITION_OPTION_ID = 'first-position';
const SECOND_POSITION_OPTION_ID = 'second-position';

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Swap songs that are current in /queue around by position',
    options: [
      {
        name: FIRST_POSITION_OPTION_ID,
        description: 'The position of the first track to swap / source song',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
        max_value: 999_999
      },
      {
        name: SECOND_POSITION_OPTION_ID,
        description: 'The position of the second track to swap / destination song',
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
    const firstPosition = Number(options.getInteger(FIRST_POSITION_OPTION_ID)) - 1;
    const secondPosition = Number(options.getInteger(SECOND_POSITION_OPTION_ID)) - 1;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const queue = useQueue(guild.id);

      // Not enough songs in queue
      if ((queue?.size ?? 0) < 2) {
        interaction.reply(`${ emojis.error } ${ member }, not enough songs in queue to perform any swap action - this command has been cancelled`);
        return;
      }

      // Check bounds/constraints
      const queueSizeZeroOffset = queue.size - 1;
      if (
        firstPosition > queueSizeZeroOffset
        || secondPosition > queueSizeZeroOffset
      ) {
        interaction.reply(`${ emojis.error } ${ member }, the \`${
          firstPosition > queueSizeZeroOffset
            ? secondPosition > queueSizeZeroOffset
              ? `${ FIRST_POSITION_OPTION_ID } and ${ SECOND_POSITION_OPTION_ID }\` parameters are both`
              : FIRST_POSITION_OPTION_ID + '` parameter is'
            : SECOND_POSITION_OPTION_ID + '` parameter is'
        } not within valid range of 1-${ queue.size } - this command has been cancelled`);
        return;
      }

      // Is same
      if (firstPosition === secondPosition) {
        interaction.reply(`${ emojis.error } ${ member }, \`${ FIRST_POSITION_OPTION_ID }\` and \`${ SECOND_POSITION_OPTION_ID }\` are identical - this command has been cancelled`);
        return;
      }

      // Swap src and dest
      queue.swapTracks(firstPosition, secondPosition);
      // Reversed, they've been switched
      const firstTrack = queue.tracks.data.at(secondPosition);
      const secondTrack = queue.tracks.data.at(firstPosition);
      interaction.reply(`${ emojis.success } ${ member }, **\`${ firstTrack.title }\`** has been swapped with **\`${ secondTrack.title }\`**`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
