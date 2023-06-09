# Managing permissions

- Our internal permission levels are documented [here](https://djs.mirasaki.dev/global.html#PermLevel) and supports IntelliSense auto-completion
- You can check someone's internal permission level with [#getPermissionLevel](https://djs.mirasaki.dev/module-Handler_Permissions.html#~getPermissionLevel "Documentation")
- You can resolve an internal permission level integer to the relative name with [#getPermLevelName](https://djs.mirasaki.dev/module-Handler_Permissions.html#~getPermLevelName "Documentation")
- You can easily check if someone has Discord permissions with [#hasChannelPerms](https://djs.mirasaki.dev/module-Handler_Permissions.html#~hasChannelPerms "Documentation")

```javascript
// Getting someone's internal permission level
const targetPermLevel = getPermissionLevel(clientConfig, interaction.member, interaction.channel);

// Resolving the permLevel
console.log(targetPermLevel, getPermLevelName(targetPermLevel));

// Checking if they have Administrator
const hasAdmin = hasChannelPerms(
  interaction.member.id,
  interaction.channel,
  [ 'Administrator' ]
) === true; // Returns an Array of missing permissions instead of false
```
