const { EmbedBuilder } = require('@discordjs/builders');
const logger = require('@mirasaki/logger');
const { stripIndents } = require('common-tags/lib');
const { UserContextCommand } = require('../../classes/Commands');
const { MS_IN_ONE_SECOND } = require('../../constants');
const { colorResolver, getRelativeTime } = require('../../util');

const MAX_ROLE_DISPLAY_LENGTH = 25;

module.exports = new UserContextCommand({
  clientPerms: [ 'EmbedLinks' ],
  enabled: process.env.NODE_ENV !== 'production',
  global: false,
  cooldown: {
    usages: 1,
    duration: 5
  },
  data: { description: 'Display someone\'s account information' },

  run: async (client, interaction) => {
    // Destructure from interaction and client container
    const {
      member, targetId, guild
    } = interaction;
    const { emojis, colors } = client.container;

    // Deferring our reply
    await interaction.deferReply();

    // Fetching the target
    let targetMember;

    try {
      targetMember = await guild.members.fetch(targetId);
    }
    catch (err) {
      interaction.editReply({ content: `${ emojis.error } ${ member }, can't fetch user information for **\`${ targetId }\`**, please try again later.` });
      logger.syserr(`<User Context Menu - Info> Unable to fetch user information for ${ targetId }`);
      console.error(err.stack || err);
      return;
    }

    // Assign server profile variables
    const hasNickname = targetMember.user.username !== targetMember.displayName;
    const hasServerAvatar = targetMember.avatarURL() !== null
      && targetMember.avatarURL() !== targetMember.user.avatarURL();
    const nicknameString = hasNickname
      ? `**Nickname:** ${ targetMember.displayName }`
      : 'No active nickname';
    const serverProfileString = hasServerAvatar
      ? `${ nicknameString } | [Server Profile Avatar](${ targetMember.avatarURL({ dynamic: true }) } "${ targetMember.displayName }'s Server Avatar")`
      : nicknameString;
    const finalOutputStr = hasNickname || hasServerAvatar
      ? serverProfileString
      : `${ emojis.error } This member does **not** have their server profile set-up.`;

    // Assign Time Since variables
    const targetUser = await client.users.fetch(targetId);
    const relativeTimeSinceCreate = getRelativeTime(targetUser.createdTimestamp);
    const relativeTimeSinceJoin = getRelativeTime(targetMember.joinedTimestamp);
    const isBoosting = targetMember.premiumSinceTimestamp !== null;
    const relativeTimeSinceBoost = isBoosting
      ? getRelativeTime(targetMember.premiumSinceTimestamp)
      : 'Does **not** have a premium subscription';
    const boostString = isBoosting
      ? `Server Boosting since ${ relativeTimeSinceBoost } | <t:${ Math.round(targetMember.premiumSinceTimestamp / MS_IN_ONE_SECOND) }:d>`
      : `${ emojis.error } ${ targetMember } is **not** actively boosting the server`;

    // Building our user info embed
    const userInfoEmbed = new EmbedBuilder({
      color: colorResolver(colors.main),
      author: {
        name: targetMember.user.tag,
        icon_url: targetMember.user.avatarURL({ dynamic: true })
      },
      description: stripIndents`
        **Roles:** ${ targetMember._roles.slice(0, MAX_ROLE_DISPLAY_LENGTH).map((id) => `<@&${ id }>`)
    .join(` ${ emojis.separator } `) }
        ${ targetMember._roles.length > MAX_ROLE_DISPLAY_LENGTH ? `\nAnd ${ targetMember._roles.length - MAX_ROLE_DISPLAY_LENGTH } more...\n` : '' }
        **__Server Profile:__**
        ${ finalOutputStr }

        **__Timestamps:__**
        **Joined Server:** ${ relativeTimeSinceJoin } | <t:${ Math.round(targetMember.joinedTimestamp / MS_IN_ONE_SECOND) }>
        **Account Created:** ${ relativeTimeSinceCreate } | <t:${ Math.round(targetUser.createdTimestamp / MS_IN_ONE_SECOND) }:D>
        **Boost Status:**: ${ boostString }
        
      `,
      footer: { text: `ID: ${ targetMember.user.id }` }
    });

    // Updating our reply, displaying the requested user information
    interaction.editReply({ embeds: [ userInfoEmbed ] });
  }
});
