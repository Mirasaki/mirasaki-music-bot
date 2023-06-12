const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { ApplicationCommandOptionType } = require('discord.js');

const FROM_OPTION_ID = 'from-position';
const TO_OPTION_ID = 'to-position';

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Move a song that is current in /queue',
    options: [
      {
        name: FROM_OPTION_ID,
        description: 'The position of the source song',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
        max_value: 999_999
      },
      {
        name: TO_OPTION_ID,
        description: 'The destination position',
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
    const fromPosition = Number(options.getInteger(FROM_OPTION_ID)) - 1;
    const toPosition = Number(options.getInteger(TO_OPTION_ID)) - 1;

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
      if (
        fromPosition > queueSizeZeroOffset
        || toPosition > queueSizeZeroOffset
      ) {
        interaction.reply(`${ emojis.error } ${ member }, the \`${
          fromPosition > queueSizeZeroOffset
            ? toPosition > queueSizeZeroOffset
              ? `${ FROM_OPTION_ID } and ${ TO_OPTION_ID }\` parameters are both`
              : FROM_OPTION_ID + '` parameter is'
            : TO_OPTION_ID + '` parameter is'
        } not within valid range of 1-${ queue.size } - this command has been cancelled`);
        return;
      }

      // Is same
      if (fromPosition === toPosition) {
        interaction.reply(`${ emojis.error } ${ member }, \`${ FROM_OPTION_ID }\` and \`${ TO_OPTION_ID }\` are identical - this command has been cancelled`);
        return;
      }

      // Swap src and dest
      queue.moveTrack(fromPosition, toPosition);
      // use toPosition, because it's after #swap
      const firstTrack = queue.tracks.data.at(toPosition);
      interaction.reply(`${ emojis.success } ${ member }, **\`${ firstTrack.title }\`** has been moved to position **\`${ toPosition + 1 }\`**`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
