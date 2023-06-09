const { ComponentCommand } = require('../../../classes/Commands');
const { DECLINE_EVAL_CODE_EXECUTION } = require('../../../constants');

module.exports = new ComponentCommand({
  // Overwriting the default file name with our owm custom component id
  data: { name: DECLINE_EVAL_CODE_EXECUTION },

  run: async (client, interaction) => {
    const { member, message } = interaction;
    const { emojis } = client.container;

    // Reply to button interaction
    interaction.reply({ content: `${ emojis.error } ${ member }, cancelling code execution.` });

    // Update the original message
    await message.edit({
      content: `${ emojis.error } ${ member }, this code block has been discarded, unevaluated.`,
      components: []
    });
  }
});
