import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export async function setup(options) {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_super_secret_jwt_key_for_vitest_testing_123456";
  process.env.JWT_EXPIRES_IN = "1d";

  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: "4.4.18",
    },
  });

  const uri = mongoServer.getUri();
  process.env.TEST_MONGO_URI = uri;
  if (options && typeof options.provide === "function") {
    options.provide("mongoUri", uri);
  }
}

export async function teardown() {
  if (mongoServer) {
    await mongoServer.stop();
  }
}
