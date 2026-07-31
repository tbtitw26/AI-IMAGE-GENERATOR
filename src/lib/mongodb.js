import dns from 'dns';
import { MongoClient } from 'mongodb';

// Force IPv4 DNS — needed on some Windows environments
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const srvUri = process.env.MONGODB_URI;

if (!srvUri) {
  throw new Error('Please define MONGODB_URI in your .env.local file');
}

const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  tls: true,
  authSource: 'admin',
};

/**
 * Resolve a mongodb+srv:// URI to a standard mongodb:// URI
 * using Google DoH (DNS over HTTPS) to avoid system DNS issues on Windows.
 */
async function resolveAtlasUri(srvUri) {
  if (!srvUri.startsWith('mongodb+srv://')) {
    return srvUri;
  }

  // Parse credentials and hostname from srv URI
  // e.g. mongodb+srv://user:pass@cluster0.xxx.mongodb.net/DB?appName=App
  const withoutScheme = srvUri.slice('mongodb+srv://'.length);
  const atIdx = withoutScheme.lastIndexOf('@');
  const credentials = atIdx >= 0 ? withoutScheme.slice(0, atIdx) : '';
  const afterAt = atIdx >= 0 ? withoutScheme.slice(atIdx + 1) : withoutScheme;
  const slashIdx = afterAt.indexOf('/');
  const hostname = slashIdx >= 0 ? afterAt.slice(0, slashIdx) : afterAt;
  const rest = slashIdx >= 0 ? afterAt.slice(slashIdx) : '';

  // Use Google DoH to resolve SRV records
  const srvName = `_mongodb._tcp.${hostname}`;
  const srvRes = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(srvName)}&type=SRV`
  );
  const srvJson = await srvRes.json();
  const srvAnswers = (srvJson.Answer || [])
    .map((a) => {
      const parts = a.data?.split(' ');
      if (!parts || parts.length < 4) return null;
      return {
        port: parts[2],
        name: parts[3].replace(/\.$/, ''), // remove trailing dot
      };
    })
    .filter(Boolean);

  if (srvAnswers.length === 0) {
    throw new Error(`Cannot resolve SRV for ${hostname}`);
  }

  const hosts = srvAnswers.map((s) => `${s.name}:${s.port}`).join(',');

  // Use Google DoH to get TXT records (authSource, replicaSet etc.)
  const txtRes = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=TXT`
  ).catch(() => null);
  const params = new URLSearchParams();
  params.set('tls', 'true');
  params.set('authSource', 'admin');
  params.set('replicaSet', 'atlas-2z9o8q-shard-0');
  params.set('retryWrites', 'true');
  params.set('w', 'majority');

  if (txtRes?.ok) {
    const txtJson = await txtRes.json();
    for (const answer of txtJson.Answer || []) {
      const text = answer.data?.replace(/^"|"$/g, '') || '';
      for (const part of text.split('&')) {
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
          const k = part.slice(0, eqIdx);
          const v = part.slice(eqIdx + 1);
          params.set(k, v);
        }
      }
    }
  }

  const authPart = credentials ? `${credentials}@` : '';
  return `mongodb://${authPart}${hosts}${rest}?${params.toString()}`;
}

let clientPromise;

async function buildClient() {
  let uri = srvUri;
  try {
    uri = await resolveAtlasUri(srvUri);
    console.log('[MongoDB] Resolved URI via DoH successfully.');
  } catch (err) {
    console.warn('[MongoDB] DoH resolution failed, using original URI.', err.message);
  }
  const c = new MongoClient(uri, mongoOptions);
  return c.connect();
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = buildClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = buildClient();
}

/**
 * Returns { client, db } connected to MongoDB Atlas.
 */
export async function connectToDatabase() {
  const connectedClient = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME || 'AI-IMAGE-GENERATOR';
  const db = connectedClient.db(dbName);
  return { client: connectedClient, db };
}

export default clientPromise;
