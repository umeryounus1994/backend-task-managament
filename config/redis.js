const redis = require('redis');
require('dotenv').config();

class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    this.client = null;
    this.isConnected = false;
    RedisClient.instance = this;
  }

  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client connected successfully.');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Redis connection error:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected. Call connect() first.');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis client disconnected.');
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;

