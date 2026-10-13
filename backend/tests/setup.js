import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach, inject } from "vitest";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_super_secret_jwt_key_for_vitest_testing_123456";
  process.env.JWT_EXPIRES_IN = "1d";

  let uri;
  try {
    uri = inject("mongoUri");
  } catch {
    uri = process.env.TEST_MONGO_URI;
  }
  uri = uri || process.env.TEST_MONGO_URI;

  if (uri && mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
