const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

// Load user data from file
let userData = {};
if (fs.existsSync('users.json')) {
    userData = JSON.parse(fs.readFileSync('users.json'));
}

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (!message.content.startsWith('$button/') || message.author.bot) return;

        const args = message.content.slice(8).split('/'); // Remove "$button/" and split arguments
        if (args.length < 4) {
            return message.reply('Incorrect format! Use: `$button/style/label/emoji/id`');
        }

        const [style, label, emoji, customId] = args;
        const buttonStyle = style.toLowerCase() === 'green' ? ButtonStyle.Success :
                            style.toLowerCase() === 'red' ? ButtonStyle.Danger :
                            style.toLowerCase() === 'blue' ? ButtonStyle.Primary :
                            ButtonStyle.Secondary; // Default to gray

        const button = new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(buttonStyle)
            .setEmoji(emoji);

        const row = new ActionRowBuilder().addComponents(button);
        await message.reply({ content: 'Here is your button:', components: [row] });
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return; // Ignore if not a button interaction

        const userId = interaction.user.id;

        // Initialize user data if it doesn't exist
        if (!userData[userId]) {
            userData[userId] = { money: 0 };
        }

        // Handle the 'money' button
        if (interaction.customId === 'money') {
            // Add 500 money to the user
            userData[userId].money += 500;

            // Save the updated user data back to the file
            fs.writeFileSync('users.json', JSON.stringify(userData, null, 2));

            // Reply to the user
            await interaction.reply(`You now have **$${userData[userId].money}**!`);
        }
    });
};
