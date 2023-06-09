# Adding commands

Create a new file **anywhere** in the [command root folder](/src/commands/)

- This can be anywhere: Directly inside the root folder, or deep-nested up to 25 levels deep.

Import/require the [ChatInputCommand](https://djs.mirasaki.dev/ChatInputCommand.html) from `/src/classes/Commands.js`

```javascript
// This example assumes you created a file in a new folder inside the command root folder, example: /src/commands/level/rank.js

const { ChatInputCommand } = require('../../classes/Commands');
```

Export the defined class after calling the constructor using the `new` keyword, and supply an object as the first, and only, parameter

```javascript
module.exports = new ChatInputCommand({

});
```

Since this is a [Discord Application Command](https://discord.com/developers/docs/interactions/application-commands "Source @ discord.dev"), we will have to define a name. The API data is defined in the `data` property. If no name is provided, the filename without extension is the default.

```javascript
module.exports = new ChatInputCommand({
  data: { name: 'rank' }
});
```

The **only** thing we will have to provide, is the `run` parameter, which is the fallback executed when the command is invoked.

```javascript
module.exports = new ChatInputCommand({
  run: async (client, interaction) => {
    // Code to run when the command is invoked.
  }
});
```

When you're done developing your command, you should make it available to every guild/server instead of just our testing environment

```javascript
module.exports = new ChatInputCommand({
  global: true,
  run: async (client, interaction) => {
    // Code to run when the command is invoked.
  }
});
```

Optionally, throttle the command to avoid abuse

```javascript
module.exports = new ChatInputCommand({
  global: true,
  cooldown: {
    type: 'member' // Default cooldown type
    usages: 2, // Command can be used twice
    duration: 10 // in 10 seconds
  },
  run: async (client, interaction) => {
    // Code to run when the command is invoked.
  }
});
```

**Once again:** You only have to define the `run` function. For command configuration defaults, see [BaseConfig](https://djs.mirasaki.dev/global.html#BaseConfig "documentation") and [APICommandConfig](https://djs.mirasaki.dev/global.html#APICommandConfig "documentation")
