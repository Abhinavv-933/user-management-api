import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result?.error?.message || "Something went wrong."
    );
    error.details = result?.error?.details || [];
    throw error;
  }

  return result;
}

function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="alert error" role="alert">
      <strong>{error.message}</strong>
      {error.details?.map((item, index) => (
        <p key={index}>
          {item.field}: {item.message}
        </p>
      ))}
    </div>
  );
}

function UserCard({ user }) {
  if (!user) return null;

  return (
    <div className="user-card">
      <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <small>User ID</small>
        <code className="user-id">{user.id}</code>
        <p className="muted">
          Created: {user.createdAt
            ? new Date(user.createdAt).toLocaleString()
            : "—"}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [createdUser, setCreatedUser] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const [userId, setUserId] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [searching, setSearching] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreateError(null);
    setCreateMessage("");
    setCreatedUser(null);

    if (form.name.trim().length < 2) {
      setCreateError({ message: "Name must contain at least 2 characters." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setCreateError({ message: "Enter a valid email address." });
      return;
    }

    if (form.password.length < 8) {
      setCreateError({ message: "Password must be at least 8 characters." });
      return;
    }

    setCreating(true);

    try {
      const result = await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      setCreatedUser(result.data.user);
      setCreateMessage("User created successfully!");
      setForm({ name: "", email: "", password: "" });
    } catch (error) {
      setCreateError(error);
    } finally {
      setCreating(false);
    }
  }

  async function handleLookup(event) {
    event.preventDefault();
    setLookupError(null);
    setFoundUser(null);

    if (!userId.trim()) {
      setLookupError({ message: "Please enter a user ID." });
      return;
    }

    setSearching(true);

    try {
      const result = await apiRequest(
        `/users/${encodeURIComponent(userId.trim())}`
      );
      setFoundUser(result.data.user);
    } catch (error) {
      setLookupError(error);
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="container">
      <header className="navbar">
        <a className="brand" href="/">UserBase</a>
        <span className="api-label">● API workspace</span>
      </header>

      <section className="hero">
        <span className="eyebrow">DEVELOPER WORKSPACE</span>
        <h1>User management, made simple.</h1>
        <p>Create user records and retrieve existing profiles through a REST API.</p>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Create a user</h2>
          <p className="subtitle">Add a new user to your database.</p>

          <form onSubmit={handleCreate} noValidate>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              minLength={2}
              maxLength={100}
              required
            />

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={72}
              required
            />
            <small className="muted">
              Passwords are hashed before storage.
            </small>

            <ErrorMessage error={createError} />
            {createMessage && (
              <p className="success" role="status">{createMessage}</p>
            )}

            <button disabled={creating}>
              {creating ? "Creating..." : "Create user →"}
            </button>
          </form>

          {createdUser && (
            <div className="result">
              <h3>New user created</h3>
              <UserCard user={createdUser} />
              <button
                type="button"
                className="secondary"
                onClick={() => setUserId(createdUser.id)}
              >
                Use ID in lookup
              </button>
            </div>
          )}
        </article>

        <article className="panel">
          <h2>Find a user</h2>
          <p className="subtitle">Retrieve a user using their unique ID.</p>

          <form onSubmit={handleLookup}>
            <label htmlFor="userId">User ID</label>
            <input
              id="userId"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Paste a user ID"
              required
            />

            <ErrorMessage error={lookupError} />

            <button disabled={searching}>
              {searching ? "Searching..." : "Find user →"}
            </button>
          </form>

          {foundUser ? (
            <div className="result">
              <h3>User found</h3>
              <UserCard user={foundUser} />
            </div>
          ) : (
            !lookupError && (
              <div className="empty-state">
                <span>⌕</span>
                <h3>Your results will appear here</h3>
                <p>Enter a valid user ID to view their profile.</p>
              </div>
            )
          )}
        </article>
      </section>

      <footer>
        <span>UserBase · Full-Stack Developer Assessment</span>
        <span>React · Express · MongoDB</span>
      </footer>
    </main>
  );
}
