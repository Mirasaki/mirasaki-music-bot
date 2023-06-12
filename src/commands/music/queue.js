const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { queueEmbedResponse, requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  data: { description: 'Display the current queue' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;

    // Check conditions/state
    if (!requireSessionConditions(interaction, true, false, false)) return;

    // Check has queue
    const queue = useQueue(guild.id);
    if (!queue) {
      interaction.reply({ content: `${ emojis.error } ${ member }, queue is currently empty. You should totally \`/play\` something - but that's just my opinion.` });
      return;
    }

    // Show queue, interactive
    queueEmbedResponse(interaction, queue);
  }
});
