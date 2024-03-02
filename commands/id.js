const { MessageEmbed } = require('discord.js');
const { getUserSettings, translate, jsonParse} = require('../util');

const name = 'id';
const description = 'Shows an item based on its ID.';
const filter = () => true;
const options = [
    {
        type: 4, //int
        name: 'id',
        description: 'The ID of the item to search',
        required: true
    }
];

async function execute(interaction){
    const searched = interaction.options.getInteger('id');

    if (10000000 < searched && searched < 10001000) return interaction.client.commands.get('characterinfo').execute(interaction, searched);
    if (11100 < searched && searched < 16000) return interaction.client.commands.get('weaponinfo').execute(interaction, searched);
	if (108000 < searched && searched < 109999) return interaction.client.commands.get('food').execute(interaction, searched);
    if (200 < searched && searched < 220100) return interaction.client.commands.get('materials').execute(interaction, searched);
    if (50001 < searched && searched < 99000) {
        const rMap = jsonParse('./data/maps/reliquaryMap.json', {});
        const itemId = searched.toString().split('');
        const setId = rMap[itemId.shift() + itemId.shift()];
        if (!setId) throw translate('Invalid artifact set ID.', interaction.locale);
        const rarity = itemId.shift();
        if (!(0 < rarity && rarity < 6)) throw translate('Invalid artifact rarity.', interaction.locale);
        const piece = itemId.shift();
        if (!(0 <= piece && piece <= 4)) throw translate('Invalid artifact piece.', interaction.locale);
        return interaction.client.commands.get('artifact').execute(interaction, { setId, rarity, piece });
    }

    throw translate('Value did not fall within the supported ranges.', interaction.locale);
}

module.exports = { name, description, options, filter, execute };