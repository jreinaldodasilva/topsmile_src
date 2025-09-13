describe('Database Setup Test', () => { it('should connect to database', async () => { const mongoose = require('mongoose'); expect(mongoose.connection.readyState).toBeGreaterThan(0); }); });
