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

// Promisify the used cb methods
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const incr = promisify(client.incr).bind(client);
const hgetall = promisify(client.hgetall).bind(client);
const lpush = promisify(client.lpush).bind(client);
const lrange = promisify(client.lrange).bind(client);

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

const groupNameKey = id => {
    return `${groupKey(id)}:name`;
};

const groupMembersKey = id => {
    return `${groupKey(id)}:members`;
};

const groupLastIdKey = 'group:last';

const fetchGroupNextId = /*async*/ () => {
    // Return the next id stored, fallback to 0
    return get(groupLastIdKey).then(id => +id, err => 0);
};

const fetchGroup = /*async*/ id => {
    return Promise.all([
        get(groupNameKey(id)),
        lrange(groupMembersKey(id), 0, -1)
    ]).then(([name, members]) => {
        return { name, members };
    });
};

const commitGroup = /*async*/ group => {
    // No validation, beware
    return fetchGroupNextId().then(id => {
        return Promise.all([
            incr(groupLastIdKey),
            set(groupNameKey(id), group.name),
            lpush(groupMembersKey(id), group.members)
        ]);
    });
};

const deleteGroup = /*async*/ id => {
    return Promise.all([del(groupNameKey(id)), del(groupMembersKey(id))]);
};

module.exports = {
    redisClient: client,

    fetchUserSettings,
    commitUserSettings,
    deleteUserSettings,

    fetchGroup,
    commitGroup,
    deleteGroup
};
