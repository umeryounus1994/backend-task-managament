const redisClient = require('../config/redis');

const getCache = async (key) => {
  try {
    const client = redisClient.getClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const setCache = async (key, value, expirationInSeconds = 3600) => {
  try {
    const client = redisClient.getClient();
    await client.setEx(key, expirationInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const deleteCache = async (key) => {
  try {
    const client = redisClient.getClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

const deleteCachePattern = async (pattern) => {
  try {
    const client = redisClient.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    return false;
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern
};

