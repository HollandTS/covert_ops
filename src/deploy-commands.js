require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Load commands recursively from commands directory
function loadCommands(dir) {
    const commandFiles = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of commandFiles) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            loadCommands(filePath);
            continue;
        }

        if (!file.name.endsWith('.js')) continue;

        const command = require(filePath);
        if ('data' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

// Load all commands
loadCommands(path.join(__dirname, 'commands'));

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        process.exit(0); // Exit successfully after deploying commands
    } catch (error) {
        console.error(error);
        process.exit(1); // Exit with error if something went wrong
    }
})(); 