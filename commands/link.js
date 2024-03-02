const { MessageEmbed } = require('discord.js');
const { jsonParse, jsonSave, translate, getUserSettings} = require('../util');
const axios = require("axios");

const name = translate('link');
const description = translate('Links a UID to your Discord Account.');
const filter = () => true;
const options = [
    {
        type: 4, //int
        name: translate('uid'),
        description: translate('The UID to link to your Discord Account.'),
        required: true
    }
];

const baseUrl = 'https://enka.shinshin.moe/u/';
async function execute(interaction){
    const uid = interaction.options.getInteger('uid');
    if (!/^[125-9]\d{8}$/.test(uid)) throw 'Invalid UID.';

    await axios.get(baseUrl + uid).catch(() => { throw translate('Failed to find a user with that UID.', interaction.locale) });
    const linked = jsonParse('./data/linked.json', {});

    const userPremium = getUserSettings(interaction.user.id).premium;
    const maxAccounts = userPremium ? 4 : 1;
    if (linked[interaction.user.id]?.length >= maxAccounts) throw translate('You have already linked the maximum amount of ' +
        'UIDs to your Discord Account.', interaction.locale) + (userPremium ? '' : '\n' + translate('If you would like to ' +
        'link more accounts, you can get premium by running the `/premium` command.', interaction.locale));

    const taken = Object.values(linked).reduce((all, one) => [...all, ...one], []);
    if (taken.includes(uid)) throw translate('This account is already linked to another user. If you happen to be the owner of this UID but your previous account got hacked or you lost access to it contact: <@817570503556333588> or <@335937477997101056>', interaction.locale);

    if (!linked[interaction.user.id]) linked[interaction.user.id] = [];
    linked[interaction.user.id].push(uid);
    jsonSave('./data/linked.json', linked);

    if (interaction.guild.id === '847884308353122396') {
        const subUrl = 'https://enka.network/api/uid/';
        const {data} = (await axios.get(subUrl + uid).catch(r => {
                if (![400, 404, 424, 500, 429, 503, 522].includes(r.response.status)) return interaction.editReply( translate('Failed to find a user with that UID.', interaction.locale));
            }
        ))
        if (data?.playerInfo?.level === 60) {
            let role = interaction.guild.roles.cache.find(r => r.name === "AR 60 (members)");
            let member = interaction.guild.members.fetch(interaction.user?.id)
            interaction.member.roles.add(role?.id).catch()
        }
    }

    const embed = new MessageEmbed()
        .setColor(0x55FF55)
        .setDescription('✅ ' + translate('**{0}** has been linked to your Discord account.', interaction.locale).replace('{0}', uid));

    if (linked[interaction.user.id].length > 1) embed.setDescription(embed.description + '\n' +
        translate('You can now use **{0}** in place of this UID.', interaction.locale)
            .replace('{0}', linked[interaction.user.id].length));

    return interaction.editReply({ embeds: [embed] });
}

module.exports = { name, description, options, filter, execute };