const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi, ambrLocale} = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");

const name = translate('tcg');
const description = translate('Displays any available TCG Cards in Genshin Impact.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The card to search for.'),
        required: false
    }
];

async function execute(interaction, idToSearch){
    const aliases = jsonParse('./data/aliases/card.json', {});
    const query = interaction.options.getString('name') ?? '';

    const { items } = await ambrApi('/gcg', interaction.locale);

    const list = Object.values(items)
        .filter(i => i.type === 'characterCard')
        .map(w => w.name)
        .sort();
    const closest = getClosest((aliases[query] ?? query), list);

    if (!idToSearch && (!closest || !query)) {
        const emojiMap = jsonParse('./data/emojis/TCGEmojis.json', {});

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please select a card to view its details.', interaction.locale));

        const pages = [];
        const pageSize = 25;

        for (let i = 0; i <= list.length; i += pageSize){
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const options = list.slice(i, i + pageSize)
                .map(item => ({ value: item, label: item, emoji: emojiMap[Object.values(items).find(i => i.route === item)?.id] ?? '<:UI_ItemIcon_QUESTION:997149126032638022>' }));
            selectMenu.addOptions(options);
            row.addComponents(selectMenu);

            pages.push({ embeds: [embed], components: [row] });
        }

        const pagedMsg = new PagedMessage(interaction, pages);
        const { message } = await pagedMsg.update();

        const filter = i => interaction.user.id === i.user.id;
        const time = 10 * 60 * 1000
        const collector = message.createMessageComponentCollector({ filter, time });

        collector.on('collect', async i => {
            await i.deferUpdate().catch(() => {});

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

        return null;
    }

    const { id } = Object.values(items).find(w => w.name === closest) ?? { id: idToSearch };
    const { name: itemName, description, dictionary, rank, icon, source, storyDetail, route, type, detailsItems, quote, storyTitle, talent, tags } = await ambrApi('/gcg/' + id, interaction.locale);


    function cT(text){
        return text
            .replace(/<\/?color(=#[A-F0-9]{8})?>/gi, '**')
            .replace(/\\+n/g, '\n').replace(/·/g, '**•** ')
            .replace(/\{LAYOUT_(\w)+#(\w)+/g, data => data.includes('LAYOUT_PC') ? data.split('#')[1] : '')
            .replace(/\}|#/g, '')
            .replace(/<\/?i>/g, '*')
            .replace(/{NON_BREAK_SPACE/g, '')
            .replace(/{SPRITE_PRESET210(\d)/g,  (_, num) => elemojis[({0: 'Physical', 1: 'Ice', 2: 'Water', 3: 'Fire' ,4: 'Electric', 5: 'Wind', 6: 'Rock', 7: 'Grass'}[num])])
    }

    const cc = {
        Wind: 11007437,
        Rock: 15980901,
        Electric:14596863,
        Grass: 11660073,
        Water: 582911,
        Fire: 15818755,
        Ice: 13631487
    }

    const elemap = jsonParse('./data/maps/characterElement.json', {})
        const elemojis = jsonParse('./data/emojis/elementEmojis.json', {})

    let mb = Object.values(tags)
    const embed = new MessageEmbed()
        .setTitle(cT(storyTitle))
        .setColor((cc[elemap[itemName]] ?? 16777215 ))
        .setDescription((cT(storyDetail) + '\n\n`' + mb.join('` `') + '`' ?? 'Nothing'))
        .addField('Source', cT(source))
        .setThumbnail('https://api.ambr.top/assets/UI/gcg/' + icon + '.png')
        .setFooter({text: route + ' • ' + type})

    const embed2 = new MessageEmbed()
        .setTitle(cT(storyTitle))
        .setColor((cc[elemap[itemName]] ?? 16777215 ))
        .setThumbnail('https://api.ambr.top/assets/UI/gcg/' + icon + '.png')

    const params =
    function sP2(text) {
        return text
            .replace(/Elemental Mastery|Elementarkunde|Maestría Elemental|Maîtrise élémentaire|maestria elementale|ของความชำนาญธาตุ|Tinh Thông/, translate('EM', lang))
            .replace(/\{param(\d+):(F?\d?P?I?)}/gi, (_, num, f1p) => {
                const perc = f1p.includes('P', 'I') ? '%' : '';
                if (f1p === 'F2') return Math.round(params[parseInt(num) - 1]* 100) / 100;
                if (!perc) return Math.round(params[parseInt(num) - 1]);
                else return f1p ? Math.round(params[parseInt(num) - 1] * 100 * 10) / 10 + '%' : Math.round(params[parseInt(num) - 1] * 100) + '%'
            }).split('|')
            .replace(/$[D__KEY__DAMAGE]/g, (_, num) => {})
    }



    for (const [key, value] of Object.entries(talent)) {
        let pr = value.params
        embed.addField(cT(value.name),cT(value.description.replace(/\$\[D__KEY__DAMAGE]/g, (pr?.D__KEY__DAMAGE)).replace(/\$\[D__KEY__ELEMENT]/g, pr?.D__KEY__ELEMENT).replace(/\$\[C(\d+)]/g, (_, num) => pr?.['C' + num]).replace(/\$\[K(\d+)]/g, (_, num) =>pr?.['K' + num].replace(/<\/?color(=#[A-F0-9]{8})?>/gi, '').replace(/\$\[C(\d+)]/g, (_, num) =>pr?.['C' + num]))))
    }

    for (const [key, value] of Object.entries(dictionary)) {
        let pr = value.params
        embed2.addField(cT(value.name),cT(value.description.replace(/\$\[K(\d+)]/g, (_, num) =>pr?.['K' + num].replace(/<\/?color(=#[A-F0-9]{8})?>/gi, '')).replace(/\$\[C(\d+)]/g, (_, num) =>pr?.['C' + num])))
    }

    const locale = ambrLocale(interaction.locale);

    const row = new MessageActionRow();
    const btn = new MessageButton()
        .setStyle('LINK')
        .setURL('https://ambr.top/' + locale + '/gcg/' + id)
        .setEmoji('ambr:1127674504198508674');
    row.addComponents(btn);

    const pages = [embed, embed2];
    const pagedMsg = new PagedMessage(interaction, pages.map((pg, i, arr) => ({
        ...pg,
        footer: {
            text: (pg.footer?.text ? pg.footer.text + ' • ' : '') + translate('Page {0} of {0}', interaction.locale).replace('{0}', (i + 1)).replace('{0}', arr.length),
            iconURL: pg.footer?.iconURL ?? undefined
        }
    })).map(embed => ({embeds: [embed]})));
    pagedMsg.actionRow.addComponents(btn);
    return pagedMsg.update();
}

module.exports = { name, description, options, filter, execute };