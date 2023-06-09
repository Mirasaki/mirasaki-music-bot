const logger = require('@mirasaki/logger');
const { MessageContextCommand } = require('../../classes/Commands');
const { EMBED_DESCRIPTION_MAX_LENGTH } = require('../../constants');
const { colorResolver } = require('../../util');

module.exports = new MessageContextCommand({
  clientPerms: [ 'EmbedLinks' ],
  enabled: process.env.NODE_ENV !== 'production',
  global: false,
  cooldown: {
    // Use guild type cooldown instead of default member
    type: 'guild',
    usages: 2,
    duration: 30
  },
  data: { description: 'Display raw JSON for embeds attached to a message' },

  run: async (client, interaction) => {
    // Destructure from interaction and client container
    const {
      member, targetId, channel
    } = interaction;
    const { emojis, colors } = client.container;

    // Deferring our reply
    await interaction.deferReply();

    // Fetching the target
    let targetMessage;

    try {
      targetMessage = await channel.messages.fetch(targetId);
    }
    catch (err) {
      interaction.editReply({ content: `${ emojis.error } ${ member }, can't fetch message **\`${ targetId }\`**, please try again later.` });
      logger.syserr(`<Message Context Menu - Info> Unable to fetch message ${ targetId }`);
      console.error(err.stack || err);
      return;
    }

    // Check Missing content intent
    // missing the \`messages.read\` scope in this server or the \`GuildMessages\` gateway intent
    const contentHidden = targetMessage.content === '' && !('embeds' in targetMessage);

    if (contentHidden) {
      interaction.editReply({ content: `${ emojis.error } ${ member }, I don't have permission to read that message.` });
      return;
    }

    // Check has embed
    const msgHasEmbed = ('embeds' in targetMessage) && Array.isArray(targetMessage.embeds) && targetMessage.embeds[0];

    if (!msgHasEmbed) {
      interaction.editReply({ content: `${ emojis.error } ${ member }, I can't find any embeds attached to this message. I might not have permission to read the message contents.` });
      return;
    }


    // Print the embed to the member
    interaction.editReply({ embeds: targetMessage.embeds.map((embedData) => {
      // Getting our JSON string
      const jsonStr = `\`\`\`json\n${ JSON.stringify(embedData, null, 4)?.replace(/```/g, '\\`\\`\\`') }\n\`\`\``;

      return {
        description: jsonStr.length > EMBED_DESCRIPTION_MAX_LENGTH
          ? jsonStr.slice(0, EMBED_DESCRIPTION_MAX_LENGTH)
          : jsonStr,
        color: colorResolver(colors.main)
      };
    }) });
  }
});
