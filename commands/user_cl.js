const {jsonParse, translate} = require('../util');
const {MessageEmbed} = require('discord.js');
const {CommandInteractionOptionResolver, Collection} = require("discord.js");
const axios = require('axios')

const name = translate('Character List');
const description = '';
const filter = () => true;
const type = 2;

async function execute(interaction) {
    const {data} = await axios.get('https://discord.com/api/v8/applications/' + interaction.client.user.id + '/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})
    const user = interaction.targetId
    const hoYo = jsonParse('./data/hoYo.json', {})

    if (!hoYo[user]) {
        return interaction.editReply({
            embeds: [new MessageEmbed().setDescription('<@' + user + '> is not in the database!' + ' <@' + user + '> should use '
                + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '> to link your hoYoLab Account with the bot!')]
        })
    }
    const resolved = {
        users: new Collection(),
        members: new Collection(),
        roles: new Collection(),
        channels: new Collection(),
        messages: new Collection()
    };

    resolved.users.set(user, await interaction.client.users.fetch(user));
    if (interaction.inGuild()) resolved.members.set(user, await interaction.guild.members.fetch(user));

    interaction.options = new CommandInteractionOptionResolver(
        interaction.client,
        [
            {
                name: 'user',
                type: 'USER',
                value: user,
                user: await interaction.client.users.fetch(user),
                member: await interaction.guild.members.fetch(user)
            }
        ],
        resolved
    );

    return interaction.client.commands.get('characterlist').execute(interaction);
}

module.exports = {name, description, type, filter, execute};