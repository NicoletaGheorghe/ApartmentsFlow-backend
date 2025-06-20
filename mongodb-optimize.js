// MongoDB Optimization Script
// Run this in MongoDB Compass's MongoDB Shell

// Switch to admin database
db = db.getSiblingDB('admin');

// Set write concern to majority for better durability
db.runCommand({
  setDefaultRWConcern: {
    defaultWriteConcern: { w: "majority" },
    defaultReadConcern: { level: "local" }
  }
});

// Optimize memory settings
db.runCommand({
  setParameter: 1,
  internalQueryExecMaxBlockingSortBytes: 335544320, // 320MB
  internalQueryMaxBlockingSortMemoryUsageBytes: 335544320,
  wiredTigerConcurrentReadTransactions: 128,
  wiredTigerConcurrentWriteTransactions: 128
});

// Enable query profiler for development
db.setProfilingLevel(1, { slowms: 100 });

// Switch to apartment_search database
db = db.getSiblingDB('apartment_search');

// Create compound indexes for common queries
db.apartments.createIndex({ "status": 1, "isPublic": 1 });
db.apartments.createIndex({ "owner": 1, "status": 1 });
db.apartments.createIndex({ "location": "2dsphere" });
db.apartments.createIndex({ "price": 1 });
db.apartments.createIndex({ "bedrooms": 1, "bathrooms": 1 });

// Create text index for search
db.apartments.createIndex({
  title: "text",
  description: "text",
  location: "text"
});

print("MongoDB optimization complete!"); 