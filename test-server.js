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
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use(express_1.default.json());
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
// Mock API endpoints for testing
app.get('/api/v1/connections', function (req, res) {
    res.json({
        success: true,
        data: [],
        message: 'No token provided - would normally return user connections',
    });
});
app.post('/api/v1/connections/request', function (req, res) {
    res.json({
        success: true,
        data: {
            id: 'mock-id',
            status: 'pending',
            username: req.body.username || 'unknown',
        },
    });
});
app.get('/api/messages/conversations', function (req, res) {
    res.json({
        success: true,
        data: [],
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
