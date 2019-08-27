/** @format */

const { promisify } = require('util');
const signale = require('signale');
const redis = require('redis');

// Redis setup
const client = redis.createClient({
    port: +process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: +process.env.REDIS_DATABASE
});

client.once('ready', () => {
    signale.success('Redis ready !');
});

client.on('reconnecting', (delay, attempt) => {
    signale.warn(`Reconnecting to redis... (Attempt ${attempt})`);
});

client.on('error', error => {
    signale.error('Uncaught redis error');
    signale.error(error);
});

// Promisify the used methods
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const incr = promisify(client.incr).bind(client);
// Hash sets
const hgetall = promisify(client.hgetall).bind(client);
const hmset = promisify(client.hmset).bind(client);
// Sets
const sadd = promisify(client.sadd).bind(client);
const smembers = promisify(client.smembers).bind(client);
const srem = promisify(client.srem).bind(client);

// *** User settings ***

const userSettingsKey = id => {
    return `users:${id}`;
};

const fetchUserSettings = /*async*/ id => {
    return hgetall(userSettingsKey(id));
};

const commitUserSettings = (id, settings) => {
    client.hmset(userSettingsKey(id), settings);
};

const deleteUserSettings = /*async*/ id => {
    return del(userSettingsKey(id));
};

// *** Custom Groups ***

const groupKey = id => {
    return `group:${id}`;
};

const groupSettingsKey = id => {
    return `${groupKey(id)}:setting`;
};

const groupMembersKey = id => {
    return `${groupKey(id)}:members`;
};

const groupLastIdKey = groupKey('last');

const fetchNextGroupId = /*async*/ () => {
    // Return the next id stored
    return incr(groupLastIdKey).then(id => +id);
};

const fetchGroup = /*async*/ id => {
    return Promise.all([
        hgetall(groupSettingsKey(id)),
        smembers(groupMembersKey(id))
    ]).then(([settings, members]) => {
        return { settings, members };
    });
};

const commitNewGroup = async (settings, members) => {
    // No validation, beware
    const id = await fetchNextGroupId();

    await Promise.all([
        hmset(groupSettingsKey(id), settings),
        members.length ? sadd(groupMembersKey(id), members) : Promise.resolve()
    ]);

    return id;
};

const commitGroupSettings = /*async*/ (id, settings) => {
    return hmset(groupSettingsKey(id), settings);
};

const addGroupMembers = /*async*/ (id, members) => {
    return sadd(groupMembersKey(id), members);
};

const removeGroupMembers = /*async*/ (id, members) => {
    return srem(groupMembersKey(id), members);
};

const deleteGroup = /*async*/ id => {
    return Promise.all([del(groupSettingsKey(id)), del(groupMembersKey(id))]);
};

module.exports = {
    redisClient: client,

    fetchUserSettings,
    commitUserSettings,
    deleteUserSettings,

    fetchGroup,
    commitNewGroup,
    commitGroupSettings,
    addGroupMembers,
    removeGroupMembers,
    deleteGroup
};
