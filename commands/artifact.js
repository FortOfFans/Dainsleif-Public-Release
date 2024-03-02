const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi } = require('../util');
const axios = require('axios');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require('../util/PagedMessage');

const name = translate('artifact');
const description = translate('Displays an artifact set.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The artifact set to search for.'),
        required: false
    }
];

async function execute(interaction, dataToSearch){
    const aliases = jsonParse('./data/aliases/artifact.json', {});
    const query = untranslate(interaction.options.getString('name'), interaction.locale);

    const locales = {
        'en-GB': 'en',
        'en-US': 'en',
        'es-ES': 'es',
        'pt-BR': 'pt',
        'ko': 'kr',
        'ja': 'jp',
        'zh-CN': 'cns',
        'zh-TW': 'cnt'
    }
    const loc = jsonParse('./data/loc.json', {});
    const locale = locales[interaction.locale] ?? (loc[interaction.locale] ? interaction.locale : 'en');
    const { data: { data: { items }}} = await axios.get('https://api.ambr.top/v2/' + locale + '/reliquary');

    const closest = getClosest((aliases[query] ?? query), Object.values(items).map(i => i.name));

    const faila = new MessageEmbed()
        .setDescription(translate('No artifact set has been selected!'))
        .setColor('#ff2f24')

    if (!dataToSearch && (!closest || !query)){
        const Emotes  = jsonParse('./data/emojis/artifactEmojis.json', {});

        const {items: gex} = await ambrApi('/reliquary', interaction.locale);

        const list2 = Object.values(gex)
            .filter(i => i.levelList?.includes(5))
            .map(a => a.route)
            .reverse()
            .map(item => ({
                value: item,
                label: item,
                description: Object.entries(Object.values(gex).find(i => i.route === item)?.affixList)?.[0]?.[1],
                emoji: Emotes[Object.values(gex).find(i => i.name === item).id + '_4'] ?? '<:UI_ItemIcon_QUESTION:997149126032638022>'
            }));

        const listEmbed = new MessageEmbed()
            .setTitle(translate('Choose an Artifact Set', interaction.locale))
            .setColor(getUserSettings(interaction.user.id).color)

        const pages = [];
        const pageSize = 22;

        for (let i = 0; i <= list2.length; i += pageSize){
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const options = list2.slice(i, i + pageSize)
            selectMenu.addOptions(options);
            row.addComponents(selectMenu);

            pages.push({ embeds: [embed], components: [row] });
        }

        const pagedMsg = new PagedMessage(interaction, pages);
        const { message } = await pagedMsg.update();

        const filter = i => interaction.user.id === i.user.id;
        const time = 5 * 60 * 1000;
        const collector = message.createMessageComponentCollector({ filter, time });
        collector.on('collect', async i => {
            await i.deferUpdate?.().catch(() => {});

            if (i.customId !== 'itemselect') return null;

            await pagedMsg.end(false);

            const cmdOptions = [{
                name: options[0].name,
                type: 'STRING',
                value: i.values[0]
            }];

            interaction.options = new CommandInteractionOptionResolver(
                interaction.client,
                cmdOptions,
                {
                    users: new Collection(),
                    members: new Collection(),
                    roles: new Collection(),
                    channels: new Collection(),
                    messages: new Collection()
                }
            );

            interaction.client.commands.get(name).execute(interaction);
        });

        collector.on('end', collected => {
            if (collected.size === 0) interaction.editReply({embeds:[faila], components: []});
        });
        return pagedMsg;
    }

    return (() => {
        const { name, affixList, icon } = Object.values(items).find(i => dataToSearch ? i.id === dataToSearch.setId : i.name === closest);
        const embed = new MessageEmbed()
            .setTitle(name)
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(Object.entries(affixList).length === 1 ?
                translate('**1 Piece Set Bonus:** {0}', interaction.locale).replace('{0}', Object.values(affixList)[0]) :
                translate('**2 Piece Set Bonus:** {0}', interaction.locale).replace('{0}', Object.values(affixList)[0]) + '\n\n' +
                translate('**4 Piece Set Bonus:** {0}', interaction.locale).replace('{0}', Object.values(affixList)[1]))
            .setThumbnail('https://api.ambr.top/assets/UI/reliquary/' + icon.replace(/_4$/, '_' + (dataToSearch?.piece ?? 4)) + '.png');
        return interaction.editReply({ embeds: [embed] });
    })();
}

module.exports = { name, description, options, filter, execute };