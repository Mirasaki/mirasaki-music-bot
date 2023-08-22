const {
  ApplicationCommandOptionType, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { useMainPlayer } = require('discord-player');
const {
  colorResolver, dynamicInteractionReplyFn, handlePaginationButtons, getPaginationComponents
} = require('../../util');
const { queueTrackCb, requireSessionConditions } = require('../../modules/music');
const { MS_IN_ONE_MINUTE } = require('../../constants');
const logger = require('@mirasaki/logger');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Play a song. Query YouTube, search Spotify, provide a direct link, etc',
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        description: 'The music to search/query',
        required: true
      }
    ]
  },
  // eslint-disable-next-line sonarjs/cognitive-complexity
  run: async (client, interaction) => {
    const player = useMainPlayer();
    const { emojis } = client.container;
    const {
      member, guild, options
    } = interaction;
    const query = options.getString('query', true); // we need input/query to play

    // Check state
    if (!requireSessionConditions(interaction, false, false, false)) return;

    // Let's defer the interaction as things can take time to process
    await interaction.deferReply();

    try {
      // Check is valid
      const searchResult = await player
        .search(query, { requestedBy: interaction.user })
        .catch(() => null);
      if (!searchResult.hasTracks()) {
        interaction.editReply(`${ emojis.error } ${ member }, no tracks found for query \`${ query }\` - this command has been cancelled`);
        return;
      }

      // Ok, display the search results!
      const { tracks } = searchResult.toJSON();
      const usableCtx = [];
      const chunkSize = 10;
      for (let i = 0; i < tracks.length; i += chunkSize) {
        // Cut chunk
        const chunk = tracks.slice(i, i + chunkSize);
        const embed = new EmbedBuilder()
          .setColor(colorResolver())
          .setAuthor({
            name: `Search results for "${ query }"`,
            iconURL: guild.iconURL({ dynamic: true })
          });

        // Resolve string output
        const chunkOutput = chunk.map((e, ind) => queueTrackCb(e, ind + i)).join('\n');

        // Construct our embed
        embed
          .setDescription(chunkOutput ?? 'No results')
          .setImage(chunk[0]?.thumbnail)
          .setFooter({ text: `Page ${ Math.ceil((i + chunkSize) / chunkSize) } of ${
            Math.ceil(tracks.length / chunkSize)
          } (${ i + 1 }-${ Math.min(i + chunkSize, tracks.length) } / ${ tracks.length })\nClick any of the numbered buttons to directly play a song` });

        // Construct button rows
        const rows = [];
        chunk.forEach((track, ind) => {
          const rowIndex = Math.floor(ind / 5) + chunk.slice(0, ind + 1).filter((e) => e === null).length;

          // 5 components per row
          if (!rows[rowIndex]) rows[rowIndex] = new ActionRowBuilder();
          const row = rows[rowIndex];

          const { url } = track;
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`@play-button@${ member.id }@${ url.slice(0, (
                100 // max allowed len
                - 13 // @play...@
                - member.id.length // identifier
                - 1 // @
              )) }`)
              .setLabel(`${ ind + 1 }`)
              .setStyle(ButtonStyle.Primary)
          );
        });

        // Always push to usable embeds
        usableCtx.push({
          embeds: [ embed ],
          components: rows
        });
      }

      // Reply to the interaction with the SINGLE embed
      if (usableCtx.length === 1) interaction.editReply(usableCtx[0]).catch(() => { /* Void */ });
      // Properly handle pagination for multiple embeds
      else handlePagination(interaction, member, usableCtx);
    }
    catch (e) {
      interaction.editReply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});

async function handlePagination (
  interaction,
  member,
  usableCtx,
  activeDurationMs = MS_IN_ONE_MINUTE * 3,
  shouldFollowUpIfReplied = false
) {
  let pageNow = 1;
  const prevCustomId = `@page-prev@${ member.id }@${ Date.now() }`;
  const nextCustomId = `@page-next@${ member.id }@${ Date.now() }`;

  const initialCtx = {
    embeds: usableCtx[pageNow - 1].embeds,
    components: [
      ...getPaginationComponents(
        pageNow,
        usableCtx.length,
        prevCustomId,
        nextCustomId
      ),
      ...usableCtx[pageNow - 1].components
    ],
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
    embeds: usableCtx[pageNow - 1].embeds,
    components: [
      ...getPaginationComponents(
        pageNow,
        usableCtx.length,
        prevCustomId,
        nextCustomId
      ),
      ...usableCtx[pageNow - 1].components
    ]
  });

  // And finally, running code when it collects an interaction (defined as "i" in this callback)
  paginationCollector.on('collect', (i) => {
    if (handlePaginationButtons(
      i,
      member,
      pageNow,
      prevCustomId,
      nextCustomId,
      usableCtx
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
      usableCtx.length,
      prevCustomId,
      nextCustomId,
      true
    ) }).catch(() => { /* Void */ });
  });
}

