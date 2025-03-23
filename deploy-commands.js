const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log('✅ Successfully registered application commands!');
  } catch (error) {
    console.error(error);
  }
})();
