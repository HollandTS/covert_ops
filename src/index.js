require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const connectDB = require('./database/config');

// Create client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize commands collection
client.commands = new Collection();

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
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Initialize bot
async function initializeBot() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Load commands
        loadCommands(path.join(__dirname, 'commands'));

        // Login to Discord
        await client.login(process.env.DISCORD_TOKEN);

        console.log('Bot initialization completed!');
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errorMessage = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Start the bot
initializeBot(); 