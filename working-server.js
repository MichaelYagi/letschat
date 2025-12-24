"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
var express_1 = require("express");
var cors_1 = require("cors");
var http_1 = require("http");
var config_1 = require("./src/config");
var app = (0, express_1.default)();
exports.app = app;
var server = (0, http_1.createServer)(app);
exports.server = server;
// Mock database
var users = new Map();
var connections = new Map();
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use(express_1.default.json());
// Simple authentication middleware
var authMiddleware = function (req, res, next) {
    var _a;
    var token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided',
        });
    }
    // Mock user from token (in real app, verify JWT)
    var mockUser = users.get(token);
    if (!mockUser) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
    req.user = mockUser;
    next();
};
// Routes
app.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.get('/api/health', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Authentication endpoints
app.post('/api/auth/register', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password, email = _a.email;
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password required',
        });
    }
    // Check if user exists
    for (var _i = 0, _b = users.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], token_1 = _c[0], user_1 = _c[1];
        if (user_1.username === username) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists',
            });
        }
    }
    var user = {
        id: 'user_' + Date.now(),
        username: username,
        email: email || '',
        status: 'offline',
    };
    var token = 'token_' + Date.now() + '_' + Math.random();
    users.set(token, user);
    res.json({
        success: true,
        data: { user: user, token: token },
    });
});
app.post('/api/auth/login', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password required',
        });
    }
    // Find user (mock authentication)
    for (var _i = 0, _b = users.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], token_2 = _c[0], user_2 = _c[1];
        if (user_2.username === username) {
            // In real app, verify password
            res.json({
                success: true,
                data: { user: user_2, token: token_2 },
            });
            return;
        }
    }
    // Auto-register for testing
    var user = {
        id: 'user_' + Date.now(),
        username: username,
        status: 'online',
    };
    var token = 'token_' + Date.now() + '_' + Math.random();
    users.set(token, user);
    res.json({
        success: true,
        data: { user: user, token: token },
    });
});
// API endpoints requiring authentication
app.get('/api/v1/connections', authMiddleware, function (req, res) {
    var userConnections = Array.from(connections.values()).filter(function (conn) { return conn.requesterId === req.user.id || conn.addresseeId === req.user.id; });
    res.json({
        success: true,
        data: userConnections,
    });
});
app.post('/api/v1/connections/request', authMiddleware, function (req, res) {
    var username = req.body.username;
    if (!username) {
        return res.status(400).json({
            success: false,
            error: 'Username is required',
        });
    }
    // Find target user
    var targetUser = null;
    for (var _i = 0, _a = users.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], token = _b[0], user = _b[1];
        if (user.username === username) {
            targetUser = user;
            break;
        }
    }
    if (!targetUser) {
        return res.status(400).json({
            success: false,
            error: 'User not found',
        });
    }
    if (targetUser.id === req.user.id) {
        return res.status(400).json({
            success: false,
            error: 'Cannot connect to yourself',
        });
    }
    // Create connection request
    var connection = {
        id: 'conn_' + Date.now(),
        requesterId: req.user.id,
        addresseeId: targetUser.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    connections.set(connection.id, connection);
    res.json({
        success: true,
        data: connection,
    });
});
app.put('/api/v1/connections/:requestId/accept', authMiddleware, function (req, res) {
    var requestId = req.params.requestId;
    var connection = connections.get(requestId);
    if (!connection) {
        return res.status(404).json({
            success: false,
            error: 'Connection request not found',
        });
    }
    if (connection.addresseeId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Cannot accept this request',
        });
    }
    connection.status = 'accepted';
    connections.set(requestId, connection);
    res.json({
        success: true,
        data: connection,
    });
});
app.put('/api/v1/connections/:requestId/reject', authMiddleware, function (req, res) {
    var requestId = req.params.requestId;
    var connection = connections.get(requestId);
    if (!connection) {
        return res.status(404).json({
            success: false,
            error: 'Connection request not found',
        });
    }
    if (connection.addresseeId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Cannot reject this request',
        });
    }
    connection.status = 'declined';
    connections.set(requestId, connection);
    res.json({
        success: true,
        data: connection,
    });
});
app.get('/api/messages/conversations', authMiddleware, function (req, res) {
    // Mock conversations data
    var mockConversations = [
        {
            id: 'conv_1',
            type: 'direct',
            participantIds: [req.user.id],
            lastMessage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];
    res.json({
        success: true,
        data: mockConversations,
    });
});
var PORT = config_1.config.port || 3000;
server.listen(PORT, function () {
    console.log("\uD83D\uDE80 Test server running on port ".concat(PORT));
    console.log("\uD83D\uDCCD Health check: http://localhost:".concat(PORT, "/health"));
    console.log("\uD83C\uDF10 Frontend URLs allowed: http://localhost:5173, http://localhost:5174");
});
// Handle server errors
server.on('error', function (error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
