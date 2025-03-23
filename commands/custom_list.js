const { PermissionFlagsBits } = require('discord.js');

const lists = {};

module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;

        const addToListRegex = /^!(bug|idea|todo) (.+)$/;
        const showListRegex = /^!show(bugs|ideas|todos)$/;
        const strikeRegex = /^!strike (bug|idea|todo) (\d+)$/;
        const unstrikeRegex = /^!unstrike (bug|idea|todo) (\d+)$/;
        const removeRegex = /^!remove (bug|idea|todo) (\d+)$/;

        // Initialize the list for the channel if it doesn't exist
        if (!lists[message.channel.id]) {
            lists[message.channel.id] = {
                bugs: [],
                ideas: [],
                todos: []
            };
        }

        const channelLists = lists[message.channel.id];

        if (addToListRegex.test(message.content)) {
            const [, listName, listItem] = message.content.match(addToListRegex);
            channelLists[`${listName}s`].push({ text: listItem, author: message.author.username, strikethrough: false });
            message.channel.send(`Added to ${listName}: ${listItem}`);
        } else if (showListRegex.test(message.content)) {
            const [, listName] = message.content.match(showListRegex);
            const list = channelLists[`${listName}s`];
            const formattedList = list.map((item, index) => `${index + 1} - ${item.strikethrough ? `~~${item.text}~~` : item.text} - *by ${item.author}*`).join('\n');
            message.channel.send(`**${listName.charAt(0).toUpperCase() + listName.slice(1)} List**\n${formattedList}`);
        } else if (strikeRegex.test(message.content)) {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply('You do not have permission to use this command.');
            }
            const [, listName, itemNumber] = message.content.match(strikeRegex);
            const list = channelLists[`${listName}s`];
            const itemIndex = parseInt(itemNumber, 10) - 1;
            if (list[itemIndex]) {
                list[itemIndex].strikethrough = true;
                message.channel.send(`Striked through item ${itemNumber} in ${listName} list`);
            } else {
                message.channel.send(`Item ${itemNumber} not found in ${listName} list`);
            }
        } else if (unstrikeRegex.test(message.content)) {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply('You do not have permission to use this command.');
            }
            const [, listName, itemNumber] = message.content.match(unstrikeRegex);
            const list = channelLists[`${listName}s`];
            const itemIndex = parseInt(itemNumber, 10) - 1;
            if (list[itemIndex]) {
                list[itemIndex].strikethrough = false;
                message.channel.send(`Unstriked item ${itemNumber} in ${listName} list`);
            } else {
                message.channel.send(`Item ${itemNumber} not found in ${listName} list`);
            }
        } else if (removeRegex.test(message.content)) {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply('You do not have permission to use this command.');
            }
            const [, listName, itemNumber] = message.content.match(removeRegex);
            const list = channelLists[`${listName}s`];
            const itemIndex = parseInt(itemNumber, 10) - 1;
            if (list[itemIndex]) {
                list.splice(itemIndex, 1);
                message.channel.send(`Removed item ${itemNumber} from ${listName} list`);
            } else {
                message.channel.send(`Item ${itemNumber} not found in ${listName} list`);
            }
        }
    }
};