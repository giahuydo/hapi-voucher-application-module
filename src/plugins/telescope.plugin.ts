import { Plugin, Server } from '@hapi/hapi';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { EventEmitter } from 'events';

interface RequestLog {
  id: string;
  method: string;
  url: string;
  headers: any;
  payload: any;
  query: any;
  params: any;
  timestamp: Date;
  response?: {
    statusCode: number;
    headers: any;
    payload: any;
    responseTime: number;
  };
  user?: {
    id: string;
    email: string;
  };
}

class TelescopeLogger extends EventEmitter {
  private logs: RequestLog[] = [];
  private maxLogs = 1000; // Giới hạn số logs để tránh memory leak

  addRequestLog(log: RequestLog) {
    this.logs.unshift(log); // Thêm vào đầu array
    
    // Giới hạn số logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    this.emit('newRequest', log);
  }

  updateResponseLog(requestId: string, response: RequestLog['response']) {
    const logIndex = this.logs.findIndex(log => log.id === requestId);
    if (logIndex !== -1) {
      this.logs[logIndex].response = response;
      this.emit('requestComplete', this.logs[logIndex]);
    }
  }

  getLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

  getLogById(id: string) {
    return this.logs.find(log => log.id === id);
  }

  clearLogs() {
    this.logs = [];
    this.emit('logsCleared');
  }
}

const telescopeLogger = new TelescopeLogger();

