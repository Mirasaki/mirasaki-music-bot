const express = require('express');
const { getFiles } = require('../util');
const router = express.Router();
const path = require('path');

// Destructuring from env
const {
  // Project directory structure
  CHAT_INPUT_COMMAND_DIR,
  CONTEXT_MENU_COMMAND_DIR,
  AUTO_COMPLETE_INTERACTION_DIR,
  BUTTON_INTERACTION_DIR,
  MODAL_INTERACTION_DIR,
  SELECT_MENU_INTERACTION_DIR
} = process.env;

// Re-usable callback
const commandMapCallback = (filePath) => {
  const cmd = require(filePath);
  cmd.load(filePath, false);
  delete cmd.filePath; // Delete our origin filePath
  return cmd;
};

// Don't stringify BigInts when sending response
// Would otherwise error when any permissions are specified
const avoidStringifyBigInt = (inp) => JSON.parse(
  JSON.stringify(
    inp, (key, value) => typeof value === 'bigint'
      ? value.toString()
      : value
  )
);

// Utility function to avoid code repetition
const queryFilterCommands = (arr, category, limit) => {
  return arr
    .filter((cmd) => cmd.category?.toLowerCase() === category.toLowerCase())
    .slice(0, limit >= 1 ? limit : arr.length);
};

// Client Chat Input Commands
const clientCommands = getFiles(path.resolve(CHAT_INPUT_COMMAND_DIR))
  .map(commandMapCallback)
  .filter((cmd) => cmd.enabled);
// Client Context Menus
const clientCtxMenus = getFiles(path.resolve(CONTEXT_MENU_COMMAND_DIR))
  .map(commandMapCallback)
  .filter((cmd) => cmd.enabled);
// Client Auto Complete Components
const clientAutoCompletes = getFiles(path.resolve(AUTO_COMPLETE_INTERACTION_DIR))
  .map(commandMapCallback)
  .filter((cmd) => cmd.enabled);
// Client Button Components
const clientButtons = getFiles(path.resolve(BUTTON_INTERACTION_DIR))
  .map(commandMapCallback)
  .filter((cmd) => cmd.enabled);
// Client Modal Components
const clientModals = getFiles(path.resolve(MODAL_INTERACTION_DIR))
  .map(commandMapCallback)
  .filter((cmd) => cmd.enabled);
// Client Select Menu Components
const clientSelectMenus = getFiles(path.resolve(SELECT_MENU_INTERACTION_DIR))
  .map(commandMapCallback)
  .filter((cmd) => cmd.enabled);

// Application Chat Input Commands
router.route('/')
  .get((req, res) => {
    // Access the provided query parameters
    const category = req.query.category;
    const limit = req.query.limit || -1;

    // Filter by category if requested
    const usesCategoryFilter = category !== undefined;
    if (usesCategoryFilter) {
      const result = queryFilterCommands(clientCommands, category, limit);
      res.json(avoidStringifyBigInt(result));
      return;
    }

    // console.log(clientCommands);

    // Return our command map if the map is populated
    res.json(
      avoidStringifyBigInt(clientCommands)
        // Limiting our result
        .slice(0, limit >= 1 ? limit : clientCommands.length)
    );
  });

// Application Context Menu Commands
router.route('/context-menus')
  .get((req, res) => {
    // Access the provided query parameters
    const category = req.query.category;
    const limit = req.query.limit || -1;

    // Filter by category if requested
    const usesCategoryFilter = category !== undefined;
    if (usesCategoryFilter) {
      const result = queryFilterCommands(clientCtxMenus, category, limit);
      res.json(avoidStringifyBigInt(result));
      return;
    }

    // Return our command map if the map is populated
    res.json(
      avoidStringifyBigInt(clientCtxMenus)
        // Limiting our result
        .slice(0, limit >= 1 ? limit : clientCtxMenus.length)
    );
  });

// Application Auto Complete Commands
router.route('/auto-complete')
  .get((req, res) => {
    // Access the provided query parameters
    const category = req.query.category;
    const limit = req.query.limit || -1;

    // Filter by category if requested
    const usesCategoryFilter = category !== undefined;
    if (usesCategoryFilter) {
      const result = queryFilterCommands(clientAutoCompletes, category, limit);
      res.json(avoidStringifyBigInt(result));
      return;
    }

    // Return our command map if the map is populated
    res.json(
      avoidStringifyBigInt(clientAutoCompletes)
        // Limiting our result
        .slice(0, limit >= 1 ? limit : clientAutoCompletes.length)
    );
  });

