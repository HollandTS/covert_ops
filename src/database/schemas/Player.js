const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    credits: { type: Number, default: 1000 },
    exp: { type: Number, default: 0 },
    rank: { type: Number, default: 1 },
    stats: {
        missionsCompleted: { type: Number, default: 0 },
        missionsFailed: { type: Number, default: 0 },
        heistsCompleted: { type: Number, default: 0 },
        timesJailed: { type: Number, default: 0 }
    },
    status: {
        isJailed: { type: Boolean, default: false },
        jailTime: { type: Date },
        lastMission: { type: Date },
        lastHeist: { type: Date },
        lastBreakoutAttempt: { type: Date }
    },
    inventory: {
        vehicles: [{
            id: String,
            name: String,
            type: String,
            stats: {
                speed: Number,
                strength: Number,
                stealth: Number
            },
            condition: { type: Number, default: 100 }
        }],
        items: [{
            id: String,
            name: String,
            type: String,
            quantity: Number
        }]
    },
    activeVehicle: { type: String, default: null }  // ID of the currently equipped vehicle
}, {
    timestamps: true
});

// Add methods for game mechanics
playerSchema.methods.canPerformMission = function() {
    if (this.status.isJailed) return false;
    if (!this.status.lastMission) return true;
    
    const cooldown = process.env.MISSION_COOLDOWN || 300000; // 5 minutes default
    return Date.now() - this.status.lastMission.getTime() >= cooldown;
};

playerSchema.methods.addExp = function(amount) {
    this.exp += amount;
    // Check for rank up conditions
    const newRank = Math.floor(this.exp / 1000) + 1;
    if (newRank > this.rank) {
        this.rank = newRank;
        return true; // Indicates rank up occurred
    }
    return false;
};

module.exports = mongoose.model('Player', playerSchema); 