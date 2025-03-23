const { SlashCommandBuilder } = require('discord.js');
const Player = require('../../database/schemas/Player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steal')
        .setDescription('Attempt to steal tech from a facility')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Difficulty level of the heist')
                .setRequired(true)
                .addChoices(
                    { name: 'Easy (50% success)', value: 1 },
                    { name: 'Medium (25% success)', value: 2 },
                    { name: 'Hard (15% success)', value: 3 }
                )),

    async execute(interaction) {
        try {
            // Get or create player
            let player = await Player.findOne({ userId: interaction.user.id });
            if (!player) {
                player = new Player({
                    userId: interaction.user.id,
                    username: interaction.user.username
                });
                await player.save();
            }

            // Check if player can perform mission
            if (!player.canPerformMission()) {
                if (player.status.isJailed) {
                    return interaction.reply({ 
                        content: '🚔 You\'re in jail! Use `/breakout` or `/bribe` to escape.',
                        ephemeral: true 
                    });
                }
                const timeLeft = process.env.MISSION_COOLDOWN - (Date.now() - player.status.lastMission.getTime());
                return interaction.reply({ 
                    content: `⏳ You must wait ${Math.ceil(timeLeft / 1000)} seconds before stealing again!`,
                    ephemeral: true 
                });
            }

            const level = interaction.options.getInteger('level');
            const successRates = {
                1: 0.5,  // 50%
                2: 0.25, // 25%
                3: 0.15  // 15%
            };

            // Calculate success chance (factor in player's rank and vehicle)
            let successChance = successRates[level];
            successChance += (player.rank - 1) * 0.02; // Each rank adds 2% success chance

            if (player.activeVehicle) {
                const vehicle = player.inventory.vehicles.find(v => v.id === player.activeVehicle);
                if (vehicle) {
                    successChance += (vehicle.stats.stealth / 100) * 0.1; // Vehicle stealth adds up to 10% success
                }
            }

            // Attempt the heist
            const success = Math.random() < successChance;

            if (success) {
                // Calculate rewards based on level
                const baseCredits = level * 500;
                const baseExp = level * 100;
                
                player.credits += baseCredits;
                const rankUp = player.addExp(baseExp);
                player.stats.missionsCompleted += 1;
                player.status.lastMission = new Date();
                await player.save();

                let response = `🎉 Mission successful! You stole valuable tech!\n` +
                             `💰 +${baseCredits} credits\n` +
                             `⭐ +${baseExp} EXP\n`;
                
                if (rankUp) {
                    response += `🎖️ Congratulations! You reached rank ${player.rank}!`;
                }

                return interaction.reply({ content: response });
            } else {
                // Failed mission consequences
                player.stats.missionsFailed += 1;
                player.status.isJailed = true;
                player.status.jailTime = new Date(Date.now() + 1800000); // 30 minutes in jail
                player.status.lastMission = new Date();
                await player.save();

                return interaction.reply({ 
                    content: '🚨 You got caught! The facility security system detected you.\n' +
                            '🚔 You\'ve been sent to jail for 30 minutes!'
                });
            }

        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error while executing this command!',
                ephemeral: true 
            });
        }
    },
}; 