/**
 * Our command handler, holds utility functions and everything to do with
 * handling commands in this template. Exported from `/src/handlers/commands.js`.
 * See {@tutorial adding-commands} for an overview.
 * @module Handler/Commands
 */

/**
 * Discord API command data
 * @external DiscordAPIApplicationCommand
 * @see {@link https://discord-api-types.dev/api/discord-api-types-v10/interface/APIApplicationCommand}
 */

/**
 * The command interaction received
 * @external DiscordCommandInteraction
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/CommandInteraction}
 */

/**
 * The `discord.js` ActionRowBuilder
 * @external DiscordActionRowBuilder
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ActionRowBuilder}
 */

/**
 * The `discord.js` EmbedBuilder
 * @external DiscordEmbedBuilder
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder}
 */

// Require dependencies
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Local imports
const {
  titleCase, splitCamelCaseStr, colorResolver
} = require('../util');
const emojis = require('../config/emojis.json');

// Packages
const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const { hasChannelPerms, resolvePermissionArray } = require('./permissions');
const {
  commands, contextMenus, colors
} = require('../client');
const {
  SELECT_MENU_MAX_OPTIONS,
  HELP_SELECT_MENU_SEE_MORE_OPTIONS,
  HELP_COMMAND_SELECT_MENU,
  MS_IN_ONE_SECOND
} = require('../constants');
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require('discord.js');
const {
  UserContextCommand,
  MessageContextCommand,
  ChatInputCommand
} = require('../classes/Commands');

// Destructure from process.env
const {
  DISCORD_BOT_TOKEN,
  CLIENT_ID,
  TEST_SERVER_GUILD_ID,
  REFRESH_SLASH_COMMAND_API_DATA,
  DEBUG_SLASH_COMMAND_API_DATA,
  DEBUG_COMMAND_THROTTLING
} = process.env;

// Initializing our REST client
const rest = new REST({ version: '10' })
  .setToken(DISCORD_BOT_TOKEN);

/**
 * Clears all InteractionCommand data from the Discord API, both global
 * and server-specific commands.
 * @throws {process.exit(1)} Shuts down the client/process after clearing API command data
 * @returns {void}
 */
const clearApplicationCommandData = () => {
  logger.info('Clearing ApplicationCommand API data');
  rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
  rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, TEST_SERVER_GUILD_ID),
    { body: [] }
  )
    .catch((err) => {
      // Catching Missing Access error
      logger.syserr('Error encountered while trying to clear GuildCommands in the test server, this probably means your TEST_SERVER_GUILD_ID in the .env file is invalid or the client isn\'t currently in that server');
      logger.syserr(err);
    });
  logger.success('Successfully reset all Slash Commands. It may take up to an hour for global changes to take effect.');
  logger.syslog(chalk.redBright('Shutting down...'));
  process.exit(1);
};

/**
 * Sorts a collection of commands by command category
 * @param {external:DiscordCollection<string, ChatInputCommand | UserContextCommand | MessageContextCommand>} commands The collections of commands to sort
 * @returns {Array<Command>}
 */
const sortCommandsByCategory = (commands) => {
  let currentCategory = '';
  const sorted = [];

  commands.forEach((cmd) => {
    const workingCategory = titleCase(cmd.category);

    if (currentCategory !== workingCategory) {
      sorted.push({
        category: workingCategory,
        commands: [ cmd ]
      });
      currentCategory = workingCategory;
    }
    else sorted
      .find((e) => e.category === currentCategory).commands
      .unshift(cmd);
  });
  return sorted;
};

/**
 * Return a the commands data object and removes the description field for Context Menu commands
 * @param {ChatInputCommand | MessageContextCommand | UserContextCommand} cmd The command to client API data for
 * @returns {external:DiscordAPIApplicationCommand}
 */
const cleanAPIData = (cmd) => {
  // Remove the description field as it's not allowed in the api call
  if (
    cmd instanceof UserContextCommand
    || cmd instanceof MessageContextCommand
  ) return {
    ...cmd.data,
    description: null
  };

  // Slice the description if it's too long
  // 100 is max supported by the Discord API
  // Avoid overwriting original string for help embeds
  if (cmd.data.description.length > 100) {
    return {
      ...cmd.data,
      description: `${ cmd.data.description.slice(0, 97) }...`
    };
  }

  return cmd.data;
};

