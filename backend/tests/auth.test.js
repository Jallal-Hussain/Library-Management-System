import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";

describe("Auth Test Suite (/api/auth)", () => {
  const patronData = {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    phone: "1234567890",
    address: "123 Library St",
  };

  it("should successfully register a new patron with auto-generated membershipId", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(patronData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(patronData.email.toLowerCase());
    expect(res.body.data.user.membershipId).toMatch(/^PAT\d+/);
    expect(res.body.data.user.approvalStatus).toBe("pending");
    expect(res.body.data.user.isActive).toBe(false);
    expect(res.body.data.token).toBeDefined();
  });

  it("should prevent registration with a duplicate email", async () => {
    // Register first
    await request(app).post("/api/auth/register").send(patronData);

    // Try registering with same email
    const res = await request(app)
      .post("/api/auth/register")
      .send(patronData);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should reject registration with invalid password (too short)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...patronData, email: "short@example.com", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should login active user and reject inactive pending patron", async () => {
    // Register patron (defaults to isActive: false)
    await request(app).post("/api/auth/register").send(patronData);

    // Attempt login before approval
    const pendingLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: patronData.email, password: patronData.password });

    expect(pendingLogin.status).toBe(403);
    expect(pendingLogin.body.message).toContain("pending admin approval");

    // Activate user
    await User.updateOne({ email: patronData.email }, { isActive: true, approvalStatus: "approved" });

    // Login after approval
    const approvedLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: patronData.email, password: patronData.password });

    expect(approvedLogin.status).toBe(200);
    expect(approvedLogin.body.success).toBe(true);
    expect(approvedLogin.body.data.token).toBeDefined();
    expect(approvedLogin.body.data.user.email).toBe(patronData.email.toLowerCase());
  });

  it("should reject login with wrong password", async () => {
    // Create active user
    const user = new User({
      name: "Active User",
      email: "active@example.com",
      passwordHash: "correctpassword",
      role: "patron",
      isActive: true,
      approvalStatus: "approved",
    });
    user.membershipId = user.generateMembershipId();
    await user.save();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "active@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject login with non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should fetch current user profile at GET /api/auth/me when authenticated", async () => {
    const user = new User({
      name: "Me User",
      email: "me@example.com",
      passwordHash: "password123",
      role: "patron",
      isActive: true,
      approvalStatus: "approved",
    });
    user.membershipId = user.generateMembershipId();
    await user.save();

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "me@example.com", password: "password123" });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe("me@example.com");
    expect(meRes.body.data.passwordHash).toBeUndefined();
  });

  it("should reject GET /api/auth/me when token is missing or invalid", async () => {
    const noToken = await request(app).get("/api/auth/me");
    expect(noToken.status).toBe(401);

    const badToken = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.jwt.token");
    expect(badToken.status).toBe(401);
  });
});
