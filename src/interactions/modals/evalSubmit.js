const { stripIndents } = require('common-tags/lib');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { ComponentCommand } = require('../../classes/Commands');
const {
  EVAL_CODE_INPUT, ACCEPT_EVAL_CODE_EXECUTION, DECLINE_EVAL_CODE_EXECUTION, EVAL_CODE_MODAL
} = require('../../constants');
const { colorResolver } = require('../../util');

module.exports = new ComponentCommand({
  // Overwriting the default file name with our owm custom component id
  data: { name: EVAL_CODE_MODAL },
  run: async (client, interaction) => {
    const { member } = interaction;
    const { emojis } = client.container;

    // Defer our reply
    await interaction.deferReply();

    // Code Input
    const codeInput = interaction.fields.getTextInputValue(EVAL_CODE_INPUT);

    // Verification prompt
    await interaction.editReply({
      content: `${ emojis.wait } ${ member }, are you sure you want to evaluate the following code:`,
      embeds: [
        {
          color: colorResolver(),
          description: stripIndents`
            \`\`\`js
            ${ codeInput }
            \`\`\`
          `
        }
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(ACCEPT_EVAL_CODE_EXECUTION)
            .setLabel('Accept')
            .setStyle('Success'),
          new ButtonBuilder()
            .setCustomId(DECLINE_EVAL_CODE_EXECUTION)
            .setLabel('Decline')
            .setStyle('Danger')
        )
      ]
    });
  }
});
