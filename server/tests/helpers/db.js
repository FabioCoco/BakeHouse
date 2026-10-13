import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

// A replica set is required so that multi-document transactions work.
let replSet;

export const startTestDb = async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
};

export const clearTestDb = async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
};

export const stopTestDb = async () => {
  await mongoose.disconnect();
  await replSet?.stop();
};
