const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection} = require('discord.js');
const { jsonParse, translate, untranslate, getUserSettings, jsonSave} = require('../util');

const name = translate('notifications');
const description = translate('Dis-/ En-able daily login notifications.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('state'),
        description: translate('Your notification state!'),
        required: true,
        choices: [
            {
                name: 'On',
                value: 'true'
            },
            {
                name: 'Off',
                value: 'false'
            }
        ]
    }

];

async function execute(interaction) {
    const uid = interaction.user.id
    const bool = interaction.options.getString('state')

    const xD = {
        "false": false,
        "true": true
    }
    const h = interaction.options.getAttachment()
        const userSettings = getUserSettings(uid);
        userSettings.notification = ( xD[bool] ?? true);
        jsonSave('./data/users/' + uid + '.json', userSettings);
        return interaction.editReply('Your notification settings have been saved! ✅');
}
    module.exports = { name, description, options, filter, execute };