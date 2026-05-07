const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

function request(port, method, route, body, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: route,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {})
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : {}
          });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "openlearn-test-"));
  const port = 3300 + Math.floor(Math.random() * 200);
  process.env.OPENLEARN_DATA_DIR = tempDir;
  process.env.PORT = String(port);

  const { createAppServer } = require("../server.js");
  const server = createAppServer();

  try {
    await new Promise((resolve) => server.listen(port, resolve));

    const email = `tester-${Date.now()}@example.com`;
    const signup = await request(port, "POST", "/api/auth/signup", {
      name: "Test User",
      email,
      password: "secret123",
      learnerState: {
        saved: [{ id: "course:1", title: "Course 1", kind: "course", link: "courses.html", savedAt: new Date().toISOString() }],
        progress: {},
        recent: []
      }
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.body.user.name, "Test User");

    const weakSignup = await request(port, "POST", "/api/auth/signup", {
      name: "Weak User",
      email: `weak-${Date.now()}@example.com`,
      password: "password",
      learnerState: { saved: [], progress: {}, recent: [] }
    });
    assert.equal(weakSignup.status, 400);

    const cookie = (signup.headers["set-cookie"] || [""])[0].split(";")[0];
    assert.ok(cookie.includes("openlearn_session="));

    const session = await request(port, "GET", "/api/auth/session", null, cookie);
    assert.equal(session.status, 200);
    assert.equal(session.body.authenticated, true);

    const profileUpdate = await request(port, "PUT", "/api/auth/profile", {
      name: "Updated User",
      email
    }, cookie);
    assert.equal(profileUpdate.status, 200);
    assert.equal(profileUpdate.body.user.name, "Updated User");

    const stateUpdate = await request(port, "PUT", "/api/learner-state", {
      learnerState: {
        saved: [],
        progress: {
          "course:1": {
            id: "course:1",
            title: "Course 1",
            kind: "course",
            link: "courses.html",
            visits: 3,
            completed: true,
            updatedAt: new Date().toISOString()
          }
        },
        recent: [{ id: "course:1", title: "Course 1", kind: "course", link: "courses.html", viewedAt: new Date().toISOString() }]
      }
    }, cookie);
    assert.equal(stateUpdate.status, 200);
    assert.equal(stateUpdate.body.learnerState.progress["course:1"].completed, true);

    const passwordChange = await request(port, "PUT", "/api/auth/password", {
      currentPassword: "secret123",
      newPassword: "newsecret123",
      confirmPassword: "newsecret123"
    }, cookie);
    assert.equal(passwordChange.status, 200);

    const oldLogin = await request(port, "POST", "/api/auth/login", {
      email,
      password: "secret123",
      learnerState: { saved: [], progress: {}, recent: [] }
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await request(port, "POST", "/api/auth/login", {
      email,
      password: "newsecret123",
      learnerState: { saved: [], progress: {}, recent: [] }
    });
    assert.equal(newLogin.status, 200);
    assert.equal(newLogin.body.user.name, "Updated User");

    const resetRequest = await request(port, "POST", "/api/auth/password-reset/request", {
      email
    });
    assert.equal(resetRequest.status, 200);
    assert.ok(resetRequest.body.resetUrl.includes("reset-password.html?token="));

    const resetToken = new URL(resetRequest.body.resetUrl, "http://localhost").searchParams.get("token");
    const resetConfirm = await request(port, "POST", "/api/auth/password-reset/confirm", {
      token: resetToken,
      password: "resetsecret123",
      confirmPassword: "resetsecret123"
    });
    assert.equal(resetConfirm.status, 200);

    const resetLogin = await request(port, "POST", "/api/auth/login", {
      email,
      password: "resetsecret123",
      learnerState: { saved: [], progress: {}, recent: [] }
    });
    assert.equal(resetLogin.status, 200);

    console.log("All tests passed.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
    delete process.env.OPENLEARN_DATA_DIR;
    delete process.env.PORT;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