/**
 * Enum for API Command types
 * @readonly
 * @enum {string}
 */
const apiCommandTypeList = {
  1: 'Slash Command',
  2: 'User Context Menu',
  3: 'Message Context Menu'
};

/**
 * (debug) Logs the Discord API InteractionCommand data to the console using `console.table`
 * @param {external:DiscordAPIApplicationCommand} apiData The data returned from the
 * Discord api after making a command request
 * @returns {void} Nothing
 */
const logCommandApiData = (cmdData) => {
  // Filtering out stuff we don't need and formatting
  const cleanedObjArr = cmdData.map((data) => ({
    name: data.name,
    description: data.description || 'n/a',
    options: data.options?.length || 0,
    type: apiCommandTypeList[data.type]
  }));

  console.table(cleanedObjArr);
};

/**
 * Concatenates all our API command data, and refreshes/registers global command data to the Discord API
 * @param {Client} client Our extended discord.js client
 * @returns {Promise<Array<external:DiscordAPIApplicationCommand>>} Discord API command data
 */
const registerGlobalCommands = async (client) => {
  // Logging
  logger.info('Registering Global Application Commands');

  // Defining our variables
  const { commands, contextMenus } = client.container;
  const combinedData = commands.concat(contextMenus);
  const globalCommandData = combinedData
    .filter((cmd) => cmd.global === true
      && cmd.enabled === true)
    .map(cleanAPIData);

  // Extensive debug logging
  if (DEBUG_SLASH_COMMAND_API_DATA === 'true') {
    logger.startLog('Global Command Data');
    logCommandApiData(globalCommandData);
    logger.endLog('Global Command Data');
  }

  // Sending the global command data
  return await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: globalCommandData }
  ).catch((err) => {
    // Invalid Form Body error
    if (err.status === 400) {
      logger.syserr(`Error encountered while trying to register command API data: ${ err.message }`);
      for (const [ index ] in err.rawError.errors) {
        // Logging the invalid data to the console
        console.log(err.requestBody.json[Number(index)]);
      }
    }

    else {
      // Unknown errors
      logger.syserr(err);
    }
  });
};

/**
 * Concatenates all our API command data, and refreshes/registers server command data to the Discord API
 * @param {Client} client Our extended discord.js client
 * @returns {Promise<Array<external:DiscordAPIApplicationCommand>>} Discord API command data
 */
const registerTestServerCommands = async (client) => {
  // Defining our variables
  const { commands, contextMenus } = client.container;
  const combinedData = commands.concat(contextMenus);
  const testServerCommandData = combinedData
    // Filter out global and disabled commands
    .filter((cmd) => (cmd.global === false && cmd.enabled === true))
    .map(cleanAPIData);

  // Return if there's no test command data
  if (testServerCommandData.length === 0) {
    return true;
  }

  // Logging
  logger.info('Registering Test Server Commands');

  // Extensive debug logging
  if (DEBUG_SLASH_COMMAND_API_DATA === 'true') {
    logger.startLog('Test Server Command Data | Only active on the server defined in your .env file');
    logCommandApiData(testServerCommandData);
    logger.endLog('Test Server Command Data');
  }

  // Sending the test server command data
  return await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      TEST_SERVER_GUILD_ID
    ),
    { body: testServerCommandData }
  ).catch((err) => {
    // Invalid TEST_SERVER_GUILD_ID
    if (err.status === 404) {
      logger.syserr('Error encountered while trying to register GuildCommands in the test server, this probably means your TEST_SERVER_GUILD_ID in the .env file is invalid or the client isn\'t currently in that server');
      console.error(err.stack || err);
    }

    // Invalid Form Body error
    else if (err.status === 400) {
      logger.syserr(`Error encountered while trying to register GuildCommands in the test server: ${ err.message }`);
      for (const [ index ] in err.rawError.errors) {
        // Logging the invalid data to the console
        console.log(err.requestBody.json[Number(index)]);
      }
    }

    else {
      // Catching Missing Access error
      console.error(err);
    }
  });
};

