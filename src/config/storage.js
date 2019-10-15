/** @format */

import { promisify } from 'util';
import signale from 'signale';
import * as redis from 'redis';

// Redis setup
export const redisClient = redis.createClient({
    port: +process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: +process.env.REDIS_DATABASE
});

redisClient.once('ready', () => {
    signale.success('Redis ready !');
});

redisClient.on('reconnecting', (delay, attempt) => {
    signale.warn(`Reconnecting to redis... (Attempt ${attempt})`);
});

redisClient.on('error', error => {
    signale.error('Uncaught redis error');
    signale.error(error);
});

// Promisify the used methods
const get = promisify(redisClient.get).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);
const incr = promisify(redisClient.incr).bind(redisClient);
const keys = promisify(redisClient.keys).bind(redisClient);
// Hash sets
const hgetall = promisify(redisClient.hgetall).bind(redisClient);
const hmset = promisify(redisClient.hmset).bind(redisClient);
// Sets
const sadd = promisify(redisClient.sadd).bind(redisClient);
const smembers = promisify(redisClient.smembers).bind(redisClient);
const srem = promisify(redisClient.srem).bind(redisClient);

// *** User settings ***

const userSettingsKey = id => {
    return `users:${id}`;
};

export const fetchUserSettings = /*async*/ id => {
    return hgetall(userSettingsKey(id));
};

export const fetchAllUserSettings = async () => {
    const userKeys = await keys('users:*');
    const settingsOnly = await Promise.all(userKeys.map(k => hgetall(k)));

    return userKeys.map((userKey, index) => ({
        user: userKey.slice(6),
        ...settingsOnly[index]
    }));
};

export const commitUserSettings = (id, settings) => {
    redisClient.hmset(userSettingsKey(id), settings);
};

export const deleteUserSettings = /*async*/ id => {
    return del(userSettingsKey(id));
};

// *** Custom Groups ***

const groupKey = id => {
    return `groups:${id}`;
};

const groupSettingsKey = id => {
    return `${groupKey(id)}:settings`;
};

const groupMembersKey = id => {
    return `${groupKey(id)}:members`;
};

const groupNextIdKey = groupKey('next');

const fetchNextGroupId = /*async*/ () => {
    // Return the next id stored
    return incr(groupNextIdKey).then(id => +id);
};

export const fetchGroup = /*async*/ id => {
    return Promise.all([
        hgetall(groupSettingsKey(id)),
        smembers(groupMembersKey(id))
    ]).then(([settings, members]) => {
        return { settings, members };
    });
};

export const commitNewGroup = async (settings, members) => {
    // No validation, beware
    const id = await fetchNextGroupId();

    await Promise.all([
        hmset(groupSettingsKey(id), settings),
        members.length ? sadd(groupMembersKey(id), members) : Promise.resolve()
    ]);

    return id;
};

export const commitGroupSettings = /*async*/ (id, settings) => {
    return hmset(groupSettingsKey(id), settings);
};

export const addGroupMembers = /*async*/ (id, members) => {
    return sadd(groupMembersKey(id), members);
};

export const removeGroupMembers = /*async*/ (id, members) => {
    return srem(groupMembersKey(id), members);
};

export const deleteGroup = /*async*/ id => {
    return Promise.all([del(groupSettingsKey(id)), del(groupMembersKey(id))]);
};
