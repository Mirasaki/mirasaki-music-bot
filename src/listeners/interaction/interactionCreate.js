const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const { InteractionType } = require('discord.js');
const { checkCommandCanExecute,
  throttleCommand } = require('../../handlers/commands');
const { getPermissionLevel } = require('../../handlers/permissions');
const {
  titleCase, getRuntime, clientConfig
} = require('../../util');

// Destructure from origin file because it's
// used in multiple functions
const { emojis } = require('../../client');

const { DEBUG_ENABLED,
  DEBUG_INTERACTIONS } = process.env;

const checkInteractionAvailability = (interaction) => {
  const { member, guild } = interaction;

  // Check for DM interactions
  // Planning on adding support later down the road
  if (!interaction.inGuild()) {
    if (interaction.isRepliable()) {
      interaction.reply({
        content: `${ emojis.error } ${ member }, I don't currently support DM interactions. Please try again in a server.`,
        ephemeral: true
      });
    }
    return false;
  }

  // Check for outages
  if (guild?.available !== true) {
    const { guild } = interaction;

    logger.debug(`Interaction returned, server unavailable.\nServer: ${ guild.name } (${ guild.id })`);
    return false;
  }

  // Check for missing 'bot' scope
  if (!interaction.guild) {
    logger.debug('Interaction returned, missing \'bot\' scope / missing guild object in interaction.');
    return false;
  }

  // Return true if all checks pass
  return true;
};

// Resolves the active command
const getCommand = (client, activeId) => {
  const {
    commands, contextMenus, buttons, modals, selectMenus
  } = client.container;

  return commands.get(activeId)
    || contextMenus.get(activeId)
    || buttons.get(activeId)
    || modals.get(activeId)
    || selectMenus.get(activeId);
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const runCommand = (client, interaction, activeId, cmdRunTimeStart) => {
  const {
    member, guild, channel
  } = interaction;
  let clientCmd = getCommand(client, activeId);

  // Early escape hatch for in-command components
  if (activeId.startsWith('@')) {
    const secondAtSignIndex = activeId.indexOf('@', 1);
    const sliceEndIndex = secondAtSignIndex >= 0 ? secondAtSignIndex : activeId.length;
    const dynamicCmd = clientCmd = getCommand(client, activeId.slice(1, sliceEndIndex));
    if (!dynamicCmd) return; // Should be ignored
  }

  // Check if we can reply to this interaction
  const clientCanReply = interaction.isRepliable();

  // Check for late API changes
  if (!clientCmd) {
    if (clientCanReply) interaction.reply({
      content: `${ emojis.error } ${ member }, this command currently isn't available.`,
      ephemeral: true
    });
    logger.syserr(`Missing interaction listener for "${ activeId }" (name for commands, customId for components - ignored if starts with "@")`);
    return;
  }

  // Grab our data object from the client command
  const { data } = clientCmd;

  // Return if we can't reply to the interaction
  if (!clientCanReply) {
    logger.debug(`Interaction returned - Can't reply to interaction\nCommand: ${ data.name }\nServer: ${ guild.name }\nChannel: #${ channel.name }\nMember: ${ member }`);
    return;
  }

  // Perform our additional checks
  // Like permissions, NSFW, status, availability
  if (checkCommandCanExecute(client, interaction, clientCmd) === false) {
    // If individual checks fail
    // the function returns false and provides user feedback
    return;
  }

  // Throttle the command
  // permLevel 4 = Developer
  if (member.permLevel < 4) {
    const onCooldown = throttleCommand(clientCmd, interaction);

    if (onCooldown !== false) {
      interaction.reply({
        content: onCooldown.replace('{{user}}', `${ member }`),
        ephemeral: true
      });
      return;
    }
  }

  /*
   All checks have passed
   Run the command
   While catching possible errors
  */
  (async () => {
    try {
      await clientCmd.run(client, interaction);
    }
    catch (err) {
      logger.syserr(`An error has occurred while executing the /${ chalk.whiteBright(activeId) } command`);
      console.error(err);
    }

    // Log command execution time
    if (DEBUG_ENABLED === 'true') {
      logger.debug(`${ chalk.white(activeId) } executed in ${ getRuntime(cmdRunTimeStart).ms } ms`);
    }
  })();

  // Logging the Command to our console
  const aliasTag = clientCmd.isAlias ? `(Alias for: ${ clientCmd.aliasFor })` : '';

  console.log([
    `${ logger.timestamp() } ${ chalk.white('[CMD]') }    : ${ chalk.bold(titleCase(activeId)) } ${ aliasTag } (${ InteractionType[interaction.type] })`,
    guild.name,
    `#${ channel.name }`,
    member.user.username
  ].join(chalk.magentaBright(` ${ emojis.separator } `)));
};

module.exports = (client, interaction) => {
  // Definitions
  const {
    member, channel, commandName, customId
  } = interaction;

  // Initial performance measuring timer
  const cmdRunTimeStart = process.hrtime.bigint();

  // Conditional Debug logging
  if (DEBUG_INTERACTIONS === 'true') {
    logger.startLog('New Interaction');
    console.dir(interaction, {
      showHidden: false, depth: 0, colors: true
    });
    logger.endLog('New Interaction');
  }

  // Check interaction/command availability
  // API availability, guild object, etc
  // Replies to the interaction in function
  if (checkInteractionAvailability(interaction) === false) return;

  // Setting the permLevel on the member object before we do anything else
  const permLevel = getPermissionLevel(clientConfig, member, channel);

  interaction.member.permLevel = permLevel;

  // Handle ping interactions in separate file
  if (interaction.type === InteractionType.Ping) {
    client.emit('pingInteraction', (interaction));
    return;
  }

  // Search the client.container.collections for the command
  const activeId = commandName || customId;
  const isAutoComplete = interaction.type === InteractionType.ApplicationCommandAutocomplete;

  // Execute early if autocomplete,
  // avoiding the permission checks
  // (as this is managed through default_member_permissions)
  if (isAutoComplete) {
    client.emit('autoCompleteInteraction', (interaction));
    return;
  }

  // Run the command
  // Has additional checks inside
  runCommand(client, interaction, activeId, cmdRunTimeStart);
};
