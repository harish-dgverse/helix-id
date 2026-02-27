// lib/hedera-client.js - Hedera client configuration

import { Client, PrivateKey } from '@hashgraph/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let client = null;

/**
 * Get or create Hedera client
 * @returns {Client} Hedera client instance
 */
export function getClient() {
  if (!client) {
    const network = process.env.HEDERA_NETWORK || 'testnet';
    
    // Create client based on network
    if (network === 'mainnet') {
      client = Client.forMainnet();
    } else {
      client = Client.forTestnet();
    }
    
    // Set operator if credentials are available
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
    
    if (accountId && privateKeyStr) {
      const privateKey = PrivateKey.fromStringDer(privateKeyStr);
      client.setOperator(accountId, privateKey);
      console.log(`Hedera client initialized with account: ${accountId} on ${network}`);
    } else {
      console.warn('Hedera credentials not found in environment variables');
    }
  }
  
  return client;
}

/**
 * Close the Hedera client
 */
export function closeClient() {
  if (client) {
    client.close();
    client = null;
  }
}
