const { jsonParse, translate } = require('../util');
const { CommandInteractionOptionResolver, Collection } = require("discord.js");

const name = 'Account';
const filter = () => true;
const type = 2;

async function execute(interaction){
    const linked = jsonParse('./data/linked.json', {});
    if (!linked[interaction.targetId]?.[0]) throw translate('This user does not have any linked UIDs. User must link their account via `/link`!', interaction.locale);

    const resolved = {
        users: new Collection(),
        members: new Collection(),
        roles: new Collection(),
        channels: new Collection(),
        messages: new Collection()
    };

    const uid = linked[interaction.targetId][0];
    interaction.options = new CommandInteractionOptionResolver(
        interaction.client,
        [{
            name: 'uid',
            type: 'STRING',
            value: uid
        }],
        resolved
    );

    return interaction.client.commands.get('account').execute(interaction);
}

module.exports = { name, type, filter, execute };