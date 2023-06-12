const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions, queueEmbedResponse } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  data: { description: 'Shuffle the current queue' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const queue = useQueue(interaction.guild.id);
      queue.tracks.shuffle();

      // Show queue, interactive
      queueEmbedResponse(interaction, queue);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
