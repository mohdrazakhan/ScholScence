#!/usr/bin/env node
/**
 * Helper script to generate signed SchoolSense headers for testing or debugging.
 * Usage:
 *   node generate-signed-headers.mjs <signing_secret> <HTTP_METHOD> <POSTGREST_PATH>
 * Example:
 *   node generate-signed-headers.mjs sig_1234567890abcdef POST /rpc/whoami
 */
import crypto from 'node:crypto';

const [, , signingSecret, rawMethod = 'POST', rawPath = '/rpc/whoami'] = process.argv;

if (!signingSecret) {
  console.error('Usage: node generate-signed-headers.mjs <signing_secret> [METHOD] [PATH]');
  process.exit(1);
}

const method = rawMethod.toUpperCase();
const path = rawPath.startsWith('/rest/v1') ? rawPath.slice('/rest/v1'.length) : rawPath;
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(16).toString('hex');
const canonical = `${timestamp}.${nonce}.${method}.${path}`;
const signature = crypto.createHmac('sha256', signingSecret).update(canonical).digest('hex');

console.log(
  JSON.stringify(
    {
      canonical,
      headers: {
        'x-schoolsense-timestamp': timestamp,
        'x-schoolsense-nonce': nonce,
        'x-schoolsense-signature': signature,
      },
    },
    null,
    2
  )
);
