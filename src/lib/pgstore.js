/**
 * The website's database access, now served by the FOLK server (Postgres).
 *
 * Same functions and shapes as 'firebase/firestore' (collection, doc, query,
 * where, getDocs, onSnapshot, runTransaction, serverTimestamp, ...), so pages
 * only changed their import. Every call goes to the server, which checks who
 * may read or write what (db/policies.js on the server).
 *
 * Live updates: the server keeps a short change feed; open listeners refetch
 * within a few seconds of a change, and straight away after your own writes.
 */
import { auth } from './firebase';
import { CONFIG } from '../config';

// ------------------------------------------------------------------ transport
export class FirestoreError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'FirestoreError';
  }
}

const CODE_BY_STATUS = {
  PERMISSION_DENIED: 'permission-denied',
  UNAUTHENTICATED: 'unauthenticated',
  INVALID_ARGUMENT: 'invalid-argument',
  ALREADY_EXISTS: 'already-exists',
  ABORTED: 'aborted',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  UNAVAILABLE: 'unavailable',
};

let authReady = null;
const waitForAuth = () => {
  if (!authReady) {
    authReady = typeof auth.authStateReady === 'function'
      ? auth.authStateReady().catch(() => {})
      : new Promise((resolve) => { const off = auth.onAuthStateChanged(() => { off(); resolve(); }); });
  }
  return authReady;
};

const call = async (fn, data) => {
  await waitForAuth();
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  let res;
  try {
    res = await fetch(`${CONFIG.BACKEND_URL}/${fn}`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ data }),
    });
  } catch {
    throw new FirestoreError('unavailable', 'Could not reach the FOLK server. Check your connection and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body.error || {};
    const code = err.code || CODE_BY_STATUS[err.status] || (res.status === 403 ? 'permission-denied' : res.status === 401 ? 'unauthenticated' : 'unknown');
    throw new FirestoreError(code, err.message || `Request failed (${res.status})`);
  }
  return body.result;
};

// ----------------------------------------------------------------- timestamps
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** A timestamp: behaves as its ISO string and has Firestore's toDate()/toMillis(). */
export class Timestamp extends String {
  static fromDate(d) { return new Timestamp(new Date(d).toISOString()); }
  static fromMillis(ms) { return new Timestamp(new Date(ms).toISOString()); }
  static now() { return new Timestamp(new Date().toISOString()); }
  toDate() { return new Date(this.toString()); }
  toMillis() { return this.toDate().getTime(); }
  get seconds() { return Math.floor(this.toMillis() / 1000); }
  get nanoseconds() { return (this.toMillis() % 1000) * 1e6; }
  isEqual(other) { return other != null && String(other) === this.toString(); }
  toJSON() { return this.toString(); }
}

const isPlain = (v) => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;

const revive = (v) => {
  if (typeof v === 'string') return ISO_RE.test(v) ? new Timestamp(v) : v;
  if (Array.isArray(v)) return v.map(revive);
  if (isPlain(v)) {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = revive(x);
    return out;
  }
  return v;
};

// Outgoing values: dates as ISO strings, sentinels as { __op }, undefined dropped.
const encode = (v) => {
  if (v === undefined) return undefined;
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v instanceof Timestamp || v instanceof String) return v.toString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof FieldPathRef) return v.path;
  if (v instanceof DocumentReference) return v.path;
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : encode(x)));
  if (typeof v === 'object') {
    if (typeof v.__op === 'string') return { ...v, v: v.v ? v.v.map(encode) : undefined };
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      const e = encode(x);
      if (e !== undefined) out[k] = e;
    }
    return out;
  }
  return null;
};

// ---------------------------------------------------------------- sentinels
export const serverTimestamp = () => ({ __op: 'serverTimestamp' });
export const increment = (n) => ({ __op: 'increment', n: Number(n) });
export const deleteField = () => ({ __op: 'delete' });
export const arrayUnion = (...v) => ({ __op: 'arrayUnion', v });
export const arrayRemove = (...v) => ({ __op: 'arrayRemove', v });

class FieldPathRef { constructor(path) { this.path = path; } }
export const documentId = () => '__name__';

// --------------------------------------------------------------- references
const DB = { type: 'folk-postgres' };
export const getFirestore = () => DB;
export const initializeFirestore = () => DB;
export const connectFirestoreEmulator = () => {};

