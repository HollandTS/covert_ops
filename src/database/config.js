const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options ensure stable connection
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection errors after initial connection
        mongoose.connection.on('error', err => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; 