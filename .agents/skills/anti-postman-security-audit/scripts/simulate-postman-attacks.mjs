#!/usr/bin/env node
/**
 * Automated Postman & Script Replay Attack Simulator for SchoolSense.
 * Tests unsigned calls, valid signed request, duplicate nonce replay, expired timestamps, and forged signatures.
 */
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ayuwznogkbphpqukaoeo.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || 'sb_publishable_5-moe9UnjB1y9R9AdBPVQg_SFrOU_Gs';
const PRE_LOGIN_KEY = 'schoolsense-client-app-v1-2026-hmac-key';

function signRequest(secret, timestamp, nonce, method, path) {
  const canonical = `${timestamp}.${nonce}.${method.toUpperCase()}.${path}`;
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

async function probeSearchSchools(
  description,
  extraHeaders = {},
  userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
) {
  const rpcPath = '/rpc/search_schools';
  const url = `${SUPABASE_URL}/rest/v1${rpcPath}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': userAgent,
    ...extraHeaders,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_query: 'del' }),
    });
    const body = await res.json().catch(() => null);
    return {
      description,
      httpStatus: res.status,
      blocked: res.status >= 400,
      response: body,
    };
  } catch (err) {
    return { description, error: err.message };
  }
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const path = '/rpc/search_schools';
  const replayNonce = crypto.randomBytes(16).toString('hex');
  const validSig = signRequest(PRE_LOGIN_KEY, String(now), replayNonce, 'POST', path);

  const results = [];

  // 1. Raw Postman request without HMAC headers
  results.push(
    await probeSearchSchools('1. Raw Postman call (missing HMAC headers)', {}, 'PostmanRuntime/7.39.0')
  );

  // 2. Valid signed browser request (1st attempt — should SUCCEED with HTTP 200)
  results.push(
    await probeSearchSchools('2. Valid signed SchoolSense browser request (1st attempt)', {
      'x-schoolsense-client': 'schoolsense-web-v1',
      'x-schoolsense-timestamp': String(now),
      'x-schoolsense-nonce': replayNonce,
      'x-schoolsense-target': `POST:${path}`,
      'x-schoolsense-signature': validSig,
    })
  );

  // 3. Immediate duplicate nonce replay (simulating Copy as cURL from DevTools into Postman)
  results.push(
    await probeSearchSchools('3. Replayed DevTools request in Postman (same nonce)', {
      'x-schoolsense-client': 'schoolsense-web-v1',
      'x-schoolsense-timestamp': String(now),
      'x-schoolsense-nonce': replayNonce,
      'x-schoolsense-target': `POST:${path}`,
      'x-schoolsense-signature': validSig,
    })
  );

  // 4. Expired timestamp (-300s)
  const oldTs = String(now - 300);
  const oldNonce = crypto.randomBytes(16).toString('hex');
  results.push(
    await probeSearchSchools('4. Expired timestamp replay (-300s)', {
      'x-schoolsense-client': 'schoolsense-web-v1',
      'x-schoolsense-timestamp': oldTs,
      'x-schoolsense-nonce': oldNonce,
      'x-schoolsense-target': `POST:${path}`,
      'x-schoolsense-signature': signRequest(PRE_LOGIN_KEY, oldTs, oldNonce, 'POST', path),
    })
  );

  // 5. Tampered signature (user changed nonce in Postman without re-signing)
  results.push(
    await probeSearchSchools('5. Tampered nonce in Postman (invalid HMAC)', {
      'x-schoolsense-client': 'schoolsense-web-v1',
      'x-schoolsense-timestamp': String(now),
      'x-schoolsense-nonce': crypto.randomBytes(16).toString('hex'),
      'x-schoolsense-target': `POST:${path}`,
      'x-schoolsense-signature': validSig,
    })
  );

  console.log(JSON.stringify({ target: SUPABASE_URL, timestamp: new Date().toISOString(), results }, null, 2));
}

main();