// Application Button Commands
router.route('/buttons')
  .get((req, res) => {
    // Access the provided query parameters
    const category = req.query.category;
    const limit = req.query.limit || -1;

    // Filter by category if requested
    const usesCategoryFilter = category !== undefined;
    if (usesCategoryFilter) {
      const result = queryFilterCommands(clientButtons, category, limit);
      res.json(avoidStringifyBigInt(result));
      return;
    }

    // Return our command map if the map is populated
    res.json(
      avoidStringifyBigInt(clientButtons)
        // Limiting our result
        .slice(0, limit >= 1 ? limit : clientButtons.length)
    );
  });

// Application Modal Commands
router.route('/modals')
  .get((req, res) => {
    // Access the provided query parameters
    const category = req.query.category;
    const limit = req.query.limit || -1;

    // Filter by category if requested
    const usesCategoryFilter = category !== undefined;
    if (usesCategoryFilter) {
      const result = queryFilterCommands(clientModals, category, limit);
      res.json(avoidStringifyBigInt(result));
      return;
    }

    // Return our command map if the map is populated
    res.json(
      avoidStringifyBigInt(clientModals)
        // Limiting our result
        .slice(0, limit >= 1 ? limit : clientModals.length)
    );
  });

// Application Select Menu Commands
router.route('/select-menus')
  .get((req, res) => {
    // Access the provided query parameters
    const category = req.query.category;
    const limit = req.query.limit || -1;

    // Filter by category if requested
    const usesCategoryFilter = category !== undefined;
    if (usesCategoryFilter) {
      const result = queryFilterCommands(clientSelectMenus, category, limit);
      res.json(avoidStringifyBigInt(result));
      return;
    }

    // Return our command map if the map is populated
    res.json(
      avoidStringifyBigInt(clientSelectMenus)
        // Limiting our result
        .slice(0, limit >= 1 ? limit : clientSelectMenus.length)
    );
  });

/*
 * Filter by name, catch all, end of file
 */

// Application Chat Input Commands - Find by name
router.route('/:name')
  .get((req, res) => {
    // Destructure name from out route parameters
    const { name } = req.params;
    // Finding our related command
    const cmd = clientCommands.find((cmd) => cmd.data.name === name);
    if (cmd) res.json(avoidStringifyBigInt(cmd));
    else res.sendStatus(404);
  });

// Application Context Menu Commands - Find by name
router.route('/context-menus/:name')
  .get((req, res) => {
    // Destructure name from out route parameters
    const { name } = req.params;
    // Finding our related command
    const cmd = clientCtxMenus.find((cmd) => cmd.data.name === name);
    if (cmd) res.json(avoidStringifyBigInt(cmd));
    else res.sendStatus(404);
  });

// Application Auto Complete Commands - Find by name
router.route('/auto-complete/:name')
  .get((req, res) => {
    // Destructure name from out route parameters
    const { name } = req.params;
    // Finding our related command
    const cmd = clientAutoCompletes.find((cmd) => cmd.data.name === name);
    if (cmd) res.json(avoidStringifyBigInt(cmd));
    else res.sendStatus(404);
  });

// Application Button Commands - Find by name
router.route('/buttons/:name')
  .get((req, res) => {
    // Destructure name from out route parameters
    const { name } = req.params;
    // Finding our related command
    const cmd = clientButtons.find((cmd) => cmd.data.name === name);
    if (cmd) res.json(avoidStringifyBigInt(cmd));
    else res.sendStatus(404);
  });

// Application Modal Commands - Find by name
router.route('/modals/:name')
  .get((req, res) => {
    // Destructure name from out route parameters
    const { name } = req.params;
    // Finding our related command
    const cmd = clientModals.find((cmd) => cmd.data.name === name);
    if (cmd) res.json(avoidStringifyBigInt(cmd));
    else res.sendStatus(404);
  });

// Application Select Menu Commands - Find by name
router.route('/select-menus/:name')
  .get((req, res) => {
    // Destructure name from out route parameters
    const { name } = req.params;
    // Finding our related command
    const cmd = clientSelectMenus.find((cmd) => cmd.data.name === name);
    if (cmd) res.json(avoidStringifyBigInt(cmd));
    else res.sendStatus(404);
  });


module.exports = router;
