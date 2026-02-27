import { ethers } from 'ethers';
import nacl from 'tweetnacl';

/**
 * Verify a signature (supports both ECDSA and Ed25519)
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature to verify (hex string)
 * @param {string} publicKey - Public key (hex string)
 * @returns {boolean} True if signature is valid
 */
export function verifySignature(message, signature, publicKey) {
  try {
    // Determine algorithm based on public key format
    // Ed25519 public keys are 32 bytes (64 hex chars)
    // ECDSA public keys are 65 bytes (130 hex chars, starts with 0x04)
    
    if (publicKey.startsWith('0x04')) {
      // ECDSA verification (Ethereum)
      return verifyECDSA(message, signature, publicKey);
    } else {
      // Ed25519 verification (Hedera)
      return verifyEd25519(message, signature, publicKey);
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify ECDSA signature (Ethereum)
 */
function verifyECDSA(message, signature, publicKey) {
  try {
    const messageHash = ethers.hashMessage(message);
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);
    const expectedAddress = ethers.computeAddress(publicKey);
    
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('ECDSA verification error:', error);
    return false;
  }
}

/**
 * Verify Ed25519 signature (Hedera)
 */
function verifyEd25519(message, signature, publicKey) {
  try {
    // Convert hex strings to Uint8Array
    const publicKeyBytes = hexToBytes(publicKey);
    const signatureBytes = hexToBytes(signature);
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify using tweetnacl
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Ed25519 verification error:', error);
    return false;
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex) {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Generate a challenge message for signing
 * @param {string} did - User DID
 * @returns {string} Challenge message
 */
export function generateChallenge(did) {
  const timestamp = Date.now();
  return `Sign this message to authenticate with HelixID\nDID: ${did}\nTimestamp: ${timestamp}`;
}

/**
 * Verify user authentication with signature
 * @param {string} did - User DID
 * @param {string} message - Challenge message
 * @param {string} signature - User's signature
 * @param {string} publicKey - User's public key
 * @returns {object} Verification result
 */
export function verifyUserAuth(did, message, signature, publicKey) {
  try {
    const isValid = verifySignature(message, signature, publicKey);
    
    if (isValid) {
      return {
        valid: true,
        user_did: did
      };
    } else {
      return {
        valid: false,
        error: "Invalid signature"
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}