/**
 * Refreshes InteractionCommand ({@link ChatInputCommand}, {@link UserContextCommand}, and {@link MessageContextCommand}) API Data
 * @param {Client} client Our extended discord.js client
 * @returns {void} Nothing
 */
const refreshSlashCommandData = (client) => {
  // Environmental skip
  if (REFRESH_SLASH_COMMAND_API_DATA !== 'true') {
    logger.syslog(`Skipping application ${ chalk.white('(/)') } commands refresh.`);
    return;
  }

  try {
    logger.startLog(`Refreshing Application ${ chalk.white('(/)') } Commands.`);

    // Handle our different cmd config setups
    registerGlobalCommands(client);
    registerTestServerCommands(client);
    logger.endLog(`Refreshing Application ${ chalk.white('(/)') } Commands.`);
  }
  catch (error) {
    logger.syserr(`Error while refreshing application ${ chalk.white('(/)') } commands`);
    console.error(error);
  }
};

/**
 * Assigns a unique id depending on cooldown type and data id's
 * @param {CommandBaseCooldown} cooldown The cooldown configuration
 * @param {external:DiscordAPIApplicationCommand} data The Discord API command data
 * @param {external:DiscordCommandInteraction} interaction The interaction received where this cooldown will apply to
 * @returns {string} The unique identifier for the cooldown that will be applied
 */
const getThrottleId = (cooldown, cmdName, interaction) => {
  // Destructure from interaction
  const {
    member, channel, guild
  } = interaction;

  // Building our unique identifier string
  let identifierStr;

  switch (cooldown.type) {
    case 'member': identifierStr = `${ member.id }${ guild.id }`;
      break;
    case 'guild': identifierStr = guild.id;
      break;
    case 'channel': identifierStr = channel.id;
      break;
    case 'global': identifierStr = '';
      break;

    // By default only use member.id
    case 'user':
    default: {
      identifierStr = member.id;
      break;
    }
  }

  // Append the command name to the identifier string
  identifierStr += `-${ cmdName }`;

  // return the uid
  return identifierStr;
};

