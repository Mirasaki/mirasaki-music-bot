const { exec } = require('child_process');
const { EMBED_FIELD_VALUE_MAX_LENGTH } = require('../../constants');
const { ChatInputCommand } = require('../../classes/Commands');
const { colorResolver, getRuntime } = require('../../util');

module.exports = new ChatInputCommand({
  enabled: process.env.NODE_ENV !== 'production',
  permLevel: 'Developer',
  clientPerms: [ 'EmbedLinks', 'AttachFiles' ],
  data: {
    description: 'Execute console commands',
    options: [
      {
        // STRING
        type: 3,
        name: 'command',
        description: 'The command to execute',
        required: true,
        min_length: 1,
        // API max
        max_length: 6000
      }
    ]
  },

  run: async (client, interaction) => {
    // Destructuring
    const { member, options } = interaction;
    const { emojis, colors } = client.container;

    // Definitions
    const commandToExec = options.getString('command');
    const execStartTime = process.hrtime.bigint();

    // Deferring our reply (3 seconds threshold)
    await interaction.deferReply();

    // Execute the user provided command
    exec(commandToExec, (err, stdout) => {
      // Get runtime
      const timeSinceHr = getRuntime(execStartTime);
      const timeSinceStr = `${ timeSinceHr.seconds } seconds (${ timeSinceHr.ms } ms)`;

      // Building our embed object
      let outputStr = undefined;
      const files = [];
      const execEmbed = {
        description: `:inbox_tray: **Input:**\n\`\`\`bash\n${ commandToExec }\n\`\`\``,
        fields: [
          {
            name: 'Time taken',
            value: `\`\`\`fix\n${ timeSinceStr }\`\`\``,
            inline: false
          }
        ]
      };

      // Properly handle potential errors
      if (err) {
        outputStr = `${ emojis.error } ${ member }, error encountered while executing console command.`;
        execEmbed.color = colorResolver(colors.error);

        // Add output embed field to the start of the Array
        const activeOutput = err.stack || err;

        execEmbed.fields.unshift({
          name: ':outbox_tray: Output:',
          value: `\`\`\`js\n${
            activeOutput.length <= EMBED_FIELD_VALUE_MAX_LENGTH
              ? activeOutput
              : `Error trace over ${ EMBED_FIELD_VALUE_MAX_LENGTH } characters, uploaded as attachment instead`
          }\`\`\``,
          inline: false
        });

        // Upload as file attachment if output exceeds max length
        if (activeOutput.length > EMBED_FIELD_VALUE_MAX_LENGTH) {
          files.push({
            attachment: Buffer.from(activeOutput),
            name: 'error-trace.txt'
          });
        }
      }

      // No error encountered
      else {
        outputStr = `${ emojis.success } ${ member }, console command executed.`;
        execEmbed.color = colorResolver(colors.success);

        // Add output embed field to the start of the Array
        execEmbed.fields.unshift({
          name: ':outbox_tray: Output:',
          value: `\`\`\`js\n${
            stdout.length <= EMBED_FIELD_VALUE_MAX_LENGTH
              ? stdout
              : `Output over ${ EMBED_FIELD_VALUE_MAX_LENGTH } characters, uploaded as attachment instead`
          }\`\`\``,
          inline: false
        });

        // Upload as file attachment if output exceeds max length
        if (stdout.length > EMBED_FIELD_VALUE_MAX_LENGTH) {
          files.push({
            attachment: Buffer.from(stdout),
            name: 'stdout.txt'
          });
        }
      }

      // Final user feedback
      interaction.editReply({
        content: outputStr,
        embeds: [ execEmbed ],
        files
      });
    });
  }
});