const NAME_RE = /^[a-z][a-z0-9_]{0,62}$/;

const autoId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};

export class CollectionReference {
  constructor(name) {
    if (!NAME_RE.test(name)) throw new FirestoreError('invalid-argument', `Bad collection name: ${name}`);
    this.type = 'collection';
    this.id = name;
    this.path = name;
    this._q = { collection: name, filters: [], orders: [], limit: null };
  }
}

export class DocumentReference {
  constructor(collectionName, id) {
    if (!id || String(id).includes('/')) throw new FirestoreError('invalid-argument', `Bad document id: ${id}`);
    this.type = 'document';
    this.id = String(id);
    this.path = `${collectionName}/${this.id}`;
    this._collection = collectionName;
  }
  get parent() { return new CollectionReference(this._collection); }
}

class Query {
  constructor(q) { this.type = 'query'; this._q = q; }
}

const splitSegments = (segments) => segments.flatMap((s) => String(s).split('/')).filter(Boolean);

export const collection = (_db, ...segments) => {
  const parts = splitSegments(segments);
  if (parts.length !== 1) throw new FirestoreError('invalid-argument', 'Subcollections are not supported');
  return new CollectionReference(parts[0]);
};

export const doc = (parent, ...segments) => {
  if (parent instanceof CollectionReference) {
    return new DocumentReference(parent.id, segments.length ? segments.join('/') : autoId());
  }
  const parts = splitSegments(segments);
  if (parts.length !== 2) throw new FirestoreError('invalid-argument', `Bad document path: ${parts.join('/')}`);
  return new DocumentReference(parts[0], parts[1]);
};

export const where = (field, op, value) => ({ kind: 'where', field: field instanceof FieldPathRef ? field.path : field, op, value });
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir: String(dir).toLowerCase() === 'desc' ? 'desc' : 'asc' });
export const limit = (n) => ({ kind: 'limit', n });

export const query = (base, ...constraints) => {
  const q = { ...base._q, filters: [...base._q.filters], orders: [...base._q.orders] };
  for (const c of constraints.flat()) {
    if (!c) continue;
    if (c.kind === 'where') q.filters.push({ field: c.field, op: c.op, value: encode(c.value) });
    else if (c.kind === 'orderBy') q.orders.push({ field: c.field, dir: c.dir });
    else if (c.kind === 'limit') q.limit = c.n;
    else throw new FirestoreError('invalid-argument', `Unsupported query constraint ${c.kind}`);
  }
  return new Query(q);
};

// ---------------------------------------------------------------- snapshots
class DocumentSnapshot {
  constructor(ref, data, version) {
    this.ref = ref;
    this.id = ref.id;
    this._data = data;
    this._v = version;
    this.metadata = { hasPendingWrites: false, fromCache: false };
  }
  exists() { return this._data != null; }
  data() { return this._data == null ? undefined : revive(this._data); }
  get(field) {
    if (this._data == null) return undefined;
    return revive(String(field).split('.').reduce((o, k) => (o != null ? o[k] : undefined), this._data));
  }
}

class QuerySnapshot {
  constructor(query, docs) {
    this.query = query;
    this.docs = docs;
    this.size = docs.length;
    this.empty = docs.length === 0;
    this.metadata = { hasPendingWrites: false, fromCache: false };
  }
  forEach(fn) { this.docs.forEach(fn); }
  docChanges() { return this.docs.map((d, i) => ({ type: 'added', doc: d, oldIndex: -1, newIndex: i })); }
}

// -------------------------------------------------------------------- reads
export const getDoc = async (ref) => {
  const r = await call('dbGet', { path: ref.path });
  return new DocumentSnapshot(ref, r.exists ? r.data : null, r.v);
};

export const getDocs = async (q) => {
  const spec = q._q;
  const r = await call('dbQuery', spec);
  return new QuerySnapshot(q, r.docs.map((d) => new DocumentSnapshot(new DocumentReference(spec.collection, d.id), d.data, d.v)));
};

export const getDocFromServer = getDoc;
export const getDocsFromServer = getDocs;

export const getCountFromServer = async (q) => {
  const snap = await getDocs(q);
  return { data: () => ({ count: snap.size }) };
};

// ------------------------------------------------------------------- writes
const toWrite = (type, ref, data, options) => {
  const w = { type, path: ref.path };
  if (type !== 'delete') w.data = encode(data || {});
  if (options && options.merge) w.merge = true;
  return w;
};