// Handling command cooldown
const ThrottleMap = new Map();
/**
 * Throttles the invoked command/applies & manages cooldown for the command
 * @param {Command} clientCmd The command to throttle
 * @param {external:DiscordCommandInteraction} interaction The received interaction
 * @returns {boolean} Indicates if the command is actively being throttled.
 * true: It went through and was executed, false: command is actively being throttled / command denied.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const throttleCommand = (clientCmd, interaction) => {
  const { data, cooldown } = clientCmd;
  const debugStr = chalk.red('[Cmd Throttle]');
  const activeCommandName = clientCmd.isAlias ? clientCmd.aliasFor : data.name;

  // Check if a cooldown is configured
  if (cooldown === false) {
    if (DEBUG_COMMAND_THROTTLING === 'true') {
      logger.debug(`${ debugStr } - ${ activeCommandName } No cooldown configured.`);
    }
    return false;
  }

  // Check if cooldown is valid
  const cooldownInMS = parseInt(cooldown.duration * MS_IN_ONE_SECOND, 10);

  if (!cooldownInMS || cooldownInMS < 0) {
    if (DEBUG_COMMAND_THROTTLING === 'true') {
      logger.debug(`${ debugStr } - ${ activeCommandName } No cooldown configured.`);
    }
    return false;
  }

  // Get our command throttle id
  const identifierStr = getThrottleId(cooldown, activeCommandName, interaction);

  // Debug logging
  if (DEBUG_COMMAND_THROTTLING === 'true') {
    logger.debug(`${ debugStr } - ${ chalk.green(identifierStr) } UID Applied to ${ chalk.blue(activeCommandName) } with cooldown type ${ chalk.red(cooldown.type) }`);
  }

  // No data
  if (!ThrottleMap.has(identifierStr)) {
    // Additional debug logging
    if (DEBUG_COMMAND_THROTTLING === 'true') {
      logger.debug(`${ debugStr } - ${ chalk.green(identifierStr) } ThrottleMap data created, pushed this usage. Cooldown expires in ${ cooldown.duration } seconds`);
    }
    ThrottleMap.set(identifierStr, [ Date.now() ]);
    setTimeout(() => {
      if (DEBUG_COMMAND_THROTTLING === 'true') {
        logger.debug(`${ debugStr } - ${ chalk.green(identifierStr) } ThrottleMap data expired, removed this usage.`);
      }
      ThrottleMap.delete(identifierStr);
    }, cooldownInMS);
    return false;
  }

  // Data was found
  else {
    const throttleData = ThrottleMap.get(identifierStr);
    const nonExpired = throttleData
      .filter((timestamp) => Date.now() < (timestamp + cooldownInMS));

    // Return - Currently on cooldown
    if (nonExpired.length >= cooldown.usages) {
      if (DEBUG_COMMAND_THROTTLING === 'true') {
        logger.debug(`${ debugStr } - ${ chalk.green(identifierStr) } Command is actively being throttled, returning.`);
      }
      // Still return the used command name instead of aliasFor if alias
      return `${ emojis.error } {{user}}, you can use **\`/${ data.name }\`** again in ${ Number.parseFloat(((nonExpired[0] + cooldownInMS) - Date.now()) / MS_IN_ONE_SECOND).toFixed(2)
      } seconds`;
    }

    // Not on max-usages yet, increment usages
    else {
      if (DEBUG_COMMAND_THROTTLING === 'true') {
        logger.debug(`${ debugStr } - ${ chalk.green(identifierStr) } Incremented usage`);
      }
      throttleData.push(Date.now());
      return false;
    }
  }
};

/**
 * @param {Command} clientCmd The command to execute
 * @param {external:DiscordCommandInteraction} interaction The discord.js interaction event
 * @returns {boolean} Whether or not the received component interaction is restricted
 * to the user who initiated it or available to everyone
 */
const isUserComponentCommand = (clientCmd, interaction) => (
  interaction.isButton()
  || interaction.isStringSelectMenu()
  || interaction.isMessageComponent()
) && clientCmd.isUserComponent === true;

/**
 * Checks if the member has access to the component command
 * @param {external:DiscordCommandInteraction} interaction The received interaction
 * @returns {boolean} Indicates if the component command is meant for the user that invoked it
 */
const hasAccessToComponentCommand = (interaction) => {
  // Destructure from our received interaction
  const { member, message } = interaction;

  // Check if the component was created outside of interaction context
  // which means the component should be available to everyone
  if (!message.interaction) return true;

  // Return as a boolean
  const originInteractionUserId = message.interaction.user?.id;

  return member.id === originInteractionUserId;
};

/**
 * Checks if the command can execute in it's current state.
 * Checks internal permission level required, additional required Discord permissions,
 * if the command is currently enabled and if the command is NSFW and in a NSFW channel.
 * @param {Client} client Our extended discord.js client
 * @param {external:DiscordCommandInteraction} interaction The received interaction
 * @param {Command} clientCmd The command to check if it can execute
 * @returns {boolean} Indicates if the command can be executed or not.
 */
