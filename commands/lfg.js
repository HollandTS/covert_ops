const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const activeLFGs = new Map(); // Stores LFGs { messageID: { hostID, game, desc, maxPlayers, players: [] } }

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lfg')
		.setDescription('Create a Looking For Group session')
		.addStringOption(option => option.setName('game')
			.setDescription('Enter the game or mod name')
			.setRequired(true))
		.addIntegerOption(option => option.setName('maxplayers') // ✅ Move required option before non-required
			.setDescription('Enter the max number of players (2-8)')
			.setRequired(true))
		.addStringOption(option => option.setName('description') // ✅ Non-required comes last
			.setDescription('Optional: Add a description')
			.setRequired(false)),

    async execute(interaction) {
        const game = interaction.options.getString('game');
        const desc = interaction.options.getString('description') || 'No description provided.';
        const maxPlayers = interaction.options.getInteger('maxplayers');

        // Ensure max players is within range
        if (maxPlayers < 2 || maxPlayers > 8) {
            return interaction.reply({ content: 'Max players must be between 2 and 8.', ephemeral: true });
        }

        // Check if the user already has an active LFG
        if ([...activeLFGs.values()].some(lfg => lfg.hostID === interaction.user.id)) {
            return interaction.reply({ content: 'You already have an active LFG session. Close it first.', ephemeral: true });
        }

        // Create LFG embed
        const embed = new EmbedBuilder()
            .setTitle(`🎮 LFG: ${game}`)
            .setDescription(`Join this game and play with others!`)
            .addFields(
                { name: '👑 Host:', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📋 Description:', value: desc, inline: false },
                { name: '👥 Max Players:', value: `${maxPlayers}`, inline: true },
                { name: '🛠 Player Slots:', value: `1️⃣ **${interaction.user.username} (Host)**\n${'🔹 Open Slot\n'.repeat(maxPlayers - 1)}`, inline: false }
            )
            .setFooter({ text: 'Click the buttons below to join or leave.' })
            .setColor(0x00FF00);

        // Create buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('join_lfg').setLabel('✅ Join LFG').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('leave_lfg').setLabel('❌ Leave LFG').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('close_lfg').setLabel('🛑 Close LFG').setStyle(ButtonStyle.Secondary)
            );

        // Send embed with buttons
        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Store LFG session
        activeLFGs.set(message.id, {
            hostID: interaction.user.id,
            game,
            desc,
            maxPlayers,
            players: [{ id: interaction.user.id, username: interaction.user.username }]
        });

        // Auto-delete LFG after 30 minutes if inactive
        setTimeout(() => {
            if (activeLFGs.has(message.id)) {
                message.delete().catch(console.error);
                activeLFGs.delete(message.id);
            }
        }, 1800000);
    }
};

// Button Interaction Handling
module.exports.buttonHandler = async (interaction) => {
    const lfg = activeLFGs.get(interaction.message.id);
    if (!lfg) return interaction.reply({ content: 'This LFG session no longer exists.', ephemeral: true });

    if (interaction.customId === 'join_lfg') {
        if (lfg.players.some(p => p.id === interaction.user.id)) {
            return interaction.reply({ content: 'You are already in this LFG session.', ephemeral: true });
        }
        if (lfg.players.length >= lfg.maxPlayers) {
            return interaction.reply({ content: 'This LFG session is full!', ephemeral: true });
        }

        lfg.players.push({ id: interaction.user.id, username: interaction.user.username });

        await updateLFGEmbed(interaction.message, lfg);
        return interaction.reply({ content: `You joined the LFG for **${lfg.game}**!`, ephemeral: true });
    }

    if (interaction.customId === 'leave_lfg') {
        if (!lfg.players.some(p => p.id === interaction.user.id)) {
            return interaction.reply({ content: 'You are not in this LFG session.', ephemeral: true });
        }

        lfg.players = lfg.players.filter(p => p.id !== interaction.user.id);
        await updateLFGEmbed(interaction.message, lfg);
        return interaction.reply({ content: `You left the LFG for **${lfg.game}**.`, ephemeral: true });
    }

    if (interaction.customId === 'close_lfg') {
        if (interaction.user.id !== lfg.hostID) {
            return interaction.reply({ content: 'Only the LFG host can close this session.', ephemeral: true });
        }

        await interaction.message.delete().catch(console.error);
        activeLFGs.delete(interaction.message.id);
        return interaction.reply({ content: `LFG for **${lfg.game}** has been closed.`, ephemeral: true });
    }
};

// Function to Update LFG Embed
async function updateLFGEmbed(message, lfg) {
    const embed = new EmbedBuilder()
        .setTitle(`🎮 LFG: ${lfg.game}`)
        .setDescription(`Join this game and play with others!`)
        .addFields(
            { name: '👑 Host:', value: `<@${lfg.hostID}>`, inline: true },
            { name: '📋 Description:', value: lfg.desc, inline: false },
            { name: '👥 Max Players:', value: `${lfg.maxPlayers}`, inline: true },
            { name: '🛠 Player Slots:', value: lfg.players.map((p, i) => `${i + 1}️⃣ **${p.username}**`).join('\n') + '\n' + '🔹 Open Slot\n'.repeat(lfg.maxPlayers - lfg.players.length), inline: false }
        )
        .setFooter({ text: 'Click the buttons below to join or leave.' })
        .setColor(0x00FF00);

    await message.edit({ embeds: [embed] });
}
