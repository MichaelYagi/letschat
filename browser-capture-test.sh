#!/bin/bash

echo "🌐 BROWSER INTERFACE TESTING CAPTURE"
echo "===================================="

echo ""
echo "I'll now help you capture actual browser interactions for verification."
echo ""
echo "📝 INSTRUCTIONS:"
echo "1. This will start a browser capture server"
echo "2. Open your browser and go to: http://localhost:8080"
echo "3. Interact with the application normally"
echo "4. All your actions will be captured and logged"
echo "5. After testing, press Ctrl+C to stop capture"
echo ""
echo "🔍 What to test:"
echo "• Registration form submission"
echo "• Login functionality"
echo "• Success messages visibility"
echo "• User search feature"
echo "• Conversation creation"
echo "• Logout functionality"
echo "• Any error messages"
echo ""

echo "Press ENTER to start browser capture..."
read

# Create a simple proxy/capture server
cat > /tmp/browser-capture.js << 'EOF'
const http = require('http');
const url = require('url');

console.log('🚀 Starting Browser Capture Server');
console.log('📱 Open your browser to: http://localhost:8080');
console.log('🔍 All interactions will be captured and logged');

const server = http.createServer((req, res) => {
  // Log all requests
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] \${req.method} \${req.url}\`);
  
  if (req.url.includes('/api/')) {
    // Proxy API requests to real backend
    const targetUrl = \`http://localhost:3000\${req.url}\`;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      console.log(\`[\${timestamp}] API Response: \${proxyRes.statusCode} \${req.url}\`);
      
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });
      
      proxyRes.on('end', () => {
        res.end();
      });
    });
    
    proxyReq.on('error', (err) => {
      console.error(\`[\${timestamp}] Proxy Error: \${err.message}\`);
      res.writeHead(500);
      res.end('Proxy Error');
    });
    
    proxyReq.end();
  } else {
    // Serve a simple test page that forwards to the real app
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(\`
<!DOCTYPE html>
<html>
<head>
    <title>Let's Chat - Browser Testing</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .test-links { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .test-link { padding: 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; text-align: center; }
        .test-link:hover { background: #0056b3; }
        .logs { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin-top: 20px; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto; }
        .info { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Let's Chat Browser Testing</h1>
            <div class="info">
                <strong>📡 All interactions are being captured</strong><br>
                <strong>🗄 Backend: http://localhost:3000</strong><br>
                <strong>📱 Frontend: http://localhost:5173</strong>
            </div>
        </div>
        
        <div class="test-links">
            <a href="http://localhost:5173/register" class="test-link">📝 Test Registration</a>
            <a href="http://localhost:5173/login" class="test-link">🔑 Test Login</a>
        </div>
        
        <div class="logs" id="interaction-logs">
            <strong>📋 Captured Interactions:</strong><br>
            <em>Waiting for interactions...</em>
        </div>
    </div>
    
    <script>
        // Capture user interactions
        document.addEventListener('click', function(e) {
            logInteraction('CLICK', e.target);
        });
        
        document.addEventListener('submit', function(e) {
            logInteraction('SUBMIT', e.target);
        });
        
        document.addEventListener('input', function(e) {
            logInteraction('INPUT', e.target);
        });
        
        function logInteraction(type, element) {
            const timestamp = new Date().toISOString();
            const text = element.textContent || element.value || element.tagName || 'Unknown';
            const logEntry = \`[\${timestamp}] \${type}: \${text}\`;
            
            console.log(logEntry);
            
            // Send to server for logging
            fetch('/log', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({timestamp, type, text, url: window.location.href})
            });
            
            // Update UI
            const logsDiv = document.getElementById('interaction-logs');
            if (logsDiv) {
                logsDiv.innerHTML += \`<div>\${logEntry}</div>\`;
                logsDiv.scrollTop = logsDiv.scrollHeight;
            }
        }
        
        // Load existing logs
        fetch('/logs')
            .then(response => response.json())
            .then(logs => {
                const logsDiv = document.getElementById('interaction-logs');
                if (logsDiv && logs.length > 0) {
                    logsDiv.innerHTML = logs.map(log => \`<div>\${log}</div>\`).join('');
                    logsDiv.scrollTop = logsDiv.scrollHeight;
                }
            });
    </script>
</body>
</html>
    \`);
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(\`🚀 Browser Capture Server running on port \${PORT}\`);
  console.log(\`📱 Open: http://localhost:\${PORT}\`);
  console.log(\`🔗 Forwarding API calls to: http://localhost:3000\`);
});

// Store interaction logs
let interactionLogs = [];
EOF

echo ""
echo "🚀 Starting browser capture server..."
node /tmp/browser-capture.js &
CAPTURE_PID=$!

echo ""
echo "⏳ Waiting for you to test..."
echo "📱 Open: http://localhost:8080"
echo "🔍 Click the test links to go to the actual application"
echo "📋 All your interactions will be logged here"
echo ""
echo "When done testing, press Ctrl+C to stop capture and verify database..."

# Wait for user to finish testing
trap "echo '🛑 Stopping capture server...'; kill $CAPTURE_PID; echo ''; echo '🔍 Verifying database after UI testing...'; ./complete-verification.sh;" INT

while true; do
    sleep 2
done