const checkCommandCanExecute = (client, interaction, clientCmd) => {
  // Required destructuring
  const { member, channel } = interaction;
  const { emojis } = client.container;
  const {
    data, permLevel, enabled, clientPerms, userPerms, nsfw
  } = clientCmd;

  // Get permission levels
  const commandPermLvl = permLevel;

  // Check if the command is currently disabled
  // Needed 'cuz it takes a while for CommandInteractions to sync across server
  if (enabled === false) {
    interaction.reply({
      content: `${ emojis } ${ member }, this command is currently disabled. Please try again later.`,
      ephemeral: true
    });
    return false;
  }

  // Fallback for unexpected results
  if (isNaN(commandPermLvl)) {
    interaction.reply({
      content: `${ emojis.error } ${ member }, something went wrong while using this command.\n${ emojis.info } This issue has been logged to the developer.\n${ emojis.wait } Please try again later`,
      ephemeral: true
    });
    logger.syserr(`Interaction returned: Calculated permission level for command ${ data.name } is NaN.`);
    return false;
  }

  // Check if they have the required permission level
  if (member.permLevel < commandPermLvl) {
    interaction.reply({ content: `${ emojis.error } ${ member }, you do not have the required permission level to use this command.` });
    return false;
  }

  // Check for missing client Discord App permissions
  if (clientPerms.length !== 0) {
    const missingPerms = hasChannelPerms(client.user.id, channel, clientPerms);

    if (missingPerms !== true) {
      interaction.reply({
        content: `${ emojis.error } ${ member }, this command can't be executed because I lack the following permissions in ${ channel }\n${ emojis.separator } ${ resolvePermissionArray(missingPerms).join(', ') }`,
        ephemeral: true
      });
      return false;
    }
  }

  // Check for missing user Discord App permissions
  if (userPerms.length !== 0) {
    const missingPerms = hasChannelPerms(member.user.id, channel, userPerms);

    if (missingPerms !== true) {
      interaction.reply({
        content: `${ emojis.error } ${ member }, this command can't be executed because you lack the following permissions in ${ channel }:\n${ emojis.separator } ${ resolvePermissionArray(missingPerms).join(', ') }`,
        ephemeral: true
      });
      return false;
    }
  }

  // Check for NSFW commands and channels
  if (nsfw === true && channel.nsfw !== true) {
    interaction.reply({
      content: `${ emojis.error } ${ member }, that command is marked as **NSFW**, you can't use it in a **SFW** channel!`,
      ephemeral: true
    });
    return false;
  }

  // Check if the Component Command is meant for the member initiating it
  if (
    isUserComponentCommand(clientCmd, interaction)
    && !hasAccessToComponentCommand(interaction)
  ) {
    interaction.reply({
      content: `${ emojis.error } ${ member }, this message component isn't meant for you.`,
      ephemeral: true
    });
    return false;
  }

  // All checks have passed
  return true;
};

/**
 * Represents a filter that filters out commands that aren't appropriate for the invoker,
 * checks permission level, server-specific commands, and if the command is enabled
 * @param {external:DiscordGuildMember} member The Discord API member object, extended by discord.js
 * @param {APICommand} command Our client-side command configuration
 * @returns {boolean} Indicates whether or not this command is appropriate for the command invoker
 */
const isAppropriateCommandFilter = (member, command) => (
  // Check permission level
  member.permLevel >= command.permLevel
  // Filtering out disabled commands
  && command.enabled === true
  // Filtering out test commands
  && (
    command.global === true
      ? true
      : member.guild.id === TEST_SERVER_GUILD_ID
  )
);

/**
 * Generates a Select Menu data object using command data
 * @param {external:DiscordGuildMember} member The Discord API member
 * @returns {external:DiscordActionRowBuilder} The final select menu data object
 */
const getCommandSelectMenu = (member) => {
  // Filtering out unusable commands
  const workingCmdMap = commands.concat(contextMenus)
    .filter((cmd) => isAppropriateCommandFilter(member, cmd));

  // Getting our structured array of objects
  let cmdOutput = workingCmdMap.map((cmd, identifier) => ({
    label: cmd.data.name,
    description: cmd.data.description.length > 100 ? `${ cmd.data.description.slice(0, 97) }...` : cmd.data.description,
    value: identifier
  }));

  // If too long, slice chunk out and notify member
  if (cmdOutput.length > SELECT_MENU_MAX_OPTIONS) {
    const remainder = cmdOutput.length - (SELECT_MENU_MAX_OPTIONS - 1);

    cmdOutput = cmdOutput.slice(0, (SELECT_MENU_MAX_OPTIONS - 1));
    cmdOutput.push({
      label: `And ${ remainder } more...`,
      description: 'Use the built-in auto complete functionality when typing the command',
      value: HELP_SELECT_MENU_SEE_MORE_OPTIONS
    });
  }

  // Building our row
  return new ActionRowBuilder()
    .addComponents(new StringSelectMenuBuilder()
      .setCustomId(HELP_COMMAND_SELECT_MENU)
      .setPlaceholder('Select a command')
      .addOptions(cmdOutput)
      .setMinValues(1)
      .setMaxValues(1));
};

