const logger = require('@mirasaki/logger');
const { generateCommandInfoEmbed, generateCommandOverviewEmbed } = require('../../handlers/commands');
const { HELP_COMMAND_SELECT_MENU, HELP_SELECT_MENU_SEE_MORE_OPTIONS } = require('../../constants');
const { ComponentCommand } = require('../../classes/Commands');

module.exports = new ComponentCommand({
  data: { name: HELP_COMMAND_SELECT_MENU },

  run: async (client, interaction) => {
    const {
      commands, contextMenus, emojis
    } = client.container;
    const selectTargetValue = interaction.values[0];
    const { member } = interaction;

    // Check max entries notifier - show default page
    if (selectTargetValue === HELP_SELECT_MENU_SEE_MORE_OPTIONS) {
      // Reply to the interaction with our embed
      interaction.update({ embeds: [ generateCommandOverviewEmbed(commands, interaction) ] });
      return;
    }

    // Check valid command
    const clientCmd = commands.get(selectTargetValue)
      || contextMenus.get(selectTargetValue)
      || undefined;

    if (!clientCmd) {
      interaction.update({
        content: `${ emojis.error } ${ member }, I couldn't find the command **\`/${ selectTargetValue }\`**`,
        ephemeral: true
      });
      logger.syserr(`Unknown Select Menu Target Value received for Help Command Select Menu: "${ selectTargetValue }"`);
      return;
    }

    // Update the interaction with the requested command data
    const embedData = generateCommandInfoEmbed(clientCmd, interaction);

    interaction.update({ embeds: [ embedData ] });
  }
});
