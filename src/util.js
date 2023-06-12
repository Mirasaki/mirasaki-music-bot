/**
 * Our collection of utility functions, exported from the `/src/util.js` file
 * @module Utils
 */

/**
 * The `discord.js` Collection
 * @external DiscordCollection
 * @see {@link https://discord.js.org/#/docs/collection/main/class/Collection}
 */

// Importing from libraries
const {
  OAuth2Scopes,
  PermissionFlagsBits,
  ComponentType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const {
  readdirSync, statSync, existsSync
} = require('fs');
const moment = require('moment');
const path = require('path');
const logger = require('@mirasaki/logger');
const colors = require('./config/colors.json');

// Import our constants
const {
  NS_IN_ONE_MS,
  NS_IN_ONE_SECOND,
  DEFAULT_DECIMAL_PRECISION,
  MS_IN_ONE_DAY,
  MS_IN_ONE_HOUR,
  MS_IN_ONE_MINUTE,
  MS_IN_ONE_SECOND
} = require('./constants');
const { validPermValues } = require('./handlers/permissions');
const emojis = require('./config/emojis.json');

// Resolve client configuration
const modeArg = process.argv.find((arg) => arg.startsWith('mode='));
const configFilePath = modeArg && modeArg.endsWith('test') ? '../config.example.js' : '../config.js';
if (!existsSync(configFilePath.replace(/\.\.\//g, ''))) {
  logger.syserr(`Configuration file at "${ configFilePath.replace(/\.\.\//g, '') }" doesn't exists, please refer to documentation, exiting...`);
  process.exit(0);
}
const clientConfig = require(configFilePath);

/**
 * Transforms hex and rgb color input into integer color code
 * @method colorResolver
 * @param {string | Array<number>} [input] Hex color code or RGB array
 * @returns {number}
 */
const colorResolver = (input) => {
  // Return main bot color if no input is provided
  if (!input) return parseInt(colors.main.slice(1), 16);
  // Hex values
  if (typeof input === 'string') input = parseInt(input.slice(1), 16);
  // RGB values
  else input = (input[0] << 16) + (input[1] << 8) + input[2];
  // Returning our result
  return input;
};

/**
 * Get an array of (resolved) absolute file paths in the target directory,
 * Ignores files that start with a "." character
 * @param {string} requestedPath Absolute path to the directory
 * @param {Array<string>} [allowedExtensions=['.js', '.mjs', '.cjs']] Array of file extensions
 * @returns {Array<string>} Array of (resolved) absolute file paths
 */
const getFiles = (requestedPath, allowedExtensions = [
  '.js',
  '.mjs',
  '.cjs'
]) => {
  if (typeof allowedExtensions === 'string') allowedExtensions = [ allowedExtensions ];
  requestedPath ??= path.resolve(requestedPath);
  let res = [];

  for (let itemInDir of readdirSync(requestedPath)) {
    itemInDir = path.resolve(requestedPath, itemInDir);
    const stat = statSync(itemInDir);

    if (stat.isDirectory()) res = res.concat(getFiles(itemInDir, allowedExtensions));
    if (
      stat.isFile()
      && allowedExtensions.find((ext) => itemInDir.endsWith(ext))
      && !itemInDir.slice(
        itemInDir.lastIndexOf(path.sep) + 1, itemInDir.length
      ).startsWith('.')
    ) res.push(itemInDir);
  }
  return res;
};

/**
 * Utility function for getting the relative time string using moment
 * @param {Date} date The date to get the relative time from
 * @returns {string} Relative time from parameter Date
 */
const getRelativeTime = (date) => moment(date).fromNow();

/**
 * String converter: Mary Had A Little Lamb
 * @param {string} str Any string of characters
 * @returns {string} The string in title-case format
 */
const titleCase = (str) => {
  if (typeof str !== 'string') throw new TypeError('Expected type: String');
  str = str.toLowerCase().split(' ');
  for (let i = 0; i < str.length; i++) str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  return str.join(' ');
};

/**
 * String converter: camelCaseString => ['camel', 'Case', 'String']
 * @param {string} str Any camelCase string
 * @param {string | null} joinCharacter If provided, joins the array output back together using the character
 * @returns {Array<string> | string} array of strings if joinCharacter is omitted, string if provided
 */
const splitCamelCaseStr = (str, joinCharacter = ' ') => {
  const arr = str.split(/ |\B(?=[A-Z])/);

  if (typeof joinCharacter === 'string') {
    return arr.join(joinCharacter);
  }
  return arr;
};

/**
 * String converter: Mary had a little lamb
 * @param {*} str The string to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeString = (str) => `${ str.charAt(0).toUpperCase() }${ str.slice(1) }`;

/**
 * String converter: Parses a SNAKE_CASE_ARRAY to title-cased strings in an array
 * @param {Array<string>} arr Array of strings to convert
 * @returns {Array<string>} Array of title-cases SNAKE_CASE_ARRAY strings
 */
const parseSnakeCaseArray = (arr) => {
  return arr.map((str) => {
    str = str.toLowerCase().split(/[ _]+/);
    for (let i = 0; i < str.length; i++) str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    return str.join(' ');
  });
};

/**
 * Get bot invite link, takes required permissions into consideration
 * @param {Client} client Our extended discord.js client
 * @returns {string} The invite link to add the bot to a server
 */
const getBotInviteLink = (client) => {
  const { commands } = client.container;
  const uniqueCombinedPermissions = [ ...new Set([].concat(...commands.map(((cmd) => cmd.clientPerms)))) ];
  uniqueCombinedPermissions.push(...client.container.config.permissionsBase);

  return client.generateInvite({
    scopes: [ OAuth2Scopes.ApplicationsCommands, OAuth2Scopes.Bot ],
    permissions: uniqueCombinedPermissions
      .map((rawPerm) => PermissionFlagsBits[rawPerm] ?? validPermValues.find((e) => e === rawPerm))
  });
};

/**
 * Make the client sleep/wait for a specific amount of time
 * @param {number} ms The amount of time in milliseconds to wait/sleep
 * @returns {Promise<void>} The promise to await
 */
// We don't need to access the return value here, EVER, so -
// eslint-disable-next-line no-promise-executor-return
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get runtime since process.hrtime.bigint() - NOT process.hrtime()
 * @param {bigint} hrtime Timestamp in nanosecond precision
 * @param {number | 2} decimalPrecision Amount of characters to display after decimal point
 * @returns {{ seconds: number, ms: number, ns: bigint }}
 */
const getRuntime = (hrtime, decimalPrecision = DEFAULT_DECIMAL_PRECISION) => {
  // Converting
  const inNS = process.hrtime.bigint() - hrtime;
  const nsNumber = Number(inNS);
  const inMS = (nsNumber / NS_IN_ONE_MS).toFixed(decimalPrecision);
  const InSeconds = (nsNumber / NS_IN_ONE_SECOND).toFixed(decimalPrecision);

  // Return the conversions
  return {
    seconds: InSeconds,
    ms: inMS,
    ns: inNS
  };
};

/**
 * Takes milliseconds as input and returns a string like: 2 days, 5 minutes, 21 seconds
 * @param {number} ms Time in milliseconds
 * @returns
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const msToHumanReadableTime = (ms) => {
  const days = Math.floor(ms / MS_IN_ONE_DAY);
  const hours = Math.floor((ms % MS_IN_ONE_DAY) / MS_IN_ONE_HOUR);
  const minutes = Math.floor((ms % MS_IN_ONE_HOUR) / MS_IN_ONE_MINUTE);
  const seconds = Math.floor((ms % MS_IN_ONE_MINUTE) / MS_IN_ONE_SECOND);

  const parts = [];
  if (days > 0) parts.push(`${ days } day${ days === 1 ? '' : 's' }`);
  if (hours > 0) parts.push(`${ hours } hour${ hours === 1 ? '' : 's' }`);
  if (minutes > 0) parts.push(`${ minutes } minute${ minutes === 1 ? '' : 's' }`);
  if (seconds > 0) parts.push(`${ seconds } second${ seconds === 1 ? '' : 's' }`);

  if (parts.length === 0) return '0 seconds';
  else if (parts.length === 1) return parts[0];
  else if (parts.length === 2) return `${ parts[0] } and ${ parts[1] }`;
  else {
    const lastPart = parts.pop();
    const formattedParts = parts.join(', ');
    return `${ formattedParts }, and ${ lastPart }`;
  }
};

const isAllowedContentType = (valid, received) => {
  return {
    strict: valid === received,
    fuzzy: received.startsWith(valid.split('/')[0])
  };
};

const handlePaginationButtons = (i, componentMember, pageNow, prevCustomId, nextCustomId, usableEmbeds) => {
  // Wrong user
  if (i.user.id !== componentMember.user.id) {
    i.reply({
      content: `${ emojis.error } ${ i.user }, this component isn't meant for you, initialize it yourself by using \`/queue\` - this action has been cancelled`,
      ephemeral: true
    });
    return false;
  }

  // Prev Button - Check bounds
  else if (
    i.customId === prevCustomId
    && pageNow === 1
  ) {
    i.reply({
      content: `${ emojis.error } ${ i.user }, you're on the first page, this action has been cancelled`,
      ephemeral: true
    });
    return false;
  }

  // Next - Check bounds
  else if (
    i.customId === nextCustomId
    && pageNow === usableEmbeds.length
  ) {
    i.reply({
      content: `${ emojis.error } ${ componentMember }, you're already viewing the last page, this action has been cancelled`,
      ephemeral: true
    });
    return false;
  }

  // Passed checks
  return true;
};

const dynamicInteractionReplyFn = (interaction, shouldFollowUpIfReplied = false) => {
  const interactionWasAcknowledged = interaction.deferred || interaction.replied;
  return interactionWasAcknowledged
    ? shouldFollowUpIfReplied
      ? interaction.followUp
      : interaction.editReply
    : interaction.reply;
};

const handlePagination = async (
  interaction,
  member,
  usableEmbeds,
  activeDurationMs = MS_IN_ONE_MINUTE * 3,
  shouldFollowUpIfReplied = false
) => {
  let pageNow = 1;
  const prevCustomId = `@page-prev@${ member.id }@${ Date.now() }`;
  const nextCustomId = `@page-next@${ member.id }@${ Date.now() }`;

  const initialCtx = {
    embeds: [ usableEmbeds[pageNow - 1] ],
    components: getPaginationComponents(pageNow, usableEmbeds.length, prevCustomId, nextCustomId),
    fetchReply: true
  };
  const replyFunction = dynamicInteractionReplyFn(interaction, shouldFollowUpIfReplied);
  const interactionMessage = await replyFunction
    .call(interaction, initialCtx)
    .catch((err) => {
      logger.syserr('Error encountered while responding to interaction with dynamic reply function:');
      console.dir({
        pageNow,
        prevCustomId,
        nextCustomId,
        initialCtx
      });
      console.error(err);
    });

  // Button reply/input collector
  const paginationCollector = interactionMessage.createMessageComponentCollector({
    filter: (i) => (
    // Filter out custom ids
      i.customId === prevCustomId || i.customId === nextCustomId
    ), // Filter out people without access to the command
    componentType: ComponentType.Button,
    time: activeDurationMs
  });

  // Reusable update
  const updateEmbedReply = (i) => i.update({
    embeds: [ usableEmbeds[pageNow - 1] ],
    components: getPaginationComponents(pageNow, usableEmbeds.length, prevCustomId, nextCustomId)
  });

  // And finally, running code when it collects an interaction (defined as "i" in this callback)
  paginationCollector.on('collect', (i) => {
    if (handlePaginationButtons(
      i,
      member,
      pageNow,
      prevCustomId,
      nextCustomId,
      usableEmbeds
    ) !== true) return;

    // Prev Button - Go to previous page
    if (i.customId === prevCustomId) pageNow--;
    // Next Button - Go to next page
    else if (i.customId === nextCustomId) pageNow++;

    // Update reply with new page index
    updateEmbedReply(i);
  });

  paginationCollector.on('end', () => {
    interaction.editReply({ components: getPaginationComponents(
      pageNow,
      usableEmbeds.length,
      prevCustomId,
      nextCustomId,
      true
    ) }).catch(() => { /* Void */ });
  });
};

const getPaginationComponents = (pageNow, pageTotal, prevCustomId, nextCustomId, disableAll = false) => {
  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(prevCustomId)
          .setLabel('Previous')
          .setDisabled(!!(disableAll || pageNow === 1))
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(nextCustomId)
          .setLabel('Next')
          .setDisabled(!!(disableAll || pageNow === pageTotal))
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Primary)
      )
  ];
};

module.exports = {
  clientConfig,
  splitCamelCaseStr,
  colorResolver,
  getFiles,
  getRelativeTime,
  titleCase,
  capitalizeString,
  parseSnakeCaseArray,
  getBotInviteLink,
  wait: sleep,
  sleep,
  getRuntime,
  msToHumanReadableTime,
  isAllowedContentType,
  handlePaginationButtons,
  dynamicInteractionReplyFn,
  handlePagination,
  getPaginationComponents
};
