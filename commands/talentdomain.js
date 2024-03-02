const {MessageButton, MessageActionRow, MessageEmbed} = require('discord.js');
const {capitalise, getUserSettings, jsonParse, jsonSave, translate, untranslate, ambrApi, getClosest} = require('../util');

const name = translate('talentdomain');
const description = translate('Sets up reminders for talent book domains.');
const filter = () => true;
const options = [];

async function execute(interaction) {
    const makeBtn = (name, emoji, customIdFn = id => id.toLowerCase()) => new MessageButton()
        .setLabel(translate(name, interaction.locale))
        .setCustomId(customIdFn(name))
        .setEmoji(emoji)
        .setStyle(2);

    const makeRow = (...items) => {
        let i = 0;
        const row = new MessageActionRow();
        while (items.length) row.addComponents(makeBtn(items.shift(), items.shift(), name => (i++) + '_'
            + name.toLowerCase()));
        return row;
    }

    const zones = {
        mondstadt: makeRow('Freedom', '882727444044460075',
            'Resistance', '882727444870725673',
            'Ballad', '882727444983971861'),
        liyue: makeRow('Prosperity', '882727446506532874',
            'Diligence', '882727446980481044',
            'Gold', '882727446762381382'),
        inazuma: makeRow(
            'Transience', '882727446921744475',
            'Elegance', '882727446489743442',
            'Light', '882727446405845023'),
        sumeru: makeRow('Admonition', '997140280346161212',
            'Ingenuity', '997140287531012198',
            'Praxis', '997140293138796574')
    }

    const embed = new MessageEmbed()
        .setTitle(translate('Talent Books Overview', interaction.locale))
        .setColor(getUserSettings(interaction.user.id).color)
        .setDescription(translate('Please select a zone for the talent books.', interaction.locale));

    const zoneRow = new MessageActionRow();
    zoneRow.addComponents(
        makeBtn('Mondstadt', '893608902149672972'),
        makeBtn('Liyue', '893608901797376030'),
        makeBtn('Inazuma', '893608901809950740'),
        makeBtn('Sumeru', '999413629235503164')
    );

    const serverRow = new MessageActionRow();
    serverRow.addComponents(
        makeBtn('America (UTC-5)', '🇺🇸', () => '-5'),
        makeBtn('Europe (UTC+1)', '🇪🇺', () => '+1'),
        makeBtn('Asia (UTC+8)', '🇨🇳', () => '+8')
    )

    const failz = new MessageEmbed()
        .setDescription(translate('No region has been selected!'))
        .setColor('#ff2f24')

    const failt = new MessageEmbed()
        .setDescription(translate('No talentbook has been selected!'))
        .setColor('#ff2f24')

    const bMsg = await interaction.editReply({embeds: [embed], components: [zoneRow]});
    const filter = press => press.user.id === interaction.user.id;
    const time = 3 * 60 * 1000;

    const zoneBtnPress = await bMsg.awaitMessageComponent({filter, time})
        .catch(() => interaction.editReply({embeds: [embed], components: []}));
    await zoneBtnPress.deferUpdate?.();
    const zone = zoneBtnPress.customId;
    if (!zone) return interaction.editReply({embeds: [failz]})

    const reminders = jsonParse('./data/reminders.json', []);
    const talentRow = new MessageActionRow(zones[zone]);
    const active = [];
    for (const btn of talentRow.components) {
        if (reminders.find(r => r.user === interaction.user.id && r.internalUse === btn.label.toLowerCase())) {
            btn.setStyle(1);
            active.push(btn.label.toLowerCase());
        }
    }
    embed.setDescription(translate('Please select a talent book.', interaction.locale) + '\n' +
        translate('Clicking a blurple button will remove your reminders for that material.', interaction.locale) + '\n' +
        translate('Clicking a grey button will schedule reminders for that material.', interaction.locale));
    await interaction.editReply({embeds: [embed], components: [talentRow]});

    const talentBtnPress = await bMsg.awaitMessageComponent({filter, time})
        .catch(() => interaction.editReply({embeds: [embed], components: []}));
    await talentBtnPress.deferUpdate?.();
    const talentBook = talentBtnPress.customId;
    if (!talentBook) return interaction.editReply({embeds: [failt]})
    const bookName = talentBook.split('_')[1];

    function cFL(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const {items: hex} = await ambrApi('/material', interaction.locale);
    const {items: gex} = await ambrApi('/avatar', interaction.locale);
    const zz = Object.entries(hex).filter(([a, b]) => ('Philosophies of ' + [cFL(bookName)]).includes(b?.route))?.[0]?.[1]
    const {avatar} = await ambrApi('/upgrade', 'static');
    const zz3 = Object.entries(avatar).filter(([a, b]) => b?.items?.[zz?.id.toString()])
    const yz = Object.entries(zz3).map(([a, b]) => b?.[0])

    let testarray = {}
    for (let i = 0; i < Object.entries(yz).length; i++) {
        const zz6 = gex[yz[i]]
        testarray[zz6?.id] = zz6?.route
    }

    if (active.includes(bookName)) {
        const reminders = jsonParse('./data/reminders.json', []);
        const filtered = reminders.filter(r => !(r.user === interaction.user.id && r.internalUse === bookName.toLowerCase()));
        jsonSave('./data/reminders.json', filtered);

        embed.setDescription(translate('Your scheduled reminders for this talent book have been removed.', interaction.locale));
    }
    else {
        embed.setDescription(translate('Please select your server time.', interaction.locale));
        embed.setImage('https://raw.githubusercontent.com/FortOfFans/GI/main/Domain%20Schedule/Talent%20Books/Talent_' + capitalise(bookName) + '.jpg');
        await interaction.editReply({embeds: [embed], components: [serverRow]});

        const serverBtnPress = await bMsg.awaitMessageComponent({filter, time})
            .catch(() => interaction.editReply({embeds: [embed], components: []}));
        await serverBtnPress.deferUpdate();
        const server = parseInt(serverBtnPress.customId);

        const today = new Date();
        const year = today.getUTCFullYear();
        let mo = today.getUTCMonth() + 1;
        let day = today.getUTCDate();

        if (mo < 10) mo = '0' + mo;
        if (day < 10) day = '0' + day;

        const reset = new Date(year + '-' + mo + '-' + day + 'T04:00:00.000Z');
        reset.setTime(-1 * server * 60 * 60 * 1000 + reset.getTime());

        const timestamps = [];
        let previous = reset;
        for (let i = 0; i < 7; i++) {
            const day = new Date(1000 * 60 * 60 * 24 + previous.getTime());
            //0 = Sunday
            if (day.getUTCDay() === 0
                || talentBook[0] === '0' && [1, 4].includes(day.getUTCDay())
                || talentBook[0] === '1' && [2, 5].includes(day.getUTCDay())
                || talentBook[0] === '2' && [3, 6].includes(day.getUTCDay())
            ) timestamps.push(Math.floor(day.getTime() / 1000));

            previous = day;
        }

        const reminders = jsonParse('./data/reminders.json', []);
        const charEmojis = jsonParse('./data/emojis/characterIdEmojis.json', {});
        for (const time of timestamps) {
            const message = {
                embeds: [
                    {
                        title: translate('Talent Books Available', interaction.locale),
                        color: getUserSettings(interaction.user.id).color,
                        description: '__' + translate('Usability:', interaction.locale) + '__\n' +
                            Object.entries(testarray).map(([a, b])=> (charEmojis[a] || '') + ' `' + b + '`').join('\n'),
                        thumbnail: {
                            url: 'https://api.ambr.top/assets/UI/' + zz?.icon + '.png'
                        },
                        footer: {
                            text: translate(capitalise(bookName), interaction.locale) + ' | ' + translate(capitalise(zone), interaction.locale)
                        }
                    }
                ]
            };

            const timestamp = time;
            const user = interaction.user.id;
            const repeat = 7 * 24 * 60 * 60;
            const internalUse = bookName;

            reminders.push({message, timestamp, user, repeat, internalUse});
        }
        jsonSave('./data/reminders.json', reminders);

        embed.setDescription(translate('Your reminders have been scheduled.', interaction.locale));
    }

    return interaction.editReply({embeds: [embed], components: []});
}

module.exports = {name, description, options, filter, execute};