const mongoose = require('mongoose');

describe('Database Setup', () => {
  it('should connect to the database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
