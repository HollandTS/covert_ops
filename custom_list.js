const { PermissionFlagsBits } = require('discord.js');

const lists = {};

module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (!message || !message.author || message.author.bot) return;

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
            const listKey = `${listName}s`;
            if (!channelLists[listKey]) {
                channelLists[listKey] = [];
            }
            channelLists[listKey].push({ text: listItem, author: message.author.username, strikethrough: false });
            message.channel.send(`Added to ${listName}: ${listItem}`);
        } else if (showListRegex.test(message.content)) {
            const [, listName] = message.content.match(showListRegex);
            const listKey = listName.toLowerCase();
            const list = channelLists[listKey];
            if (list && list.length > 0) {
                const formattedList = list.map((item, index) => `${index + 1} - ${item.strikethrough ? `~~${item.text}~~` : item.text} - *by ${item.author}*`).join('\n');
                message.channel.send(`**${listName.charAt(0).toUpperCase() + listName.slice(1)} List**\n${formattedList}`);
            } else {
                message.channel.send(`The ${listName} list is empty.`);
            }
        } else if (strikeRegex.test(message.content)) {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply('You do not have permission to use this command.');
            }
            const [, listName, itemNumber] = message.content.match(strikeRegex);
            const listKey = `${listName}s`;
            const list = channelLists[listKey];
            const itemIndex = parseInt(itemNumber, 10) - 1;
            if (list && list[itemIndex]) {
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
            const listKey = `${listName}s`;
            const list = channelLists[listKey];
            const itemIndex = parseInt(itemNumber, 10) - 1;
            if (list && list[itemIndex]) {
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
            const listKey = `${listName}s`;
            const list = channelLists[listKey];
            const itemIndex = parseInt(itemNumber, 10) - 1;
            if (list && list[itemIndex]) {
                list.splice(itemIndex, 1);
                message.channel.send(`Removed item ${itemNumber} from ${listName} list`);
            } else {
                message.channel.send(`Item ${itemNumber} not found in ${listName} list`);
            }
        }
    }
};