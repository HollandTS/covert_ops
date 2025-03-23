const fs = require('fs');

// Load user data from file
let userData = {};
if (fs.existsSync('users.json')) {
    userData = JSON.parse(fs.readFileSync('users.json'));
}

module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;  // Ignore if not a button interaction

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
