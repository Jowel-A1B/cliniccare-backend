const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const { initSocket } = require('./src/services/socketService');
const { startReminderCron } = require('./src/services/reminderService');
const { startNoShowCron } = require('./src/services/noShowService');

(async () => {
  await connectDB();

  // V2: wrap Express in a raw http server so Socket.IO can share the same port.
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  startReminderCron();
  startNoShowCron();

  httpServer.listen(env.port, () => {
    console.log(`[server] Clinic API + WebSocket running on http://localhost:${env.port}`);
  });
})();
