// lib/document-loader.js - Custom document loader for DID resolution

import { createRequire } from 'module';
import { loadVc, getEd25519Context, getCredentialsV2Context, getCredentialsV1Context, getAgentPermissionsContext } from './loaders.js';

// Use CommonJS require for Hiero packages
const require = createRequire(import.meta.url);
const { resolveDID } = require('@hiero-did-sdk/resolver');

/**
 * Create a custom document loader that handles:
 * - Hedera DID resolution
 * - Ed25519 signature suite context
 * - Standard W3C contexts
 */
export async function createDocumentLoader() {
  const vcModule = await loadVc();
  const defaultDocumentLoader = vcModule.documentLoader || vcModule.defaultDocumentLoader;
  const ed25519ContextDoc = getEd25519Context();
  const credentialsV2ContextDoc = getCredentialsV2Context();
  const credentialsV1ContextDoc = getCredentialsV1Context();
  const agentPermissionsContextDoc = getAgentPermissionsContext();

  return async function documentLoader(url) {
    // Handle Ed25519 signature suite context
    if (url === 'https://w3id.org/security/suites/ed25519-2020/v1') {
      return {
        contextUrl: null,
        documentUrl: url,
        document: ed25519ContextDoc,
      };
    }

    // Handle Credentials V2 context
    if (url === 'https://www.w3.org/ns/credentials/v2') {
      return {
        contextUrl: null,
        documentUrl: url,
        document: credentialsV2ContextDoc,
      };
    }

    // Handle Credentials V1 context
    if (url === 'https://www.w3.org/2018/credentials/v1') {
      return {
        contextUrl: null,
        documentUrl: url,
        document: credentialsV1ContextDoc,
      };
    }

    // Handle Agent Permissions context
    if (url === 'https://helixid.io/contexts/agent-permissions/v1') {
      return {
        contextUrl: null,
        documentUrl: url,
        document: agentPermissionsContextDoc,
      };
    }

    // Handle Hedera DIDs
    if (url.startsWith('did:hedera:')) {
      const [did, fragment] = url.split('#');
      const didDocument = await resolveDID(did);

      // Fragment resolution (verification method lookup)
      if (fragment && didDocument.verificationMethod) {
        const vm = didDocument.verificationMethod.find((m) => m.id === `${did}#${fragment}`);

        if (!vm) {
          throw new Error(`Verification method not found: ${url}`);
        }

        return {
          contextUrl: null,
          documentUrl: url,
          document: vm,
        };
      }

      // Full DID document resolution (no fragment)
      return {
        contextUrl: null,
        documentUrl: url,
        document: didDocument,
      };
    }

    // Fallback to default document loader
    return defaultDocumentLoader(url);
  };
}