const telescopePlugin: Plugin = {
  name: 'telescope',
  version: '1.0.0',
  register: async (server: Server) => {
    // Tạo HTTP server cho Socket.IO
    const httpServer = createServer();
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Khởi động Socket.IO server với port fallback
    const startTelescopeServer = async (port: number, maxAttempts = 5) => {
      return new Promise<void>((resolve, reject) => {
        const attemptStart = (currentPort: number, attempts: number) => {
          httpServer.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              if (attempts < maxAttempts) {
                console.log(`⚠️  Port ${currentPort} is busy, trying ${currentPort + 1}...`);
                attemptStart(currentPort + 1, attempts + 1);
              } else {
                console.log(`⚠️  All ports ${port}-${port + maxAttempts - 1} are busy. Telescope Dashboard disabled.`);
                resolve();
              }
            } else {
              reject(err);
            }
          });
          
          httpServer.listen(currentPort, () => {
            console.log(`🔭 Telescope Dashboard running on http://localhost:${currentPort}`);
            resolve();
          });
        };
        
        attemptStart(port, 1);
      });
    };
    
    const telescopePort = parseInt(process.env.TELESCOPE_PORT || '3001');
    await startTelescopeServer(telescopePort);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('🔭 Client connected to Telescope Dashboard');
      
      // Gửi logs hiện tại cho client mới
      socket.emit('initialLogs', telescopeLogger.getLogs());

      // Lắng nghe sự kiện từ logger
      telescopeLogger.on('newRequest', (log) => {
        socket.emit('newRequest', log);
      });

      telescopeLogger.on('requestComplete', (log) => {
        socket.emit('requestComplete', log);
      });

      // API để lấy logs
      socket.on('getLogs', (limit) => {
        socket.emit('logs', telescopeLogger.getLogs(limit));
      });

      socket.on('getLogById', (id) => {
        const log = telescopeLogger.getLogById(id);
        socket.emit('logDetail', log);
      });

      socket.on('clearLogs', () => {
        telescopeLogger.clearLogs();
        socket.emit('logsCleared');
      });

      socket.on('disconnect', () => {
        console.log('🔭 Client disconnected from Telescope Dashboard');
      });
    });

    // Hapi request logging
    server.ext('onRequest', (request, h) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      request.app.requestId = requestId;

      const log: RequestLog = {
        id: requestId,
        method: request.method.toUpperCase(),
        url: request.url.href,
        headers: request.headers,
        payload: request.payload,
        query: request.query,
        params: request.params,
        timestamp: new Date(),
        user: request.auth?.credentials ? {
          id: (request.auth.credentials as any).userId,
          email: (request.auth.credentials as any).email
        } : undefined
      };

      telescopeLogger.addRequestLog(log);
      return h.continue;
    });

    // Hapi response logging
    server.ext('onPreResponse', (request, h) => {
      const requestId = request.app.requestId;
      if (requestId) {
        const responseTime = Date.now() - request.info.received;
        
        const response = {
          statusCode: request.response?.statusCode || 500,
          headers: request.response?.headers || {},
          payload: request.response?.source,
          responseTime
        };

        telescopeLogger.updateResponseLog(requestId, response);
      }
      return h.continue;
    });

    // API routes cho Telescope Dashboard
    server.route([
      {
        method: 'GET',
        path: '/telescope/logs',
        options: {
          auth: false,
          tags: ['telescope'],
          description: 'Get request logs for Telescope Dashboard'
        },
        handler: (request, h) => {
          const limit = parseInt(request.query.limit as string) || 50;
          return {
            success: true,
            data: telescopeLogger.getLogs(limit)
          };
        }
      },
      {
        method: 'GET',
        path: '/telescope/logs/{id}',
        options: {
          auth: false,
          tags: ['telescope'],
          description: 'Get specific request log by ID'
        },
        handler: (request, h) => {
          const log = telescopeLogger.getLogById(request.params.id);
          if (!log) {
            return h.response({
              success: false,
              message: 'Log not found'
            }).code(404);
          }
          return {
            success: true,
            data: log
          };
        }
      },
      {
        method: 'DELETE',
        path: '/telescope/logs',
        options: {
          auth: false,
          tags: ['telescope'],
          description: 'Clear all request logs'
        },
        handler: (request, h) => {
          telescopeLogger.clearLogs();
          return {
            success: true,
            message: 'Logs cleared successfully'
          };
        }
      }
    ]);

    // Serve Telescope Dashboard HTML
    server.route({
      method: 'GET',
      path: '/telescope',
      options: {
        auth: false,
        tags: ['telescope'],
        description: 'Telescope Dashboard'
      },
      handler: (request, h) => {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔭 Telescope Dashboard</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 1.5rem; }
        .stats { display: flex; gap: 1rem; }
        .stat { background: #34495e; padding: 0.5rem 1rem; border-radius: 4px; }
        .controls { background: white; padding: 1rem; border-bottom: 1px solid #ddd; display: flex; gap: 1rem; align-items: center; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn-primary { background: #3498db; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .logs-container { padding: 1rem; }
        .log-item { background: white; margin-bottom: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .log-header { padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .log-method { padding: 0.25rem 0.5rem; border-radius: 4px; color: white; font-weight: bold; }
        .method-GET { background: #27ae60; }
        .method-POST { background: #3498db; }
        .method-PUT { background: #f39c12; }
        .method-DELETE { background: #e74c3c; }
        .method-PATCH { background: #9b59b6; }
        .log-url { font-family: monospace; color: #2c3e50; }
        .log-time { color: #7f8c8d; font-size: 0.9rem; }
        .log-details { padding: 1rem; display: none; }
        .log-details.show { display: block; }
        .detail-section { margin-bottom: 1rem; }
        .detail-section h4 { color: #2c3e50; margin-bottom: 0.5rem; }
        .detail-content { background: #f8f9fa; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; overflow-x: auto; }
        .status-code { padding: 0.25rem 0.5rem; border-radius: 4px; color: white; font-weight: bold; }
        .status-2xx { background: #27ae60; }
        .status-3xx { background: #f39c12; }
        .status-4xx { background: #e67e22; }
        .status-5xx { background: #e74c3c; }
        .response-time { color: #7f8c8d; }
        .user-info { background: #e8f4fd; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; }
        .no-logs { text-align: center; color: #7f8c8d; padding: 2rem; }
        .connection-status { padding: 0.5rem 1rem; background: #27ae60; color: white; text-align: center; }
        .connection-status.disconnected { background: #e74c3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔭 Telescope Dashboard</h1>
        <div class="stats">
            <div class="stat">Total: <span id="totalLogs">0</span></div>
            <div class="stat">Success: <span id="successLogs">0</span></div>
            <div class="stat">Errors: <span id="errorLogs">0</span></div>
        </div>
    </div>
    
    <div class="connection-status" id="connectionStatus">Connected</div>
    
    <div class="controls">
        <button class="btn btn-primary" onclick="refreshLogs()">Refresh</button>
        <button class="btn btn-danger" onclick="clearLogs()">Clear All</button>
        <span>Auto-refresh: <input type="checkbox" id="autoRefresh" checked></span>
    </div>
    
    <div class="logs-container" id="logsContainer">
        <div class="no-logs">No requests yet...</div>
    </div>

    <script>
        const socket = io('http://localhost:${telescopePort}');
        let logs = [];
        let autoRefresh = true;

        socket.on('connect', () => {
            document.getElementById('connectionStatus').textContent = 'Connected';
            document.getElementById('connectionStatus').className = 'connection-status';
        });

        socket.on('disconnect', () => {
            document.getElementById('connectionStatus').textContent = 'Disconnected';
            document.getElementById('connectionStatus').className = 'connection-status disconnected';
        });

        socket.on('initialLogs', (initialLogs) => {
            logs = initialLogs;
            renderLogs();
        });

        socket.on('newRequest', (log) => {
            logs.unshift(log);
            renderLogs();
        });

        socket.on('requestComplete', (log) => {
            const index = logs.findIndex(l => l.id === log.id);
            if (index !== -1) {
                logs[index] = log;
                renderLogs();
            }
        });

        socket.on('logsCleared', () => {
            logs = [];
            renderLogs();
        });

        function renderLogs() {
            const container = document.getElementById('logsContainer');
            
            if (logs.length === 0) {
                container.innerHTML = '<div class="no-logs">No requests yet...</div>';
                updateStats();
                return;
            }

            container.innerHTML = logs.map(log => {
                const statusClass = log.response ? 
                    \`status-\${Math.floor(log.response.statusCode / 100)}xx\` : '';
                const methodClass = \`method-\${log.method}\`;
                
                return \`
                    <div class="log-item">
                        <div class="log-header" onclick="toggleDetails('\${log.id}')">
                            <div>
                                <span class="log-method \${methodClass}">\${log.method}</span>
                                <span class="log-url">\${log.url}</span>
                                \${log.response ? \`<span class="status-code \${statusClass}">\${log.response.statusCode}</span>\` : ''}
                                \${log.response ? \`<span class="response-time">(\${log.response.responseTime}ms)</span>\` : ''}
                            </div>
                            <div class="log-time">\${new Date(log.timestamp).toLocaleString()}</div>
                        </div>
                        <div class="log-details" id="details-\${log.id}">
                            \${log.user ? \`<div class="user-info">👤 \${log.user.email} (ID: \${log.user.id})</div>\` : ''}
                            <div class="detail-section">
                                <h4>Headers</h4>
                                <div class="detail-content">\${JSON.stringify(log.headers, null, 2)}</div>
                            </div>
                            \${log.query && Object.keys(log.query).length > 0 ? \`
                                <div class="detail-section">
                                    <h4>Query Parameters</h4>
                                    <div class="detail-content">\${JSON.stringify(log.query, null, 2)}</div>
                                </div>
                            \` : ''}
                            \${log.payload && Object.keys(log.payload).length > 0 ? \`
                                <div class="detail-section">
                                    <h4>Request Payload</h4>
                                    <div class="detail-content">\${JSON.stringify(log.payload, null, 2)}</div>
                                </div>
                            \` : ''}
                            \${log.response ? \`
                                <div class="detail-section">
                                    <h4>Response</h4>
                                    <div class="detail-content">\${JSON.stringify(log.response.payload, null, 2)}</div>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                \`;
            }).join('');

            updateStats();
        }

        function toggleDetails(logId) {
            const details = document.getElementById(\`details-\${logId}\`);
            details.classList.toggle('show');
        }

        function updateStats() {
            const total = logs.length;
            const success = logs.filter(log => log.response && log.response.statusCode < 400).length;
            const errors = logs.filter(log => log.response && log.response.statusCode >= 400).length;
            
            document.getElementById('totalLogs').textContent = total;
            document.getElementById('successLogs').textContent = success;
            document.getElementById('errorLogs').textContent = errors;
        }

        function refreshLogs() {
            socket.emit('getLogs', 100);
        }

        function clearLogs() {
            if (confirm('Are you sure you want to clear all logs?')) {
                socket.emit('clearLogs');
            }
        }

        // Auto-refresh toggle
        document.getElementById('autoRefresh').addEventListener('change', (e) => {
            autoRefresh = e.target.checked;
        });

        // Auto-refresh every 5 seconds
        setInterval(() => {
            if (autoRefresh) {
                refreshLogs();
            }
        }, 5000);
    </script>
</body>
</html>
        `;
        
        return h.response(html).type('text/html');
      }
    });
  }
};

export default telescopePlugin;