const updatePatch = (dataOrField, rest) => {
  if (typeof dataOrField === 'string' || dataOrField instanceof FieldPathRef) {
    const pairs = [dataOrField, ...rest];
    const patch = {};
    for (let i = 0; i + 1 < pairs.length; i += 2) patch[pairs[i] instanceof FieldPathRef ? pairs[i].path : pairs[i]] = pairs[i + 1];
    return patch;
  }
  return dataOrField;
};

const commit = async (writes, preconditions = []) => {
  if (!writes.length) return;
  await call('dbCommit', { writes, preconditions });
  touch(writes.map((w) => w.path.split('/')[0]));
};

export const setDoc = (ref, data, options) => commit([toWrite('set', ref, data, options)]);
export const updateDoc = (ref, dataOrField, ...rest) => commit([toWrite('update', ref, updatePatch(dataOrField, rest))]);
export const deleteDoc = (ref) => commit([toWrite('delete', ref)]);
export const addDoc = async (collRef, data) => {
  const ref = doc(collRef);
  await commit([toWrite('create', ref, data)]);
  return ref;
};

export const writeBatch = () => {
  const writes = [];
  const batch = {
    set: (ref, data, options) => { writes.push(toWrite('set', ref, data, options)); return batch; },
    update: (ref, dataOrField, ...rest) => { writes.push(toWrite('update', ref, updatePatch(dataOrField, rest))); return batch; },
    delete: (ref) => { writes.push(toWrite('delete', ref)); return batch; },
    commit: () => commit(writes.splice(0)),
  };
  return batch;
};

/**
 * Like Firestore: reads remember each document's version; the commit fails
 * with 'aborted' if any of them changed meanwhile, and the whole function
 * runs again (up to 5 times).
 */
export const runTransaction = async (_db, fn, { maxAttempts = 5 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const reads = new Map();
    const writes = [];
    const tx = {
      get: async (ref) => {
        if (writes.length) throw new FirestoreError('invalid-argument', 'Transactions must read before they write.');
        const snap = await getDoc(ref);
        reads.set(ref.path, snap._v ?? null);
        return snap;
      },
      set: (ref, data, options) => { writes.push(toWrite('set', ref, data, options)); return tx; },
      update: (ref, dataOrField, ...rest) => { writes.push(toWrite('update', ref, updatePatch(dataOrField, rest))); return tx; },
      delete: (ref) => { writes.push(toWrite('delete', ref)); return tx; },
    };
    try {
      const result = await fn(tx);
      await commit(writes, [...reads].map(([path, v]) => ({ path, v })));
      return result;
    } catch (e) {
      lastError = e;
      if (e.code !== 'aborted' || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 60 * attempt + Math.random() * 120));
    }
  }
  throw lastError;
};

// ----------------------------------------------------------- live listeners
const listeners = new Set(); // { collection, run }
let feedPos = null;
let feedTimer = null;
let lastFull = Date.now();
const POLL_MIN_MS = 5000;
const POLL_MAX_MS = 20000;
// Quiet stretches back the poll off from 5s toward 20s; any change (or a
// returning tab) snaps it back, so live updates stay quick while idle tabs
// cost the server a quarter of the requests.
let pollMs = POLL_MIN_MS;
const FULL_REFRESH_MS = 60000;

// ------------------------------------------------------------ read cache
// Live listeners share one cache, so opening a screen whose data was loaded a
// moment ago paints at once and only re-asks the server when that collection
// changed (our own write or the change feed) or the copy is older than the TTL.
// Identical queries asked at the same time share a single request.
const CACHE_TTL_MS = 30000;
const CACHE_MAX = 200;
const cache = new Map(); // key -> { r, at, epoch, cv }
const inflight = new Map(); // key -> { promise, epoch, cv }
const collectionVersion = new Map();
let epoch = 0;
const versionOf = (c) => collectionVersion.get(c) || 0;

const invalidate = (cols) => {
  if (!cols) epoch += 1;
  else cols.forEach((c) => collectionVersion.set(c, versionOf(c) + 1));
};

const isFresh = (e, c) => !!e && e.epoch === epoch && e.cv === versionOf(c) && Date.now() - e.at < CACHE_TTL_MS;

