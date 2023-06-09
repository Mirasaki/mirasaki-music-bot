# discord.js-bot-template

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
![build](https://img.shields.io/github/actions/workflow/status/Mirasaki/discord.js-bot-template/test.yml?branch=main)
[![CodeFactor](https://www.codefactor.io/repository/github/mirasaki/discord.js-bot-template/badge)](https://www.codefactor.io/repository/github/mirasaki/discord.js-bot-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Docker Pulls](https://img.shields.io/docker/pulls/mirasaki/discord-bot-template)
![version](https://img.shields.io/github/v/release/Mirasaki/discord.js-bot-template)

---

This is a bot template using [discord.js](https://github.com/discordjs/discord.js "discord.js on Github") for quickly and easily creating powerful [Discord](https://discord.com/ "Official Discord Website") bots. You don't need much Javascript experience to get started on a project using this template. Not sure where to start? Come join my [Discord Server](https://discord.mirasaki.dev "Mirasaki Development on Discord"), where I'll try and answer all the questions you have.

---

With [Message Content Access becoming a privileged intent](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots "source") I thought I'd build a template where you're ready to start working on commands after installing it. This template currently doesn't listen to the `messageCreate` event. Update Slash Commands by using the `/deploy` command or altering the environmental variables. It also uses the latest Discord features, like auto-complete, buttons, modals, and other components.

---

Uses [Semantic Release](https://github.com/semantic-release/semantic-release) so you can easily determine if it's appropriate for you to [update](#updating) the bot

---

## Table of Contents

- [Live Demo](#live-demo)
- [Showcase](#showcase)
- [Documentation](#documentation)
- [Features](#features)
  - [Dynamic Command Handler](#dynamic-command-handler)
  - [Dynamic Component Handler](#dynamic-component-handler)
  - [Dynamic Event Handler](#dynamic-event-handler)
  - [RESTful API](#restful-api)
  - [Others](#others)
- [Notes](#notes)
- [Installation & Usage](#installation--usage)
  - [Prerequisites](#prerequisites)
  - [Docker](#run-as-a-docker-container-preferred)
  - [Node](#run-as-a-plain-nodejs-app)
  - [Updating](#updating)

---

<h2 id="live-demo">Live Demo</h2>

Come try the template yourself in our official [support server](https://discord.mirasaki.dev "Mirasaki Development on Discord")

<h2 id="showcase">Showcase / Projects using this template</h2>

- [Green Mountain Trader - over 300,000 users](https://mirasaki.dev/gmt)
- [DayZ Leaderboard bot](https://github.com/Mirasaki/dayz-leaderboard-bot "DayZ Leaderboard bot on GitHub")
- Create a new issues if you want to have your project showcased here

<h2 id="documentation">Documentation</h2>

- The client (bot) code is documented at [djs.mirasaki.dev](https://djs.mirasaki.dev "Client Documentation")
- The API is documented at [djs.mirasaki.dev/api-docs](https://djs.mirasaki.dev/tutorial-api-docs "Backend/API Documentation")
- Source code is well documented with comments, explaining what's going on
- With the use of JSDoc for client documentation, enjoy code-completion (IntelliSense) in your favorite code editor

<h2 id="features">Features</h2>

<h3 id="dynamic-command-handler">Dynamic Command Handler</h3>

- This template comes with a powerful, yet simple to understand and modify, dynamic command handler. You can go straight to adding new commands without having to worry about client internals.
- [Message Content Access is becoming a privileged intent](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots "source") and that's why this template focuses on Discord's [Application Commands](https://discord.com/developers/docs/interactions/receiving-and-responding#interactions "Discord Application Command Documentation"). In fact, we don't even activity listen to the `messageCreate` event.
- Every module in the [command root folder](/src/commands/) will be loaded as a [ChatInputCommand](https://djs.mirasaki.dev/ChatInputCommand.html "ChatInputCommand Documentation"), taking care of default configuration.
    1. Default command name is the name of the file without extension.
    2. Default command category is the name of the parent folder.
- Every module in the [context-menus folder](/src/context-menus/) will be loaded as either a [UserContextCommand](https://djs.mirasaki.dev/UserContextCommand.html "UserContextCommand Documentation") or a [MessageContextCommand](https://djs.mirasaki.dev/UserContextCommand.html "MessageContextCommand Documentation"), depending on which folder it's located in.
- Deep nest to your heart's content. Deep nesting files in folders for all [ChatInputCommand](https://djs.mirasaki.dev/ChatInputCommand.html "ChatInputCommand Documentation"), and **any** API Components is supported for 25 levels.
- Configure internal permission levels, and define any additional (optional) Discord permissions required to execute the command. Useful for Moderation tools.
- Enable commands globally, restrict them to a single testing server, or even disable it all together if you've discovered a major bug in your code.
- Throttle your command usage, configure a `{{usages}} in {{duration}}` cooldown to individual commands. With the 5 different available cooldown types (user, member, channel, guild, global), you can configure an appropriate cooldown for all your commands and components.
- Configure aliases for all your Application Commands. (ChatInput, UserContextMenu, and MessageContextMenu)

<h3 id="dynamic-component-handler">Dynamic Component Handler</h3>

- Ignores component actions where the custom id starts with `@` - so you can use in-command listeners along side the built-in component handler
- Supports, and uses, all the latest Discord API features, like buttons, modals, context-menus, select-menus, and is autocomplete-enabled!
- The same configuration as your command files. Apply a cooldown to any component, and manage permissions and all the other configuration you're used to from this template.
- Examples on how to implement all the different API components.
    1. [`/info`](/src/context-menus/user/info.js) - User Context Menu Command, displays detailed information about the user. (Right-click a user -> Apps)
    2. [`/print-embeds`](/src/context-menus/message/print-embed.js) - Message Context Menu Command, grabs and prints raw Embed JSON data from a message and sends it to the member. (Right-click a message -> Apps)
    3. [Autocomplete-enabled `/help` command](src/interactions/autocomplete/help.js) - The template is auto-complete enabled, just return an array of any size in the files `run()` function
    4. [`/eval` button-integration](/src/interactions/buttons/eval/acceptEval.js) - Manage buttons and button-groups easily, and apply additional permissions and cooldown for **all** components. (except `autocomplete`)
    5. [`/eval` modal-integration](/src/interactions/modals/evalSubmit.js) - Manage modals, we have unique identifier declared in our [constants file](/src/constants.js) to make sure we use the same `customId` field across all components and different files. Not required, but strongly recommended.
    6. [`/help` select-menu-integration](/src/interactions/select-menus/help.js) - Integrating seamlessly with the code in our main [`/help` command](/src/commands/system/help.js)

<h3 id="dynamic-event-handler">Dynamic Event Handler</h3>

Every file in [the `listeners` folder](/src/listeners/) will be registered as an event listener where the file name without extension is the name of the event. Creating a file named `messageCreate.js` will listen to the `messageCreate` event, achieving the same as using `client.on()`. It listens for events, not much more to say about it.

<h3 id="restful-api">RESTful API</h3>

This template comes with a REST API (OpenAPI spec 3.0.0). By default, this only serves the client's command data, which can be used to easily fetch your command data and build a dynamic command table/overview on your personal website. As this project is meant to be newbie-friendly, I thought I would include a **very** basic API template, so new developers are free to play around with it without having to set-up anything themselves. Change `USE_API` to `true` in the [env file](/.env.example) to enable this feature.

<h3 id="others">Others</h3>

- Supports VSCode IntelliSense for auto-complete during local development.
- Uses Discord's Autocomplete API, and showcases it in the `/help` command.
- All the template files have comments explaining what's going on, making it easy for new JavaScript developers to jump in.
- Comes with a [utility file](https://djs.mirasaki.dev/module-Utils.html "Utility file documentation"), which exports utility functions to make your common tasks easier/faster.
- Extensions to `discord.js` have been containerized. Everything is documented in the [typings file](/typings.d.ts), or check out the [client-extension](https://djs.mirasaki.dev/module-Client.html "Client-extension documentation") file, which is served as `client.container`.
- Automatically (environmental variable dependent) deploy changes to your API commands, or use the [/deploy](/src/commands/developer/deploy.js) command.

<h3 id="notes">Notes</h3>

- Don't like the folder structure? Jump into the [environmental file](/.env.example) and configure where your commands and components are loaded from
- Every embed color code and emoji are grabbed from their respective [configuration file](/src/config/), meaning you can personalize the bot without having to go over a plethora of files
- Comes with a [constants file](/src/constants.js) to manage your unique ids and previously hard-coded values
- Comes with many example scripts for `pm2` and `docker`, including a docker development build - to get you started using these awesome services
- And lastly...

You don't **have** to use the built-in component command (buttons, modals, etc) handler. Alternatively, you can use the following (vanilla `discord.js`) code to achieve the same, but within a ChatInput/UserContextMenu/MessageContextMenu command file:

```javascript
// In any scope with a valid interaction object
const { ComponentType } = require('discord.js');
// Fetching the message attached to the received interaction
const interactionMessage = await interaction.fetchReply();

// Button reply/input collector
const acceptEvalCollector = interactionMessage.createMessageComponentCollector({
    filter: (i) => (
        // Filter out custom ids
        i.customId === 'customId' || i.customId === 'customIdTwo'
    ) && i.user.id === interaction.user.id, // Filter out people without access to the command
    componentType: ComponentType.Button,
    time: 60000
});

// And finally, running code when it collects an interaction (defined as "i" in this callback)
acceptEvalCollector.on('collect', (i) => { /* The callback to run */ });
```

<h2 id="installation--usage">Installation & Usage</h2>

<h3 id="prerequisites">Prerequisites</h3>

- A [Discord Bot account](https://discord.com/developers/applications "Discord Developer Portal")
    1) Head over to the page linked above
    2) Click "New Application" in the top right
    3) Give it a cool name and click "Create"
    4) Click "Bot" in the left hand panel
    5) Click "Add Bot" -> "Yes, do it!"
    6) Click "Reset Token" and copy it to your clipboard, you will need it later

> If you're planning on hosting the backend, be sure to run the command `npm run docs` after installing, otherwise the root/index at `http://localhost:3000/` will return a 404 | Not Found error.

<h3 id="run-as-a-docker-container-preferred">Run as a Docker container (preferred)</h3>

The quickest, and easiest, way to host/use this bot is by deploying it inside of a [Docker](https://docs.docker.com/engine/install/ "Official Docker Website") container.

1. Clone this repository: `git clone https://github.com/Mirasaki/discord.js-bot-template.git`
2. Navigate inside the new folder: `cd discord.js-bot-template`
3. Rename `.env.example` to `.env` and provide your environmental variables
4. Rename `config.example.js` to `config.js` and provide your configuration

    - Alternatively, you can now use the `docker-compose up` command to finish setting up the project if you have the [Docker Compose CLI](https://docs.docker.com/compose/) installed

5. Build the project: `docker build --tag my-discord-bot .`
6. Start the bot: `docker run -it --env-file .env --name my-discord-bot mirasaki/discord-bot-template:main`

There's a plethora of Docker scripts included in the `/package.json` file, including a development environment - take a look to get started if you've never used Docker before!

<h3 id="run-as-a-plain-nodejs-app">Run as a plain NodeJS app</h3>

<h4 id="prerequisites">Prerequisites</h4>

- [NodeJS](https://nodejs.org/en/download/ "Node official website") (if you're running as a plain NodeJS app)
    1) Head over to the download page
    2) Download the current build (latest features) available for your OS
    3) Be sure to check the box that says "Automatically install the necessary tools" when you're running the installation wizard

You can also clone this repository or download a release, and host the project directly. You will need [Node/NodeJS](https://nodejs.org/en/ "Node official website") (Be sure to check the box that says "Automatically install the necessary tools" when you're running the installation wizard)

1. Head over to [the download page](https://github.com/Mirasaki/discord.js-bot-template/releases/)
    - Alternatively, clone this repository by using `git clone https://github.com/Mirasaki/discord.js-bot-template.git` and skip to step 4 if you have [Git](https://git-scm.com/downloads "Git Download Section") installed.
2. Download either the `zip` or `zip.gz` source code
3. Extract it using [your favorite zip tool](https://www.rarlab.com/download.htm "It's WinRar, duh")
4. Open a new console/terminal/shell window in the newly created project folder.
5. Run `npm i --include-dev` to install all dependencies, including development dependencies.
6. Rename [`.env.example`](/.env.example "View .env.example file in current repository") to `.env` and configure your environmental variables
7. Rename [`config.example.js`](/config.example.js "View config.example.js file in current repository") to `config.js` and go through your bot configuration
8. Use the command `node .` to start the application, or alternatively:
    - `npm run start` to keep the process alive with [PM2](https://pm2.io/ "PM2 | Official Website"), suitable for production environments. (`npm i -g pm2` to install)
    - `npm run start:dev` if you have `nodemon` installed for automatic restarts on changes, suitable for development environments.

<h3 id="updating">Updating</h3>

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) so you can update your own bot to the new standards of the template using a relatively simple and easy workflow:

1. Add a new remote repository, called `upstream` here

    - `git remote add upstream git@github.com:Mirasaki/discord.js-bot-template.git`

2. Pull changes from the upstream repo:

    - `git pull upstream main --allow-unrelated-histories`
    - `--allow-unrelated-histories` is a dangerous flag, and you should only use this if you know what you're doing!
    - Now, you should see some merge conflicts - I recommended resolving the merge in the VSCode Merge Editor
    - If you just want it to download the changes without automatically merging, use `git fetch` instead of `git pull`

3. If you want to disable/prevent pushing to the remote repository, set the push URL to an invalid URL using something like

    - `git config remote.upstream.pushurl "PREVENTS_PUSH_TO_REMOTE_UPSTREAM"`

That's it! You're done!
If you know of a better workflow to pull remote changes, like `git merge -/- --squash etc` (not ideal) - please let us know by creating an issue or pull request.

---

> Open source, self-hosted, and MIT licensed, meaning you're in full control.
