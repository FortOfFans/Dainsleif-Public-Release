const { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate } = require('../util');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');

const name = 'dailies';
const description = translate('Claims hoYolab Daily Login & redeem codes for you!');
const filter = () => true;

async function execute(interaction){
}

module.exports = { name, description, filter, execute };