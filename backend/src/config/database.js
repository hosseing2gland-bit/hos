import mongoose from 'mongoose';
import config from './config.js';
import logger from '../utils/logger.js';

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const uri = config.isTest() ? config.mongodb.testUri : config.mongodb.uri;
      
      mongoose.set('strictQuery', false);

      this.connection = await mongoose.connect(uri, config.mongodb.options);

      logger.info(`MongoDB connected successfully to ${this.connection.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }

  async clearDatabase() {
    if (!config.isTest()) {
      throw new Error('clearDatabase can only be used in test environment');
    }
    
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    logger.info('Database cleared');
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

export default new Database();