const readCached = async (key, collectionName, fetcher) => {
  const hit = cache.get(key);
  if (isFresh(hit, collectionName)) return hit.r;
  const cv = versionOf(collectionName);
  const running = inflight.get(key);
  if (running && running.epoch === epoch && running.cv === cv) return running.promise;
  const entry = { epoch, cv };
  entry.promise = fetcher()
    .then((r) => {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(key, { r, at: Date.now(), epoch: entry.epoch, cv: entry.cv });
      return r;
    })
    .finally(() => { if (inflight.get(key) === entry) inflight.delete(key); });
  inflight.set(key, entry);
  return entry.promise;
};

// A different person signing in must never see the previous person's cached rows.
try { auth.onAuthStateChanged(() => { cache.clear(); inflight.clear(); epoch += 1; }); } catch { /* auth unavailable */ }

const refetch = (cols) => {
  invalidate(cols);
  for (const l of listeners) if (!cols || cols.includes(l.collection)) l.run();
};

// After our own writes: refresh listeners on those collections right away.
const touch = (cols) => { pollMs = POLL_MIN_MS; refetch([...new Set(cols)]); };

const pollFeed = async () => {
  feedTimer = null;
  if (!listeners.size) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') { schedule(); return; }
  try {
    const r = await call('dbChanges', { since: feedPos });
    const first = feedPos === null;
    feedPos = r.seq;
    if (r.reset || Date.now() - lastFull > FULL_REFRESH_MS) {
      lastFull = Date.now();
      if (!first) refetch(null);
    } else if (r.collections.length) {
      refetch(r.collections);
    }
    pollMs = r.reset || r.collections.length ? POLL_MIN_MS : Math.min(POLL_MAX_MS, Math.round(pollMs * 1.5));
  } catch {
    // Offline or server restarting: try again on the next tick.
  }
  schedule();
};

const schedule = () => {
  if (!feedTimer && listeners.size) feedTimer = setTimeout(pollFeed, pollMs);
};

if (typeof window !== 'undefined') {
  const wake = () => { if (listeners.size) { pollMs = POLL_MIN_MS; clearTimeout(feedTimer); feedTimer = null; pollFeed(); } };
  window.addEventListener('focus', wake);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
}

/**
 * onSnapshot(refOrQuery, next, error) or onSnapshot(ref, { next, error }).
 * Calls `next` with the current data, then again whenever it changes.
 */
export const onSnapshot = (target, ...args) => {
  let next;
  let error;
  const cb = args.find((a) => typeof a === 'function' || (a && typeof a === 'object' && (a.next || a.error)));
  if (typeof cb === 'function') {
    next = cb;
    error = args[args.indexOf(cb) + 1];
  } else if (cb) {
    ({ next, error } = cb);
  }
  const isDoc = target instanceof DocumentReference;
  const collectionName = isDoc ? target._collection : target._q.collection;
  let active = true;
  let running = false;
  let again = false;
  let lastJson = null;

  const key = isDoc ? `d:${target.path}` : `q:${JSON.stringify(target._q)}`;
  const fetcher = () => (isDoc ? call('dbGet', { path: target.path }) : call('dbQuery', target._q));
  const build = (r) => (isDoc
    ? new DocumentSnapshot(target, r.exists ? r.data : null, r.v)
    : new QuerySnapshot(target, r.docs.map((d) => new DocumentSnapshot(new DocumentReference(target._q.collection, d.id), d.data, d.v))));
  const publish = (snap) => {
    const json = isDoc ? JSON.stringify([snap._data, snap._v]) : JSON.stringify(snap.docs.map((d) => [d.id, d._v, d._data]));
    if (active && json !== lastJson) {
      lastJson = json;
      next && next(snap);
    }
  };

  const run = async () => {
    if (!active) return;
    if (running) { again = true; return; }
    running = true;
    try {
      // Show the last known copy straight away, then confirm it (or not) with the server.
      const known = cache.get(key);
      if (known && lastJson === null) publish(build(known.r));
      publish(build(await readCached(key, collectionName, fetcher)));
    } catch (e) {
      if (active && typeof error === 'function') error(e);
      else if (active) console.warn(`[db] listener on ${collectionName} failed:`, e.message);
    } finally {
      running = false;
      if (again) { again = false; run(); }
    }
  };

  const entry = { collection: collectionName, run };
  listeners.add(entry);
  run();
  schedule();
  return () => { active = false; listeners.delete(entry); };
};

export default DB;
