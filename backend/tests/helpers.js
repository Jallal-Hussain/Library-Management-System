import jwt from "jsonwebtoken";
import User from "../src/models/User.js";

export const createTestUser = async (role = "patron", overrides = {}) => {
  const count = Math.floor(Math.random() * 1000000);
  const user = new User({
    name: `${role.charAt(0).toUpperCase() + role.slice(1)} User ${count}`,
    email: `${role}${count}@example.com`,
    passwordHash: "password123",
    role,
    isActive: true,
    approvalStatus: "approved",
    ...overrides,
  });
  user.membershipId = user.generateMembershipId();
  await user.save();
  return user;
};

export const getAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "test_super_secret_jwt_key_for_vitest_testing_123456",
    { expiresIn: "1d" }
  );
};