/**
 * Generates an embed displaying command information
 * @param {Command} clientCmd The command object to build the embed from
 * @param {external:DiscordCommandInteraction} interaction The received interaction
 * @returns {external:DiscordEmbedBuilder} The final embed with the command information
 */
const generateCommandInfoEmbed = (clientCmd, interaction) => {
  // Destructure from our clientCmd object
  const {
    data, cooldown, clientPerms, userPerms, category
  } = clientCmd;
  const { channel, member } = interaction;

  // Utility function for displaying our permission requirements
  const getPermOutput = (permArr) => {
    permArr = resolvePermissionArray(permArr);
    return permArr.length >= 1
      ? permArr
        .map((perm) => `${ channel.permissionsFor(member.user.id).has(PermissionsBitField.Flags[perm])
          ? emojis.success
          : emojis.error
        } ${ splitCamelCaseStr(perm, ' ') }
        `)
        .join('\n')
      : `${ emojis.success } None required`;
  };

  // Assigning our variable type-string
  const typeStr = clientCmd instanceof ChatInputCommand
    ? 'Slash Command'
    : clientCmd instanceof MessageContextCommand
      ? 'Message Command (right-click message -> Apps)'
      : 'User Command (right-click user -> Apps)';

  return {
    color: colorResolver(colors.main),
    title: titleCase(data.name),
    description: `${ data.description }`,
    fields: [
      {
        name: 'Category',
        value: titleCase(category),
        inline: true
      },
      {
        name: `${ emojis.wait } Cooldown`,
        value: `You can use this command **${
          cooldown.usages === 1
            ? 'once'
            : cooldown.usages === 2 ? 'twice' : `${ cooldown.usages } times`
        }** every **${ cooldown.duration }** second${ cooldown.duration === 1 ? '' : 's' }`,
        inline: false
      },
      {
        name: 'Client Permissions',
        value: getPermOutput(clientPerms),
        inline: true
      },
      {
        name: 'User Permissions',
        value: getPermOutput(userPerms),
        inline: true
      },
      {
        name: 'SFW',
        value: data.NSFW === true ? `${ emojis.error } This command is **not** SFW` : `${ emojis.success } This command **is** SFW`,
        inline: false
      }
    ],
    footer: { text: `Type: ${ typeStr }` }
  };
};

/**
 * Generates an embed displaying all available commands
 * @param {external:DiscordCollection<string, ChatInputCommand>} commands The commands to generate the embed from
 * @param {external:DiscordCommandInteraction} interaction The received interaction to read data from
 * @returns {external:DiscordEmbedBuilder} The final embed data object
 */
const generateCommandOverviewEmbed = (commands, interaction) => {
  const { member, guild } = interaction;

  // Generate our embed field data
  const fields = [
    ...sortCommandsByCategory(
      // Filtering out command the user doesn't have access to
      commands
        .concat(contextMenus)
        .filter((cmd) => cmd.permLevel <= member.permLevel)
    )
      .map((entry) => {
        return {
          name: `${ titleCase(entry.category.replace(/-/g, ' ')) }`,
          value: `**\`${ entry.commands
            .map((cmd) => cmd.data.name)
            .join('`** - **`')
          }\`**`,
          inline: false
        };
      })
  ];

  return {
    title: `Command help for ${ guild.name }`,
    color: colorResolver(colors.main),
    fields,
    footer: { text: `Requested by ${ member.user.tag }` }
  };
};

module.exports = {
  apiCommandTypeList,
  clearApplicationCommandData,
  refreshSlashCommandData,
  logCommandApiData,
  cleanAPIData,
  registerGlobalCommands,
  registerTestServerCommands,
  sortCommandsByCategory,
  throttleCommand,
  getThrottleId,
  checkCommandCanExecute,
  isUserComponentCommand,
  hasAccessToComponentCommand,
  isAppropriateCommandFilter,
  getCommandSelectMenu,
  generateCommandInfoEmbed,
  generateCommandOverviewEmbed
};
