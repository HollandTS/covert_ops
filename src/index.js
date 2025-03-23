require('dotenv').config();
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
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
const commands = [];

// Load commands recursively from commands directory
function loadCommands(dir) {
    console.log(`Scanning directory: ${dir}`);
    const commandFiles = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of commandFiles) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            loadCommands(filePath);
            continue;
        }

        if (!file.name.endsWith('.js')) continue;

        console.log(`Loading command file: ${filePath}`);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            console.log(`Registering command: ${command.data.name}`);
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`Warning: ${filePath} is missing required properties`);
        }
    }
}

// Initialize bot
async function initializeBot() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('MongoDB connection successful');

        // Load commands
        console.log('Starting command loading...');
        loadCommands(path.join(__dirname, 'commands'));
        console.log(`Loaded ${commands.length} commands: ${commands.map(cmd => cmd.name).join(', ')}`);

        // Register commands with Discord
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        console.log('Started refreshing application (/) commands.');
        console.log(`Using CLIENT_ID: ${process.env.CLIENT_ID}`);
        console.log(`Using GUILD_ID: ${process.env.GUILD_ID}`);
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Successfully registered application commands.');

        // Login to Discord
        await client.login(process.env.DISCORD_TOKEN);

        console.log('Bot initialization completed!');
    } catch (error) {
        console.error('Error during initialization:', error);
        console.error(error.stack);
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
    if (!command) {
        console.log(`Unknown command received: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
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