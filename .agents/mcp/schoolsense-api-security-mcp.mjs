#!/usr/bin/env node
/**
 * SchoolSense API Security & Anti-Postman MCP Server
 * Provides MCP tools for:
 *  - generate_hmac_signature: Generates HMAC-SHA256 request signing headers (timestamp, nonce, signature)
 *  - verify_hmac_signature: Validates a request signature, timestamp window (±60s), and nonce format
 *  - inspect_security_lockdown_status: Audits SchoolSense SQL & Angular files for request-signing readiness
 *  - simulate_postman_replay_attack: Runs live anti-Postman replay tests against Supabase REST/RPC endpoints
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const WORKSPACE_ROOT = '/Users/mohdrazakhan/Projects/ScholScence';
const DEFAULT_SUPABASE_URL = 'https://ayuwznogkbphpqukaoeo.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_5-moe9UnjB1y9R9AdBPVQg_SFrOU_Gs';

const TOOLS = [
  {
    name: 'generate_hmac_signature',
    description:
      'Generates SchoolSense HMAC-SHA256 request signing headers (x-schoolsense-timestamp, x-schoolsense-nonce, x-schoolsense-signature) for a given HTTP method, PostgREST path, and session signing secret.',
    inputSchema: {
      type: 'object',
      properties: {
        signingSecret: {
          type: 'string',
          description: 'Session signing secret (e.g. sig_...)',
        },
        method: {
          type: 'string',
          description: 'HTTP method (GET, POST, PATCH, DELETE)',
          default: 'POST',
        },
        requestPath: {
          type: 'string',
          description: 'PostgREST path (e.g. /rpc/whoami or /students)',
          default: '/rpc/whoami',
        },
        timestamp: {
          type: 'number',
          description: 'Optional Unix epoch timestamp in seconds (defaults to current time)',
        },
        nonce: {
          type: 'string',
          description: 'Optional custom nonce (defaults to random 32-char hex)',
        },
      },
      required: ['signingSecret'],
    },
  },
  {
    name: 'verify_hmac_signature',
    description:
      'Verifies whether a set of SchoolSense request headers (timestamp, nonce, signature) would pass the Postgres verify_request_signature() check within the ±60s replay window.',
    inputSchema: {
      type: 'object',
      properties: {
        signingSecret: { type: 'string', description: 'Session signing secret' },
        timestamp: { type: 'string', description: 'x-schoolsense-timestamp header value' },
        nonce: { type: 'string', description: 'x-schoolsense-nonce header value' },
        signature: { type: 'string', description: 'x-schoolsense-signature header value' },
        method: { type: 'string', description: 'HTTP method (e.g. POST)', default: 'POST' },
        requestPath: { type: 'string', description: 'PostgREST path (e.g. /rpc/whoami)', default: '/rpc/whoami' },
      },
      required: ['signingSecret', 'timestamp', 'nonce', 'signature'],
    },
  },
  {
    name: 'inspect_security_lockdown_status',
    description:
      'Inspects SchoolSense supabase/*.sql and frontend/src/app/core/services/supabase.service.ts to check the current state of session tokens, HMAC request signing, and nonce replay protection.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'simulate_postman_replay_attack',
    description:
      'Simulates Postman/script attacks (unsigned call, expired timestamp, tampered nonce, duplicate nonce replay) against the SchoolSense Supabase endpoint and reports results.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionToken: {
          type: 'string',
          description: 'Optional active session token (sec_...) to test against',
        },
        signingSecret: {
          type: 'string',
          description: 'Optional active signing secret (sig_...) to test against',
        },
      },
    },
  },
];

function computeSignature(secret, timestamp, nonce, method, rawPath) {
  const cleanMethod = (method || 'POST').toUpperCase();
  const cleanPath = rawPath.startsWith('/rest/v1') ? rawPath.slice('/rest/v1'.length) : rawPath;
  const canonical = `${timestamp}.${nonce}.${cleanMethod}.${cleanPath}`;
  const signature = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return { canonical, signature, cleanMethod, cleanPath };
}

async function handleToolCall(name, args = {}) {
  if (name === 'generate_hmac_signature') {
    const ts = args.timestamp ? String(args.timestamp) : String(Math.floor(Date.now() / 1000));
    const nonce = args.nonce || crypto.randomBytes(16).toString('hex');
    const { canonical, signature, cleanMethod, cleanPath } = computeSignature(
      args.signingSecret,
      ts,
      nonce,
      args.method || 'POST',
      args.requestPath || '/rpc/whoami'
    );
    return {
      method: cleanMethod,
      path: cleanPath,
      canonical,
      headers: {
        'x-schoolsense-timestamp': ts,
        'x-schoolsense-nonce': nonce,
        'x-schoolsense-signature': signature,
      },
    };
  }

  if (name === 'verify_hmac_signature') {
    const now = Math.floor(Date.now() / 1000);
    const tsNum = Number(args.timestamp);
    const driftSeconds = Math.abs(now - tsNum);
    const withinWindow = !Number.isNaN(tsNum) && driftSeconds <= 60;
    const validNonceLength = typeof args.nonce === 'string' && args.nonce.length >= 16 && args.nonce.length <= 128;
    const { canonical, signature: expectedSignature } = computeSignature(
      args.signingSecret,
      String(args.timestamp),
      String(args.nonce),
      args.method || 'POST',
      args.requestPath || '/rpc/whoami'
    );
    const signatureMatches =
      typeof args.signature === 'string' &&
      args.signature.length === expectedSignature.length &&
      args.signature.toLowerCase() === expectedSignature;

    return {
      valid: withinWindow && validNonceLength && signatureMatches,
      checks: {
        within60sWindow: withinWindow,
        driftSeconds,
        validNonceLength,
        signatureMatches,
      },
      canonical,
      expectedSignature,
    };
  }

  if (name === 'inspect_security_lockdown_status') {
    const sqlPath = path.join(WORKSPACE_ROOT, 'supabase', 'security_lockdown.sql');
    const signingSqlPath = path.join(WORKSPACE_ROOT, 'supabase', 'api_request_signing.sql');
    const supaServicePath = path.join(
      WORKSPACE_ROOT,
      'frontend',
      'src',
      'app',
      'core',
      'services',
      'supabase.service.ts'
    );

    const sqlContent = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf8') : '';
    const signingSqlContent = fs.existsSync(signingSqlPath) ? fs.readFileSync(signingSqlPath, 'utf8') : '';
    const combinedSql = sqlContent + '\n' + signingSqlContent;
    const tsContent = fs.existsSync(supaServicePath) ? fs.readFileSync(supaServicePath, 'utf8') : '';

    return {
      workspace: WORKSPACE_ROOT,
      databaseChecks: {
        hasAppSessionsTable: combinedSql.includes('create table if not exists public.app_sessions'),
        hasTokenHeaderLookup: combinedSql.includes('x-schoolsense-token'),
        hasSigningSecretColumn: combinedSql.includes('signing_secret'),
        hasNonceReplayTable: combinedSql.includes('api_request_nonces'),
        hasVerifyRequestSignatureFn: combinedSql.includes('verify_request_signature'),
      },
      frontendChecks: {
        hasSessionHeader: tsContent.includes('x-schoolsense-token'),
        hasWebCryptoHmacSigning:
          tsContent.includes('x-schoolsense-signature') &&
          (tsContent.includes('crypto.subtle') || tsContent.includes('crypto?.subtle')),
        hasTimestampAndNonceHeaders:
          tsContent.includes('x-schoolsense-timestamp') && tsContent.includes('x-schoolsense-nonce'),
      },
    };
  }

  if (name === 'simulate_postman_replay_attack') {
    const preLoginKey = 'schoolsense-client-app-v1-2026-hmac-key';
    const now = Math.floor(Date.now() / 1000);
    const replayNonce = crypto.randomBytes(16).toString('hex');
    const rpcPath = '/rpc/search_schools';
    const { signature: validPreLoginSig } = computeSignature(preLoginKey, String(now), replayNonce, 'POST', rpcPath);

    const callSearchSchools = async (label, customHeaders = {}, userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36') => {
      try {
        const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1${rpcPath}`, {
          method: 'POST',
          headers: {
            apikey: DEFAULT_SUPABASE_KEY,
            Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
            ...customHeaders,
          },
          body: JSON.stringify({ p_query: 'del' }),
        });
        const data = await res.json().catch(() => null);
        return {
          label,
          httpStatus: res.status,
          blocked: res.status >= 400,
          response: data,
        };
      } catch (e) {
        return { label, error: e.message };
      }
    };

    const expiredTs = String(now - 300);
    const expiredNonce = crypto.randomBytes(16).toString('hex');
    const { signature: expiredSig } = computeSignature(preLoginKey, expiredTs, expiredNonce, 'POST', rpcPath);

    const scenarios = [
      await callSearchSchools('1_raw_postman_no_headers', {}, 'PostmanRuntime/7.39.0'),
      await callSearchSchools('2_valid_signed_browser_request_first_call', {
        'x-schoolsense-client': 'schoolsense-web-v1',
        'x-schoolsense-timestamp': String(now),
        'x-schoolsense-nonce': replayNonce,
        'x-schoolsense-target': `POST:${rpcPath}`,
        'x-schoolsense-signature': validPreLoginSig,
      }),
      await callSearchSchools('3_devtools_copy_paste_replay_same_nonce', {
        'x-schoolsense-client': 'schoolsense-web-v1',
        'x-schoolsense-timestamp': String(now),
        'x-schoolsense-nonce': replayNonce,
        'x-schoolsense-target': `POST:${rpcPath}`,
        'x-schoolsense-signature': validPreLoginSig,
      }),
      await callSearchSchools('4_expired_timestamp_replay_minus_300s', {
        'x-schoolsense-client': 'schoolsense-web-v1',
        'x-schoolsense-timestamp': expiredTs,
        'x-schoolsense-nonce': expiredNonce,
        'x-schoolsense-target': `POST:${rpcPath}`,
        'x-schoolsense-signature': expiredSig,
      }),
      await callSearchSchools('5_tampered_signature_in_postman', {
        'x-schoolsense-client': 'schoolsense-web-v1',
        'x-schoolsense-timestamp': String(now),
        'x-schoolsense-nonce': crypto.randomBytes(16).toString('hex'),
        'x-schoolsense-target': `POST:${rpcPath}`,
        'x-schoolsense-signature': validPreLoginSig,
      }),
    ];

    return {
      endpoint: `${DEFAULT_SUPABASE_URL}/rest/v1${rpcPath}`,
      scenarios,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('Content-Length:')) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }

  const { id, method, params } = msg;

  try {
    if (method === 'initialize') {
      sendResponse(id, {
        protocolVersion: params?.protocolVersion || '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'schoolsense-api-security',
          version: '1.0.0',
        },
      });
    } else if (method === 'notifications/initialized') {
      // No response needed for notification
    } else if (method === 'ping') {
      sendResponse(id, {});
    } else if (method === 'tools/list') {
      sendResponse(id, { tools: TOOLS });
    } else if (method === 'tools/call') {
      const output = await handleToolCall(params?.name, params?.arguments || {});
      sendResponse(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
      });
    } else if (id !== undefined) {
      sendResponse(id, {});
    }
  } catch (err) {
    if (id !== undefined) {
      sendError(id, -32000, err.message || 'Tool execution failed');
    }
  }
});
