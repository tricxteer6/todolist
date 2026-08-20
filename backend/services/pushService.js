const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const dataDir = path.join(__dirname, '..', '..', 'data');
const subscriptionsFile = path.join(dataDir, 'push-subscriptions.json');

function configured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

function configure() {
  if (configured()) webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

function readSubscriptions() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(subscriptionsFile)) return [];
  try { return JSON.parse(fs.readFileSync(subscriptionsFile, 'utf8')); } catch (_error) { return []; }
}

function writeSubscriptions(subscriptions) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
}

function saveSubscription(subscription, userId) {
  const subscriptions = readSubscriptions();
  const exists = subscriptions.some((item) => item.endpoint === subscription.endpoint);
  if (exists) {
    const updated = subscriptions.map((item) => item.endpoint === subscription.endpoint ? { ...item, userId } : item);
    writeSubscriptions(updated);
  } else { subscriptions.push({ ...subscription, userId }); writeSubscriptions(subscriptions); }
}

function removeSubscription(endpoint) {
  writeSubscriptions(readSubscriptions().filter((item) => item.endpoint !== endpoint));
}

async function sendToAll(payload, userId = null) {
  configure();
  if (!configured()) throw new Error('Web Push VAPID keys are not configured.');
  const subscriptions = readSubscriptions().filter((item) => userId === null || Number(item.userId) === Number(userId));
  const results = await Promise.all(subscriptions.map(async (subscription) => {
    try { await webpush.sendNotification(subscription, JSON.stringify(payload)); return true; }
    catch (error) { console.error(`Push delivery failed (${error.statusCode || 'unknown'}):`, error); if ([403, 404, 410].includes(error.statusCode)) removeSubscription(subscription.endpoint); return false; }
  }));
  return results.filter(Boolean).length;
}

module.exports = { configured, readSubscriptions, saveSubscription, sendToAll };
