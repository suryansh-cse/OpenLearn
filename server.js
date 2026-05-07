const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = process.env.OPENLEARN_DATA_DIR || ROOT_DIR;
const MESSAGES_FILE = path.join(DATA_DIR, "message.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const LEARNER_STATE_FILE = path.join(DATA_DIR, "learner-state.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const RESET_TOKENS_FILE = path.join(DATA_DIR, "password-reset-tokens.json");
const SESSION_COOKIE = "openlearn_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
const RESET_TOKEN_MAX_AGE_MS = 1000 * 60 * 30;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const sessions = new Map();

function ensureJsonFile(filePath, fallbackContent) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackContent, null, 2) + "\n", "utf8");
  }
}

function readJsonFile(filePath, fallbackValue) {
  try {
    ensureJsonFile(filePath, fallbackValue);
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function ensureDataFiles() {
  ensureJsonFile(MESSAGES_FILE, []);
  ensureJsonFile(USERS_FILE, []);
  ensureJsonFile(LEARNER_STATE_FILE, {});
  ensureJsonFile(SESSIONS_FILE, {});
  ensureJsonFile(RESET_TOKENS_FILE, {});
}

function jsonHeaders(extraHeaders = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,HEAD,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  };
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, jsonHeaders(extraHeaders));
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: "File not found." });
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function getRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        request.destroy();
        reject(new Error("Request body too large."));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function getJsonBody(request) {
  const rawBody = await getRequestBody(request);
  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody);
}

function parseCookies(request) {
  const cookieHeader = request.headers.cookie || "";
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  return "";
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || "").split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const candidateHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(candidateHash, "hex"));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    joinedAt: user.joinedAt
  };
}

function defaultLearnerState() {
  return {
    saved: [],
    progress: {},
    recent: []
  };
}

function sanitizeLearnerState(state) {
  const safeState = state && typeof state === "object" ? state : {};
  return {
    saved: Array.isArray(safeState.saved) ? safeState.saved.slice(0, 24).map((entry) => ({
      id: String(entry.id || ""),
      title: String(entry.title || ""),
      kind: String(entry.kind || ""),
      link: String(entry.link || ""),
      savedAt: String(entry.savedAt || new Date().toISOString())
    })).filter((entry) => entry.id && entry.link) : [],
    progress: safeState.progress && typeof safeState.progress === "object"
      ? Object.fromEntries(
          Object.entries(safeState.progress).slice(0, 100).map(([key, entry]) => [
            String(key),
            {
              id: String(entry.id || key),
              title: String(entry.title || ""),
              kind: String(entry.kind || ""),
              link: String(entry.link || ""),
              visits: Math.max(0, Number(entry.visits || 0)),
              completed: Boolean(entry.completed),
              updatedAt: String(entry.updatedAt || new Date().toISOString())
            }
          ]).filter(([, entry]) => entry.id && entry.link)
        )
      : {},
    recent: Array.isArray(safeState.recent) ? safeState.recent.slice(0, 8).map((entry) => ({
      id: String(entry.id || ""),
      title: String(entry.title || ""),
      kind: String(entry.kind || ""),
      link: String(entry.link || ""),
      viewedAt: String(entry.viewedAt || new Date().toISOString())
    })).filter((entry) => entry.id && entry.link) : []
  };
}

function mergeLearnerState(baseState, incomingState) {
  const merged = sanitizeLearnerState({
    saved: [...(incomingState.saved || []), ...(baseState.saved || [])],
    recent: [...(incomingState.recent || []), ...(baseState.recent || [])],
    progress: {
      ...(baseState.progress || {}),
      ...(incomingState.progress || {})
    }
  });

  const seenSaved = new Set();
  merged.saved = merged.saved.filter((entry) => {
    if (seenSaved.has(entry.id)) {
      return false;
    }
    seenSaved.add(entry.id);
    return true;
  }).slice(0, 24);

  const seenRecent = new Set();
  merged.recent = merged.recent.filter((entry) => {
    if (seenRecent.has(entry.id)) {
      return false;
    }
    seenRecent.add(entry.id);
    return true;
  }).slice(0, 8);

  return merged;
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS
  });
  persistSessions();
  return token;
}

function getSession(request) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token || !sessions.has(token)) {
    return null;
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    persistSessions();
    return null;
  }

  return { token, ...session };
}

