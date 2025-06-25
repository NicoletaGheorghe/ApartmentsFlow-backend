# Database Troubleshooting Guide

## Table of Contents
1. [MongoDB Connection Issues](#mongodb-connection-issues)
2. [Schema Validation Errors](#schema-validation-errors)
3. [Query Performance Issues](#query-performance-issues)
4. [Index Optimization](#index-optimization)
5. [Data Migration Issues](#data-migration-issues)
6. [Aggregation Pipeline Issues](#aggregation-pipeline-issues)
7. [MongoDB Specific Issues](#mongodb-specific-issues)
8. [Quick Reference](#quick-reference)

---

## MongoDB Connection Issues

### 1. Connection String Issues
**Issue**: Invalid connection strings
**Error**: Connection failures

**Fix**: Proper connection string format:
```javascript
// Local development
mongodb://localhost:27017/database_name

// Atlas
mongodb+srv://username:password@cluster.mongodb.net/database_name

// With options
mongodb://localhost:27017/database_name?retryWrites=true&w=majority
```

### 2. Network Connectivity Issues
**Issue**: Can't connect to MongoDB
**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Fix**:
1. Check MongoDB service is running
2. Verify connection string
3. Check network connectivity
4. Ensure proper authentication

### 3. Authentication Issues
**Issue**: Authentication failures
**Error**: `MongoServerError: Authentication failed`

**Fix**: Proper authentication setup:
```javascript
// With username and password
mongodb://username:password@localhost:27017/database_name

// With authentication database
mongodb://username:password@localhost:27017/database_name?authSource=admin
```

---

## Schema Validation Errors

### 1. Required Field Missing
**Issue**: Documents missing required fields
**Error**: `ValidationError: Path 'field' is required`

**Fix**: Ensure all required fields are provided:
```javascript
// Schema definition
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

// Document creation
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedPassword'
});
```

### 2. Data Type Mismatches
**Issue**: Wrong data types being stored
**Error**: `CastError: Cast to ObjectId failed`

**Fix**: Ensure correct data types:
```javascript
// Ensure ObjectId is valid
const isValidId = mongoose.Types.ObjectId.isValid(id);

// Convert string to ObjectId
const objectId = new mongoose.Types.ObjectId(id);
```

### 3. Enum Validation Errors
**Issue**: Values not matching enum constraints
**Error**: `ValidationError: Path 'status' is invalid`

**Fix**: Use valid enum values:
```javascript
// Schema with enum
const apartmentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available'
  }
});
```

---

## Query Performance Issues

### 1. Slow Queries
**Issue**: Database queries taking too long
**Error**: Timeout errors, poor performance

**Fix**: Optimize queries:
```javascript
// Use projection to limit fields
const users = await User.find({}, 'name email');

// Use lean() for read-only operations
const users = await User.find().lean();

// Add proper indexes
userSchema.index({ email: 1 });
```

### 2. Missing Indexes
**Issue**: Queries not using indexes
**Error**: Slow performance on large datasets

**Fix**: Add appropriate indexes:
```javascript
// Single field index
apartmentSchema.index({ price: 1 });

// Compound index
apartmentSchema.index({ price: 1, bedrooms: 1 });

// Geospatial index
apartmentSchema.index({ location: '2dsphere' });

// Text index
apartmentSchema.index({ 
  title: 'text', 
  description: 'text' 
});
```

### 3. Large Result Sets
**Issue**: Queries returning too much data
**Error**: Memory issues, slow performance

**Fix**: Implement pagination:
```javascript
// Pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const apartments = await Apartment.find()
  .skip(skip)
  .limit(limit)
  .lean();
```

---

## Index Optimization

### 1. Index Strategy
**Issue**: Poor index strategy affecting performance
**Error**: Slow queries despite indexes

**Fix**: Proper index strategy:
```javascript
// Index for common queries
apartmentSchema.index({ price: 1, bedrooms: 1, bathrooms: 1 });

// Index for search functionality
apartmentSchema.index({ 
  title: 'text', 
  description: 'text',
  'location.address': 'text'
});

// Index for geospatial queries
apartmentSchema.index({ location: '2dsphere' });
```

### 2. Index Maintenance
**Issue**: Indexes becoming inefficient
**Error**: Degraded performance over time

**Fix**: Regular index maintenance:
```javascript
// Check index usage
db.apartments.getIndexes()

// Analyze query performance
db.apartments.find({ price: { $gte: 1000 } }).explain("executionStats")
```

### 3. Index Size Issues
**Issue**: Indexes taking too much space
**Error**: Storage issues, slow writes

**Fix**: Optimize index size:
```javascript
// Use sparse indexes for optional fields
apartmentSchema.index({ owner: 1 }, { sparse: true });

// Use partial indexes
apartmentSchema.index(
  { price: 1 }, 
  { partialFilterExpression: { price: { $gt: 0 } } }
);
```

---

## Data Migration Issues

### 1. Schema Changes
**Issue**: Schema changes breaking existing data
**Error**: Validation errors after schema updates

**Fix**: Proper migration strategy:
```javascript
// Migration script
const migrateData = async () => {
  const apartments = await Apartment.find({});
  
  for (const apartment of apartments) {
    // Update documents to match new schema
    if (!apartment.location) {
      apartment.location = {
        type: 'Point',
        coordinates: [0, 0],
        address: 'Unknown'
      };
      await apartment.save();
    }
  }
};
```

### 2. Data Type Conversions
**Issue**: Converting data types in existing documents
**Error**: Cast errors during migration

**Fix**: Safe data type conversion:
```javascript
// Convert string to number
const apartments = await Apartment.find({ price: { $type: 'string' } });

for (const apartment of apartments) {
  apartment.price = parseFloat(apartment.price);
  await apartment.save();
}
```

### 3. Bulk Operations
**Issue**: Large data migrations taking too long
**Error**: Timeout errors, memory issues

**Fix**: Use bulk operations:
```javascript
// Bulk update
const bulkOps = apartments.map(apartment => ({
  updateOne: {
    filter: { _id: apartment._id },
    update: { $set: { newField: 'value' } }
  }
}));

await Apartment.bulkWrite(bulkOps);
```

---

## Aggregation Pipeline Issues

### 1. Pipeline Syntax Errors
**Issue**: Complex aggregation queries failing
**Error**: Pipeline errors, incorrect results

**Fix**: Proper aggregation syntax:
```javascript
const result = await Apartment.aggregate([
  { $match: { price: { $gte: 1000 } } },
  { $group: { 
    _id: '$location.city', 
    avgPrice: { $avg: '$price' },
    count: { $sum: 1 }
  }},
  { $sort: { avgPrice: -1 } }
]);
```

### 2. Memory Issues in Aggregations
**Issue**: Aggregations using too much memory
**Error**: Memory limit exceeded

**Fix**: Optimize aggregations:
```javascript
// Use allowDiskUse for large datasets
const result = await Apartment.aggregate([
  { $match: { price: { $gte: 1000 } } },
  { $group: { _id: '$city', count: { $sum: 1 } } }
], { allowDiskUse: true });
```

### 3. Lookup Performance Issues
**Issue**: Lookup operations being slow
**Error**: Timeout errors in aggregations

**Fix**: Optimize lookups:
```javascript
// Use indexed fields for lookups
const result = await Apartment.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'owner',
      foreignField: '_id',
      as: 'ownerInfo'
    }
  }
]);
```

---

## MongoDB Specific Issues

### 1. Connection Pooling
**Issue**: Too many connections or connection timeouts
**Error**: Connection pool exhausted

**Fix**: Proper connection pooling:
```javascript
// Add connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 2. Database Lock Issues
**Issue**: Database operations timing out
**Error**: Lock timeout errors

**Fix**: Optimize queries and add proper indexing:
```javascript
// Use lean() for read-only operations
const apartments = await Apartment.find().lean();

// Use select() to limit fields
const apartments = await Apartment.find().select('title price location');
```

### 3. Replica Set Issues
**Issue**: Replica set connectivity problems
**Error**: Primary election issues

**Fix**: Proper replica set configuration:
```javascript
// Connect to replica set
mongoose.connect('mongodb://host1:27017,host2:27017,host3:27017/database', {
  replicaSet: 'rs0',
  readPreference: 'secondaryPreferred'
});
```

---

## Quick Reference

### Common Commands
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Backup database
mongodump --db apartment_search

# Restore database
mongorestore --db apartment_search

# Check slow queries
db.getProfilingStatus()

# Check database stats
db.stats()

# Check collection stats
db.apartments.stats()
```

### Common Error Messages
- `MongoNetworkError`: Network connectivity issue
- `MongoParseError`: Invalid connection string
- `ValidationError`: Schema validation failed
- `CastError`: Invalid data type

### Emergency Procedures
1. **Database Connection Issues**
   - Check MongoDB service
   - Verify connection string
   - Check network connectivity
   - Ensure proper authentication

2. **Performance Issues**
   - Check database indexes
   - Monitor slow queries
   - Optimize aggregation pipelines
   - Check connection pooling

3. **Data Issues**
   - Backup before making changes
   - Use migration scripts
   - Test changes on development data
   - Monitor data integrity

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 