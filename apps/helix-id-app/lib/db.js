import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read JSON file
export function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return [];
  }
  const data = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(data);
}

// Write JSON file
export function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// Agent operations
export function getAgents() {
  return readJSON('agents.json');
}

export function saveAgents(agents) {
  writeJSON('agents.json', agents);
}

export function getAgentById(id) {
  const agents = getAgents();
  return agents.find(a => a.id === id);
}

// Agent VCs
export function getAgentVCs() {
  return readJSON('agent-vcs.json');
}

export function saveAgentVCs(vcs) {
  writeJSON('agent-vcs.json', vcs);
}

export function getVCByAgentId(agentId) {
  const vcs = getAgentVCs();
  // Filter for active VCs for this agent
  const activeVcs = vcs.filter(vc => vc.agent_id === agentId && vc.status === 'active');
  
  if (activeVcs.length === 0) return null;
  
  // Sort by issued_at descending (newest first)
  activeVcs.sort((a, b) => {
    const dateA = new Date(a.issued_at || a.full_vc?.issuanceDate || 0);
    const dateB = new Date(b.issued_at || b.full_vc?.issuanceDate || 0);
    return dateB - dateA;
  });
  
  return activeVcs[0];
}

// Users
export function getUsers() {
  return readJSON('users.json');
}

export function saveUsers(users) {
  writeJSON('users.json', users);
}

export function getUserByDID(did) {
  const users = getUsers();
  return users.find(u => u.did === did);
}

// Manager DID
export function getManagerDID() {
  const data = readJSON('manager-did.json');
  if (!data || data.length === 0) {
    // Initialize with hardcoded manager DID
    const manager = {
      did: "did:helix:manager:hardcoded123",
      name: "Platform Manager",
      created_at: new Date().toISOString()
    };
    writeJSON('manager-did.json', [manager]);
    return manager;
  }
  return data[0];
}

// Activity Logs
export function getActivities() {
  const activities = readJSON('activity-log.json') || [];
  // Sort by timestamp descending (newest first)
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function logActivity({ type, description, metadata = {} }) {
  const activities = getActivities();
  const newActivity = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    description,
    ...metadata
  };
  
  // Keep only last 1000 logs to prevent file from growing too large
  const updatedActivities = [newActivity, ...activities].slice(0, 1000);
  writeJSON('activity-log.json', updatedActivities);
  return newActivity;
}
