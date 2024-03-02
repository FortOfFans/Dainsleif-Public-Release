const { MessageActionRow, MessageEmbed, MessageSelectMenu, MessageButton} = require('discord.js');
const { getUserSettings, jsonSave, translate } = require('../util');

const name = translate('colour');
const description = translate('Sets the colour of embeds in command responses.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('colourcode'),
        description: translate('The colour to set.'),
        required: false
    }
];

function getColorEmbed(hex, locale){
    return new MessageEmbed()
        .setColor(parseInt(hex, 16))
        .setDescription(translate('Please select a colour to use.', locale))
        .setImage('https://singlecolorimage.com/get/' + hex + '/128x128');
}

async function execute(interaction){
    let color = interaction.options.getString('colourcode');

    async function setColor(){
        const hexString = color.replace('#', '').match(/^#?[a-f0-9]{6}$/i)?.[0];
        if (!hexString) throw new Error(translate('Failed to parse a colour with the given input.', interaction.locale));

        const embed = getColorEmbed(hexString, interaction.locale);
        embed.setDescription(translate('Your embed colour has been updated.', interaction.locale));

        const userSettings = getUserSettings(interaction.user.id);
        userSettings.color = parseInt(hexString, 16);
        jsonSave('./data/users/' + interaction.user.id + '.json', userSettings);

        return interaction.editReply({ embeds: [embed], components: [] });
    }

    //Preset colors
    if (!color){
        color = '000000';
        const colors = {
            White: ['ffffff', '966217615376777236'],
            Grey: ['b7bfc6', '841418015228559390'],
            'Dark Grey': ['333333', '966217615343243285'],
            Black: ['000000', '966217614856704001'],
            Pink: ['ec27ff', '966217615301292082'],
            Fuchsia: ['f42069', '966217614919606275'],
            Red: ['ff2f24', '966217615284535316'],
            Orange: ['ff8c1c', '841418015270371328'],
            Yellow: ['e6c74f', '841418015245205554'],
            Green: ['60bf00', '841418015228035092'],
            Blue: ['00afff', '841418015353733130'],
            Purple: ['d05cfc', '841418015118852107']
        }

        const row = new MessageActionRow();
        const menu = new MessageSelectMenu()
            .setPlaceholder(translate('Colour', interaction.locale))
            .setCustomId('color');
        for (const [ name, [ , emojiId ] ] of Object.entries(colors)){
            const label = translate(name, interaction.locale);
            const value = name;
            const emoji = 'color:' + emojiId;

            menu.addOptions({ label, value, emoji });
        }
        row.addComponents(menu);

        const row2 = new MessageActionRow();
        const btn = new MessageButton()
            .setCustomId('confirm')
            .setEmoji('✅')
            .setStyle('SUCCESS')
            .setLabel(translate('Confirm', interaction.locale));
        row2.addComponents(btn);

        const embed = getColorEmbed('000000', interaction.locale);
        const msg = await interaction.editReply({ embeds: [embed], components: [row, row2] });

        const filter = i => i.user.id === interaction.user.id;
        const time = 10 * 60 * 1000;
        const collector = msg.createMessageComponentCollector({ filter, time });

        collector.on('collect', async i => {
            await i.deferUpdate().catch(() => {});
            if (i.customId === 'confirm') {
                collector.stop();
                return setColor();
            }

            const [ name ] = i.values;
            const [ hex ] = colors[name];
            color = hex;
            const embed = getColorEmbed(hex, interaction.locale);

            await interaction.editReply({ embeds: [embed], components: [row, row2] });
        });
    } else return setColor();
}

module.exports = { name, description, options, filter, execute };