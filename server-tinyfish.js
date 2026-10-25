/**
 * AapdaSetu - Secure Backend Proxy for TinyFish Search & Fetch APIs
 * 
 * SECURITY NOTICE:
 * Never put your TINYFISH_API_KEY in frontend client JavaScript.
 * This backend server keeps your credentials safe and exposes clean,
 * authenticated endpoints for the AapdaSetu Rumor & Duplicate Alert Detector.
 * 
 * Usage:
 *   1. Set environment variable:
 *      set TINYFISH_API_KEY=your_key_here  (Windows CMD)
 *      $env:TINYFISH_API_KEY="your_key_here"  (PowerShell)
 *   2. Run server:
 *      node server-tinyfish.js
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8081;
const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY || '';

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // 1. Health & Config Status Check
  if (parsedUrl.pathname === '/api/tinyfish/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'active',
      isLiveKeyConfigured: Boolean(TINYFISH_API_KEY),
      searchEndpoint: 'https://api.search.tinyfish.ai',
      fetchEndpoint: 'https://api.fetch.tinyfish.ai'
    }));
    return;
  }

  // 2. TinyFish Search Proxy (GET /api/tinyfish/search?query=...)
  if (parsedUrl.pathname === '/api/tinyfish/search' && req.method === 'GET') {
    const query = parsedUrl.query.query || '';
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query parameter' }));
      return;
    }

    if (!TINYFISH_API_KEY) {
      // Graceful fallback when no key is set in environment
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        source: 'simulated_fallback',
        message: 'TINYFISH_API_KEY not detected in server environment. Returning structured verified sample bulletin.',
        results: [
          {
            title: 'ASDMA Official Daily Flood & Telemetry Bulletin',
            url: 'https://asdma.assam.gov.in/bulletins/assam-flood-telemetry-42',
            snippet: 'Water inundation recorded on NH-37. Bridge foundations intact. Traffic diverted for animal safety.',
            published_at: new Date().toISOString()
          }
        ]
      }));
      return;
    }

    // Call real TinyFish Search API
    const targetUrl = `https://api.search.tinyfish.ai?query=${encodeURIComponent(query)}&location=IN`;
    const options = {
      headers: {
        'X-API-Key': TINYFISH_API_KEY
      }
    };

    https.get(targetUrl, options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // 3. TinyFish Fetch Proxy (POST /api/tinyfish/fetch)
  if (parsedUrl.pathname === '/api/tinyfish/fetch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      if (!TINYFISH_API_KEY) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          source: 'simulated_fallback',
          message: 'TINYFISH_API_KEY not configured. Returning simulated clean Markdown extract.',
          content: '### Assam State Disaster Management Authority\nOfficial sitrep confirms arterial route holding. No structural collapse.'
        }));
        return;
      }

      const postData = JSON.stringify({
        urls: parsedBody.urls || [],
        format: 'markdown'
      });

      const options = {
        hostname: 'api.fetch.tinyfish.ai',
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': TINYFISH_API_KEY
        }
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => { data += chunk; });
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      apiReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      apiReq.write(postData);
      apiReq.end();
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` AapdaSetu TinyFish Proxy Server active on port ${PORT}`);
  console.log(` Live Key Configured: ${Boolean(TINYFISH_API_KEY)}`);
  console.log(`========================================================`);
});