function clearSession(response, token) {
  if (token) {
    sessions.delete(token);
    persistSessions();
  }

  return {
    "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  };
}

function sessionCookieHeader(token) {
  return {
    "Set-Cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}; SameSite=Lax`
  };
}

function getUsers() {
  return readJsonFile(USERS_FILE, []);
}

function saveUsers(users) {
  writeJsonFile(USERS_FILE, users);
}

function getLearnerStates() {
  return readJsonFile(LEARNER_STATE_FILE, {});
}

function saveLearnerStates(states) {
  writeJsonFile(LEARNER_STATE_FILE, states);
}

function getResetTokens() {
  return readJsonFile(RESET_TOKENS_FILE, {});
}

function saveResetTokens(tokens) {
  writeJsonFile(RESET_TOKENS_FILE, tokens);
}

function pruneResetTokens(tokens = getResetTokens()) {
  const now = Date.now();
  const activeTokens = {};
  Object.entries(tokens).forEach(([token, entry]) => {
    if (entry && entry.userId && entry.expiresAt && entry.expiresAt > now) {
      activeTokens[token] = entry;
    }
  });
  saveResetTokens(activeTokens);
  return activeTokens;
}

function createPasswordResetToken(userId) {
  const tokens = pruneResetTokens();
  const token = crypto.randomBytes(32).toString("hex");
  tokens[token] = {
    userId,
    expiresAt: Date.now() + RESET_TOKEN_MAX_AGE_MS
  };
  saveResetTokens(tokens);
  return token;
}

function getCurrentUserFromRequest(request) {
  const session = getSession(request);
  if (!session) {
    return null;
  }

  const user = getUsers().find((entry) => entry.id === session.userId);
  if (!user) {
    sessions.delete(session.token);
    return null;
  }

  return { session, user };
}

function getSafeFilePath(urlPathname) {
  const cleanPath = urlPathname === "/" ? "/index.html" : urlPathname;
  const decodedPath = decodeURIComponent(cleanPath);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.join(ROOT_DIR, normalizedPath);

  if (!resolvedPath.startsWith(ROOT_DIR)) {
    return null;
  }

  return resolvedPath;
}

function loadPersistedSessions() {
  const stored = readJsonFile(SESSIONS_FILE, {});
  Object.entries(stored).forEach(([token, session]) => {
    if (session && session.userId && session.expiresAt && session.expiresAt > Date.now()) {
      sessions.set(token, session);
    }
  });
}

function persistSessions() {
  const serializable = {};
  sessions.forEach((session, token) => {
    if (session.expiresAt > Date.now()) {
      serializable[token] = session;
    }
  });
  writeJsonFile(SESSIONS_FILE, serializable);
}

async function handleSaveMessage(request, response) {
  try {
    const payload = await getJsonBody(request);
    const type = String(payload.type || "").trim();
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const message = String(payload.message || "").trim();

    if (!type || !name || !email || !message) {
      sendJson(response, 400, { error: "All fields are required." });
      return;
    }

    const currentMessages = readJsonFile(MESSAGES_FILE, []);
    const newMessage = {
      id: Date.now(),
      type,
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };

    currentMessages.push(newMessage);
    writeJsonFile(MESSAGES_FILE, currentMessages);

    sendJson(response, 201, {
      success: true,
      message: "Your message has been saved.",
      item: newMessage
    });
  } catch (error) {
    sendJson(response, 500, { error: "Unable to save your message right now." });
  }
}

async function handleSignup(request, response) {
  try {
    const payload = await getJsonBody(request);
    const name = String(payload.name || "").trim();
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    const learnerState = sanitizeLearnerState(payload.learnerState || defaultLearnerState());

    if (!name || !email || !password) {
      sendJson(response, 400, { error: "Name, email, and password are required." });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      sendJson(response, 400, { error: passwordError });
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      sendJson(response, 409, { error: "An account with that email already exists." });
      return;
    }

    const user = {
      id: `user-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      name,
      email,
      passwordHash: createPasswordHash(password),
      joinedAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    const learnerStates = getLearnerStates();
    learnerStates[user.id] = learnerState;
    saveLearnerStates(learnerStates);

    const token = createSession(user.id);
    sendJson(
      response,
      201,
      {
        success: true,
        user: sanitizeUser(user),
        learnerState
      },
      sessionCookieHeader(token)
    );
  } catch (error) {
    sendJson(response, 500, { error: "Unable to create your account right now." });
  }
}

async function handleLogin(request, response) {
  try {
    const payload = await getJsonBody(request);
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    const guestState = sanitizeLearnerState(payload.learnerState || defaultLearnerState());

    if (!email || !password) {
      sendJson(response, 400, { error: "Email and password are required." });
      return;
    }

    const users = getUsers();
    const user = users.find((entry) => entry.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendJson(response, 401, { error: "Invalid email or password." });
      return;
    }

    const learnerStates = getLearnerStates();
    const mergedState = mergeLearnerState(learnerStates[user.id] || defaultLearnerState(), guestState);
    learnerStates[user.id] = mergedState;
    saveLearnerStates(learnerStates);

    const token = createSession(user.id);
    sendJson(
      response,
      200,
      {
        success: true,
        user: sanitizeUser(user),
        learnerState: mergedState
      },
      sessionCookieHeader(token)
    );
  } catch (error) {
    sendJson(response, 500, { error: "Unable to log you in right now." });
  }
}

function handleLogout(request, response) {
  const session = getSession(request);
  sendJson(
    response,
    200,
    { success: true },
    clearSession(response, session ? session.token : null)
  );
}

function handleAuthSession(request, response) {
  const current = getCurrentUserFromRequest(request);
  if (!current) {
    sendJson(response, 200, { authenticated: false });
    return;
  }

  const learnerStates = getLearnerStates();
  sendJson(response, 200, {
    authenticated: true,
    user: sanitizeUser(current.user),
    learnerState: sanitizeLearnerState(learnerStates[current.user.id] || defaultLearnerState())
  });
}

async function handleUpdateProfile(request, response) {
  const current = getCurrentUserFromRequest(request);
  if (!current) {
    sendJson(response, 401, { error: "You need to log in first." });
    return;
  }

  try {
    const payload = await getJsonBody(request);
    const name = String(payload.name || "").trim();
    const email = normalizeEmail(payload.email);

    if (!name || !email) {
      sendJson(response, 400, { error: "Name and email are required." });
      return;
    }

    const users = getUsers();
    const duplicate = users.find((entry) => entry.email === email && entry.id !== current.user.id);
    if (duplicate) {
      sendJson(response, 409, { error: "Another account is already using that email." });
      return;
    }

    const updatedUsers = users.map((entry) => {
      if (entry.id !== current.user.id) {
        return entry;
      }

      return {
        ...entry,
        name,
        email
      };
    });

    saveUsers(updatedUsers);
    const updatedUser = updatedUsers.find((entry) => entry.id === current.user.id);
    sendJson(response, 200, {
      success: true,
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    sendJson(response, 500, { error: "Unable to update your profile right now." });
  }
}

async function handleChangePassword(request, response) {
  const current = getCurrentUserFromRequest(request);
  if (!current) {
    sendJson(response, 401, { error: "You need to log in first." });
    return;
  }

  try {
    const payload = await getJsonBody(request);
    const currentPassword = String(payload.currentPassword || "");
    const newPassword = String(payload.newPassword || "");
    const confirmPassword = String(payload.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      sendJson(response, 400, { error: "Please complete all password fields." });
      return;
    }

    if (!verifyPassword(currentPassword, current.user.passwordHash)) {
      sendJson(response, 401, { error: "Your current password is incorrect." });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      sendJson(response, 400, { error: passwordError.replace("Password", "Your new password") });
      return;
    }

    if (newPassword !== confirmPassword) {
      sendJson(response, 400, { error: "Your new passwords do not match." });
      return;
    }

    const users = getUsers().map((entry) => {
      if (entry.id !== current.user.id) {
        return entry;
      }

      return {
        ...entry,
        passwordHash: createPasswordHash(newPassword)
      };
    });

    saveUsers(users);
    sendJson(response, 200, { success: true });
  } catch (error) {
    sendJson(response, 500, { error: "Unable to change your password right now." });
  }
}

async function handlePasswordResetRequest(request, response) {
  try {
    const payload = await getJsonBody(request);
    const email = normalizeEmail(payload.email);

    if (!email) {
      sendJson(response, 400, { error: "Email is required." });
      return;
    }

    const user = getUsers().find((entry) => entry.email === email);
    const body = {
      success: true,
      message: "If that email exists, a reset link has been created."
    };

    if (user) {
      const token = createPasswordResetToken(user.id);
      body.resetUrl = `/reset-password.html?token=${token}`;
      body.expiresInMinutes = Math.floor(RESET_TOKEN_MAX_AGE_MS / 60000);
    }

    sendJson(response, 200, body);
  } catch (error) {
    sendJson(response, 500, { error: "Unable to start password reset right now." });
  }
}

async function handlePasswordResetConfirm(request, response) {
  try {
    const payload = await getJsonBody(request);
    const token = String(payload.token || "").trim();
    const password = String(payload.password || "");
    const confirmPassword = String(payload.confirmPassword || "");

    if (!token || !password || !confirmPassword) {
      sendJson(response, 400, { error: "Reset token and new password are required." });
      return;
    }

    if (password !== confirmPassword) {
      sendJson(response, 400, { error: "Your new passwords do not match." });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      sendJson(response, 400, { error: passwordError });
      return;
    }

    const tokens = pruneResetTokens();
    const resetEntry = tokens[token];
    if (!resetEntry) {
      sendJson(response, 400, { error: "This reset link is invalid or expired." });
      return;
    }

    const users = getUsers();
    const updatedUsers = users.map((entry) => {
      if (entry.id !== resetEntry.userId) {
        return entry;
      }

      return {
        ...entry,
        passwordHash: createPasswordHash(password)
      };
    });

    delete tokens[token];
    saveUsers(updatedUsers);
    saveResetTokens(tokens);
    sendJson(response, 200, { success: true });
  } catch (error) {
    sendJson(response, 500, { error: "Unable to reset your password right now." });
  }
}

function handleGetLearnerState(request, response) {
  const current = getCurrentUserFromRequest(request);
  if (!current) {
    sendJson(response, 401, { error: "You need to log in first." });
    return;
  }

  const learnerStates = getLearnerStates();
  sendJson(response, 200, {
    learnerState: sanitizeLearnerState(learnerStates[current.user.id] || defaultLearnerState())
  });
}

async function handleSaveLearnerState(request, response) {
  const current = getCurrentUserFromRequest(request);
  if (!current) {
    sendJson(response, 401, { error: "You need to log in first." });
    return;
  }

  try {
    const payload = await getJsonBody(request);
    const learnerState = sanitizeLearnerState(payload.learnerState || defaultLearnerState());
    const learnerStates = getLearnerStates();
    learnerStates[current.user.id] = learnerState;
    saveLearnerStates(learnerStates);
    sendJson(response, 200, { success: true, learnerState });
  } catch (error) {
    sendJson(response, 500, { error: "Unable to save learner state right now." });
  }
}

function createAppServer() {
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      response.writeHead(204, jsonHeaders());
      response.end();
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, {
        success: true,
        status: "ok",
        file: path.basename(MESSAGES_FILE)
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/messages") {
      await handleSaveMessage(request, response);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/signup") {
      await handleSignup(request, response);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/login") {
      await handleLogin(request, response);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/logout") {
      handleLogout(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/auth/session") {
      handleAuthSession(request, response);
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/auth/profile") {
      await handleUpdateProfile(request, response);
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/auth/password") {
      await handleChangePassword(request, response);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/password-reset/request") {
      await handlePasswordResetRequest(request, response);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/password-reset/confirm") {
      await handlePasswordResetConfirm(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/learner-state") {
      handleGetLearnerState(request, response);
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/learner-state") {
      await handleSaveLearnerState(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    const filePath = getSafeFilePath(requestUrl.pathname);
    if (!filePath) {
      sendJson(response, 403, { error: "Access denied." });
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error) {
        sendJson(response, 404, { error: "Page not found." });
        return;
      }

      if (stats.isDirectory()) {
        sendFile(response, path.join(filePath, "index.html"));
        return;
      }

      if (request.method === "HEAD") {
        const ext = path.extname(filePath).toLowerCase();
        response.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
        });
        response.end();
        return;
      }

      sendFile(response, filePath);
    });
  });
}

ensureDataFiles();
loadPersistedSessions();
const server = createAppServer();

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`OpenLearn running at http://localhost:${PORT}`);
  });
}

module.exports = {
  createAppServer
};
