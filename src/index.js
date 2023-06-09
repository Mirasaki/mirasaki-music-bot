// Importing from packages
require('dotenv').config();
const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const {
  Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus
} = require('discord.js');

// Argv
const modeArg = process.argv.find((arg) => arg.startsWith('mode='));

// Local imports
const pkg = require('../package');
const { clearApplicationCommandData, refreshSlashCommandData } = require('./handlers/commands');
const {
  getFiles, titleCase, getRuntime, clientConfig
} = require('./util');
const config = clientConfig;
const path = require('path');
const clientExtensions = require('./client');

// Clear the console in non-production modes & print vanity
process.env.NODE_ENV !== 'production' && console.clear();
const packageIdentifierStr = `${ pkg.name }@${ pkg.version }`;
logger.info(`${ chalk.greenBright.underline(packageIdentifierStr) } by ${ chalk.cyanBright.bold(pkg.author) }`);

// Initializing/declaring our variables
const initTimerStart = process.hrtime.bigint();
const intents = config.intents.map((intent) => GatewayIntentBits[intent]);
const presenceActivityMap = config.presence.activities.map(
  (act) => ({
    ...act, type: ActivityType[titleCase(act.type)]
  })
);

// Building our discord.js client
const client = new Client({
  intents: intents,
  presence: {
    status: PresenceUpdateStatus[config.presence.status] || PresenceUpdateStatus['online'],
    activities: presenceActivityMap
  }
});

// Destructuring from env
const {
  DISCORD_BOT_TOKEN,
  DEBUG_ENABLED,
  CLEAR_SLASH_COMMAND_API_DATA,
  USE_API,

  // Project directory structure
  CHAT_INPUT_COMMAND_DIR,
  CONTEXT_MENU_COMMAND_DIR,
  AUTO_COMPLETE_INTERACTION_DIR,
  BUTTON_INTERACTION_DIR,
  MODAL_INTERACTION_DIR,
  SELECT_MENU_INTERACTION_DIR
} = process.env;

// Listen for user requested shutdown
process.on('SIGINT', () => {
  logger.info('\nGracefully shutting down from SIGINT (Ctrl-C)');
  process.exit(0);
});

// Error handling / keep alive - ONLY in production as you shouldn't have any
// unhandledRejection or uncaughtException errors in production
// these should be addressed in development
if (process.env.NODE_ENV !== 'production') {
  process.on('unhandledRejection', (reason, promise) => {
    logger.syserr('Encountered unhandledRejection error (catch):');
    console.error(reason, promise);
  });
  process.on('uncaughtException', (err, origin) => {
    logger.syserr('Encountered uncaughtException error:');
    console.error(err, origin);
  });
}

/**
 * Register our listeners using client.on(fileNameWithoutExtension)
 * @private
 */
const registerListeners = () => {
  const eventFiles = getFiles('src/listeners', '.js');
  const eventNames = eventFiles.map((filePath) => filePath.slice(
    filePath.lastIndexOf(path.sep) + 1,
    filePath.lastIndexOf('.')
  ));

  // Debug logging
  if (DEBUG_ENABLED === 'true') {
    logger.debug(`Registering ${ eventFiles.length } listeners: ${ eventNames.map((name) => chalk.whiteBright(name)).join(', ') }`);
  }

  // Looping over our event files
  for (const filePath of eventFiles) {
    const eventName = filePath.slice(
      filePath.lastIndexOf(path.sep) + 1,
      filePath.lastIndexOf('.')
    );

    // Binding our event to the client
    const eventFile = require(filePath);

    client.on(eventName, (...received) => eventFile(client, ...received));
  }
};

// Use an Immediately Invoked Function Expressions (IIFE) if you need to use await
// In the index.js main function
// (async () => {})();

// Containerizing? =) all our client extensions
client.container = clientExtensions;

// Clear only executes if enabled in .env
if (CLEAR_SLASH_COMMAND_API_DATA === 'true') {
  clearApplicationCommandData();
}

// Destructure from our client extensions container
const {
  commands,
  contextMenus,
  buttons,
  modals,
  autoCompletes,
  selectMenus
} = client.container;

// Binding our Chat Input/Slash commands
logger.debug(`Start loading Slash Commands... ("${ CHAT_INPUT_COMMAND_DIR }")`);
for (const filePath of getFiles(CHAT_INPUT_COMMAND_DIR)) {
  try {
    const command = require(filePath);

    command.load(filePath, commands);

    // loadAliases AFTER #load(), setting the origin filepath
    command.loadAliases();
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Slash Command (${ CHAT_INPUT_COMMAND_DIR }), are you sure you're exporting an instance of ChatInputCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Binding our User Context Menu commands
logger.debug(`Start loading User Context Menu Commands... ("${ CONTEXT_MENU_COMMAND_DIR }/user")`);
for (const filePath of getFiles(`${ CONTEXT_MENU_COMMAND_DIR }/user`)) {
  try {
    const command = require(filePath);
    command.load(filePath, contextMenus);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading User Context Menu Command (${ CONTEXT_MENU_COMMAND_DIR }/user), are you sure you're exporting an instance of UserContextCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Binding our Message Context Menu commands
logger.debug(`Start loading Message Context Menu Commands... ("${ CONTEXT_MENU_COMMAND_DIR }/message")`);
for (const filePath of getFiles(`${ CONTEXT_MENU_COMMAND_DIR }/message`)) {
  try {
    const command = require(filePath);
    command.load(filePath, contextMenus);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading User Context Menu Command (${ CONTEXT_MENU_COMMAND_DIR }/message), are you sure you're exporting an instance of MessageContextCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Binding our Button interactions
logger.debug(`Start loading Button Commands... ("${ BUTTON_INTERACTION_DIR }")`);
for (const filePath of getFiles(BUTTON_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, buttons);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Button Command (${ BUTTON_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Binding our Modal interactions
logger.debug(`Start loading Modal Commands... ("${ MODAL_INTERACTION_DIR }")`);
for (const filePath of getFiles(MODAL_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, modals);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Modal Command (${ MODAL_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Binding our Autocomplete interactions
logger.debug(`Start loading Auto Complete Commands... ("${ AUTO_COMPLETE_INTERACTION_DIR }")`);
for (const filePath of getFiles(AUTO_COMPLETE_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, autoCompletes);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Auto Complete Command (${ AUTO_COMPLETE_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Binding our Select Menu interactions
logger.debug(`Start loading Select Menu Commands... ("${ SELECT_MENU_INTERACTION_DIR }")`);
for (const filePath of getFiles(SELECT_MENU_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, selectMenus);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Select Menu Command (${ SELECT_MENU_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

// Refresh InteractionCommand data if requested
refreshSlashCommandData(client);

// Registering our listeners
registerListeners();

/**
 * Finished initializing
 * Performance logging and logging in to our client
 */

// Execution time logging
logger.success(`Finished initializing after ${ getRuntime(initTimerStart).ms } ms`);

// Require our server index file if requested
if (USE_API === 'true') require('./server/');

// Exit before initializing listeners in test mode
if (modeArg && modeArg.endsWith('test')) process.exit(1);

// Logging in to our client
client.login(DISCORD_BOT_TOKEN);
