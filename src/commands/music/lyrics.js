const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { lyricsExtractor: lyricsExtractorSuper } = require('@discord-player/extractor');
const { useQueue } = require('discord-player');
const { colorResolver } = require('../../util');
const { EMBED_DESCRIPTION_MAX_LENGTH } = require('../../constants');
const { requireSessionConditions } = require('../../modules/music');
const lyricsExtractor = lyricsExtractorSuper();

module.exports = new ChatInputCommand({
  global: true,
  cooldown: {
    usages: 5,
    duration: 30,
    type: 'guild'
  },
  data: {
    description: 'Display the lyrics for a specific song',
    options: [
      {
        name: 'query-lyrics',
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        description: 'The music to search/query',
        required: false
      },
      {
        name: 'query-lyrics-no-auto-complete',
        type: ApplicationCommandOptionType.String,
        description: 'The music to search/query - doesn\'t utilize auto-complete, meaning your query won\'t be modified',
        required: false
      }
    ]
  },
  // eslint-disable-next-line sonarjs/cognitive-complexity
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;
    let query = interaction.options.getString('query-lyrics') ?? interaction.options.getString('query-lyrics-no-auto-complete') ?? useQueue(guild.id)?.currentTrack?.title;
    if (!query) {
      interaction.reply(`${ emojis.error } ${ member }, please provide a query, currently playing song can only be used when playback is active - this command has been cancelled`);
      return;
    }

    // Check state
    if (!requireSessionConditions(interaction, false, false, false)) return;

    // Let's defer the interaction as things can take time to process
    await interaction.deferReply();

    query &&= query.toLowerCase();

    try {
      const res = await lyricsExtractor
        .search(query)
        .catch(() => null);

      if (!res) {
        interaction.editReply(`${ emojis.error } ${ member }, could not find lyrics for **\`${ query }\`**, please try a different query`);
        return;
      }

      const {
        title,
        fullTitle,
        thumbnail,
        image,
        url,
        artist,
        lyrics
      } = res;

      let description = lyrics;
      if (description && description.length > EMBED_DESCRIPTION_MAX_LENGTH) description = description.slice(0, EMBED_DESCRIPTION_MAX_LENGTH - 3) + '...';

      const lyricsEmbed = new EmbedBuilder()
        .setColor(colorResolver())
        .setTitle(title ?? 'Unknown')
        .setAuthor({
          name: artist.name ?? 'Unknown',
          url: artist.url ?? null,
          iconURL: artist.image ?? null
        })
        .setDescription(description ?? 'Instrumental')
        .setURL(url);

      if (image || thumbnail) lyricsEmbed.setImage(image ?? thumbnail);
      if (fullTitle) lyricsEmbed.setFooter({ text: fullTitle });

      // Feedback
      await interaction.editReply({ embeds: [ lyricsEmbed ] });
    }
    catch (e) {
      interaction.editReply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
