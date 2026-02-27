// lib/crypto-utils.js - Cryptographic utility functions

import { PrivateKey } from '@hashgraph/sdk';
import bs58 from 'bs58';

/**
 * Convert Hedera private key (DER string) to multibase format
 * Required for signing VCs with @digitalbazaar libraries
 */
export function hederaPrivateKeyToMultibase(privateKeyString) {
  const privateKey = PrivateKey.fromStringDer(privateKeyString);

  // 32-byte seed
  const seed = privateKey.toBytes();
  if (seed.length !== 32) {
    throw new Error(`Expected 32-byte seed, got ${seed.length}`);
  }

  // 32-byte public key
  const publicKey = privateKey.publicKey.toBytes();
  if (publicKey.length !== 32) {
    throw new Error(`Expected 32-byte public key, got ${publicKey.length}`);
  }

  // Expand to 64 bytes: seed || publicKey
  const expandedPrivateKey = Buffer.concat([Buffer.from(seed), Buffer.from(publicKey)]);

  if (expandedPrivateKey.length !== 64) {
    throw new Error('Expanded private key must be 64 bytes');
  }

  // Ed25519 private key multicodec: 0x8026
  const multicodecPrefix = Buffer.from([0x80, 0x26]);
  const keyWithPrefix = Buffer.concat([multicodecPrefix, expandedPrivateKey]);

  return `z${bs58.encode(keyWithPrefix)}`;
}

/**
 * Extract raw Ed25519 public key from DER format
 */
export function extractPublicKeyFromDer(publicKeyDer) {
  // DER format: 302a300506032b657003210 + [32 bytes]
  const cleanHex = publicKeyDer.replace(/^0x/, '');
  return cleanHex.slice(-64); // Last 64 hex chars = 32 bytes
}
