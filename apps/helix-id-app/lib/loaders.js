// lib/loaders.js - Dynamic module loaders with caching

const moduleCache = {};

export async function loadEd25519VerificationKey2020() {
  if (!moduleCache.ed25519VerificationKey2020) {
    const module = await import('@digitalbazaar/ed25519-verification-key-2020');
    moduleCache.ed25519VerificationKey2020 = module.Ed25519VerificationKey2020;
  }
  return moduleCache.ed25519VerificationKey2020;
}

export async function loadEd25519Signature2020() {
  if (!moduleCache.ed25519Signature2020) {
    const module = await import('@digitalbazaar/ed25519-signature-2020');
    moduleCache.ed25519Signature2020 = module.Ed25519Signature2020;
  }
  return moduleCache.ed25519Signature2020;
}

export async function loadVc() {
  if (!moduleCache.vc) {
    moduleCache.vc = await import('@digitalbazaar/vc');
  }
  return moduleCache.vc;
}

// Inline Ed25519 context to avoid module loading issues
export function getEd25519Context() {
  return {
    "@context": {
      "id": "@id",
      "type": "@type",
      "Ed25519VerificationKey2020": {
        "@id": "https://w3id.org/security#Ed25519VerificationKey2020",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "controller": {
            "@id": "https://w3id.org/security#controller",
            "@type": "@id"
          },
          "revoked": {
            "@id": "https://w3id.org/security#revoked",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          },
          "publicKeyMultibase": {
            "@id": "https://w3id.org/security#publicKeyMultibase",
            "@type": "https://w3id.org/security#multibase"
          }
        }
      },
      "Ed25519Signature2020": {
        "@id": "https://w3id.org/security#Ed25519Signature2020",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "challenge": "https://w3id.org/security#challenge",
          "created": {
            "@id": "http://purl.org/dc/terms/created",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          },
          "domain": "https://w3id.org/security#domain",
          "expires": {
            "@id": "https://w3id.org/security#expiration",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          },
          "nonce": "https://w3id.org/security#nonce",
          "proofPurpose": {
            "@id": "https://w3id.org/security#proofPurpose",
            "@type": "@vocab",
            "@context": {
              "@protected": true,
              "id": "@id",
              "type": "@type",
              "assertionMethod": {
                "@id": "https://w3id.org/security#assertionMethod",
                "@type": "@id",
                "@container": "@set"
              },
              "authentication": {
                "@id": "https://w3id.org/security#authenticationMethod",
                "@type": "@id",
                "@container": "@set"
              }
            }
          },
          "proofValue": {
            "@id": "https://w3id.org/security#proofValue",
            "@type": "https://w3id.org/security#multibase"
          },
          "verificationMethod": {
            "@id": "https://w3id.org/security#verificationMethod",
            "@type": "@id"
          }
        }
      }
    }
  };
}

// Inline Credentials V2 context
export function getCredentialsV2Context() {
  return {
    "@context": {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "VerifiableCredential": {
        "@id": "https://www.w3.org/ns/credentials#VerifiableCredential",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "credentialSubject": {
            "@id": "https://www.w3.org/ns/credentials#credentialSubject",
            "@type": "@id"
          },
          "issuer": {
            "@id": "https://www.w3.org/ns/credentials#issuer",
            "@type": "@id"
          },
          "issuanceDate": {
            "@id": "https://www.w3.org/ns/credentials#issuanceDate",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          },
          "expirationDate": {
            "@id": "https://www.w3.org/ns/credentials#expirationDate",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          }
        }
      }
    }
  };
}

// Inline Credentials V1 context
export function getCredentialsV1Context() {
  return {
    "@context": {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "VerifiableCredential": {
        "@id": "https://www.w3.org/2018/credentials#VerifiableCredential",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "credentialSubject": {
            "@id": "https://www.w3.org/2018/credentials#credentialSubject",
            "@type": "@id"
          },
          "issuer": {
            "@id": "https://www.w3.org/2018/credentials#issuer",
            "@type": "@id"
          },
          "issuanceDate": {
            "@id": "https://www.w3.org/2018/credentials#issuanceDate",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          },
          "expirationDate": {
            "@id": "https://www.w3.org/2018/credentials#expirationDate",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
          },
          "credentialStatus": {
            "@id": "https://www.w3.org/2018/credentials#credentialStatus",
            "@type": "@id"
          }
        }
      },
      "VerifiablePresentation": {
        "@id": "https://www.w3.org/2018/credentials#VerifiablePresentation",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "holder": {
            "@id": "https://www.w3.org/2018/credentials#holder",
            "@type": "@id"
          },
          "verifiableCredential": {
            "@id": "https://www.w3.org/2018/credentials#verifiableCredential",
            "@type": "@id",
            "@container": "@graph"
          }
        }
      }
    }
  };
}

export function getAgentPermissionsContext() {
  return {
    "@context": {
      "@version": 1.1,
      "@protected": true,
      
      // Vocabulary
      "@vocab": "https://helixid.io/vocab#",
      
      // Credential Types
      "AgentPermissionCredential": "https://helixid.io/vocab#AgentPermissionCredential",
      "BookOrderingCredential": "https://helixid.io/vocab#BookOrderingCredential",
      "ShoppingCartCredential": "https://helixid.io/vocab#ShoppingCartCredential",
      
      // Properties
      "name": "https://schema.org/name",
      "permissions": {
        "@id": "https://helixid.io/vocab#permissions",
        "@container": "@set"
      },
      "scopes": {
        "@id": "https://helixid.io/vocab#scopes",
        "@container": "@set"
      },
      "allowedDomains": {
        "@id": "https://helixid.io/vocab#allowedDomains",
        "@container": "@set"
      },
      "maxOrdersPerDay": "https://helixid.io/vocab#maxOrdersPerDay",
      "constraints": "https://helixid.io/vocab#constraints"
    }
  };
}

export function clearCache() {
  Object.keys(moduleCache).forEach((key) => {
    delete moduleCache[key];
  });
}
