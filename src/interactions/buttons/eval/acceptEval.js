const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { colorResolver, getRuntime } = require('../../../util');
const util = require('util');
const {
  EMBED_FIELD_VALUE_MAX_LENGTH, ACCEPT_EVAL_CODE_EXECUTION, ZERO_WIDTH_SPACE_CHAR_CODE
} = require('../../../constants');
const logger = require('@mirasaki/logger');
const { ComponentCommand } = require('../../../classes/Commands');

const clean = (text) => {
  if (typeof (text) === 'string') {
    return text.replace(/`/g, '`'
      + String.fromCharCode(ZERO_WIDTH_SPACE_CHAR_CODE)).replace(/@/g, '@'
      + String.fromCharCode(ZERO_WIDTH_SPACE_CHAR_CODE))
      .replace(new RegExp(process.env.DISCORD_BOT_TOKEN), '<token>');
  }
  else return text;
};

module.exports = new ComponentCommand({
  // Additional layer of protection
  permLevel: 'Developer',
  // Discord API data
  // Overwriting the default file name with our owm custom component id
  data: { name: ACCEPT_EVAL_CODE_EXECUTION },

  run: async (client, interaction) => {
    // Destructure from interaction and client
    const { member, message } = interaction;
    const { emojis, colors } = client.container;

    // Editing original command interaction
    const originalEmbed = message.embeds[0].data;

    await message.edit({
      content: `${ emojis.success } ${ member }, this code is now executing...`,
      embeds: [
        {
        // Keep the original embed but change color
          ...originalEmbed,
          color: colorResolver(colors.error)
        }
      ],
      // Remove decline button and disable accept button
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(ACCEPT_EVAL_CODE_EXECUTION)
            .setDisabled(true)
            .setLabel('Executing...')
            .setStyle('Success')
        )
      ]
    });

    // Slicing our code input
    const CODEBLOCK_CHAR_OFFSET_START = 6;
    const CODEBLOCK_CHAR_OFFSET_END = 4;
    const codeInput = originalEmbed.description.slice(CODEBLOCK_CHAR_OFFSET_START, -CODEBLOCK_CHAR_OFFSET_END);

    // Defer our reply
    await interaction.deferReply();

    // Performance measuring
    let evaluated;
    const startEvalTime = process.hrtime.bigint();

    try {
      // eslint-disable-next-line no-eval
      evaluated = eval(codeInput);
      if (evaluated instanceof Promise) evaluated = await evaluated;

      // Get execution time
      const timeSinceHr = getRuntime(startEvalTime);
      const timeSinceStr = `${ timeSinceHr.seconds } seconds (${ timeSinceHr.ms } ms)`;

      // String response
      const codeOutput = clean(util.inspect(evaluated, { depth: 0 }));
      const response = [ `\`\`\`js\n${ codeOutput }\`\`\``, `\`\`\`fix\n${ timeSinceStr }\`\`\`` ];

      // Building the embed
      const evalEmbed = {
        color: colorResolver(),
        description: `:inbox_tray: **Input:**\n\`\`\`js\n${ codeInput }\n\`\`\``,
        fields: [
          {
            name: ':outbox_tray: Output:',
            value: `${ response[0] }`,
            inline: false
          },
          {
            name: 'Time taken',
            value: `${ response[1] }`,
            inline: false
          }
        ]
      };

      // Result fits within character limit
      if (response[0].length <= EMBED_FIELD_VALUE_MAX_LENGTH) {
        await message.edit({
          content: `${ emojis.success } ${ member }, this code has been evaluated.`,
          embeds: [ evalEmbed ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('accept_eval_code')
                .setDisabled(true)
                .setLabel('Evaluated')
                .setStyle('Success')
            )
          ]
        });
      }

      // Output is too many characters
      else {
        const output = Buffer.from(codeOutput);

        await message.edit({
          content: `${ emojis.success } ${ member }, this code has been evaluated.`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('accept_eval_code')
                .setDisabled(true)
                .setLabel('Evaluated')
                .setStyle('Success')
            )
          ],
          files: [
            {
              attachment: output,
              name: 'evalOutput.txt'
            }
          ]
        });
      }

      // Reply to button interaction
      interaction.editReply({ content: `${ emojis.success } ${ member }, finished code execution.` });
    }
    catch (err) {
      const timeSinceHr = getRuntime(startEvalTime);

      // Log potential errors
      logger.syserr('Encountered error while executing /eval code');
      console.error(err);

      // Update button interaction
      interaction.editReply({ content: `${ emojis.error } ${ member }, code execution error, check original embed for output.` });

      // Format time stamps
      const timeSinceStr = `${ timeSinceHr.seconds } seconds (${ timeSinceHr.ms } ms)`;

      // Update original embed interaction
      message.edit({ embeds: [
        {
          color: colorResolver(),
          description: `:inbox_tray: **Input:**\n\`\`\`js\n${ codeInput }\n\`\`\``,
          fields: [
            {
              name: ':outbox_tray: Output:',
              value: `\`\`\`js\n${ err.stack || err }\n\`\`\``,
              inline: false
            },
            {
              name: 'Time taken',
              value: `\`\`\`fix\n${ timeSinceStr }\n\`\`\``,
              inline: false
            }
          ]
        }
      ] });
    }
  }
});
