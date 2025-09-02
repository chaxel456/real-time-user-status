# Real-Time User Status Indicator

A simple backend service (Node.js + Express + Socket.IO) that tracks whether users are **online** or **offline** in real time. Includes a lightweight test page to simulate connections and visualize status changes.

## ✨ Features
- In-memory user store with `{ id, name, status }`
- **WebSocket** (Socket.IO) to broadcast `online/offline` changes
- **REST API** endpoint `GET /users` returns current statuses
- Handles multiple connections per user (e.g., multiple tabs): user stays online until all their tabs disconnect
- Lightweight **test client** at `public/test.html`

---

## 🚀 Getting Started

### 1) Prerequisites
- Node.js 18+

### 2) Install & Run
```bash
npm install
npm run dev    # auto-restarts on changes (nodemon)
# or
npm start
```
Server runs by default on **http://localhost:3000**

### 3) Try the REST API
```bash
curl http://localhost:3000/users
```

### 4) Try Real-Time
Open the test page in your browser:
```
http://localhost:3000/public/test.html
```
- Enter a `User ID` (e.g., 1) and optional Name, click **Connect**.
- Open the same page in another tab or window with a **different** userId.
- Watch status changes update live.

---

## 🔌 API & Events

### REST
- `GET /users` → `[{ id, name, status }]`

### Socket.IO
- **Auth (on connect):**
  - Client must pass `userId` (string/number) and may pass `name`:
  ```js
  const socket = io("/", { auth: { userId: "1", name: "John Doe" } });
  ```
- **Server → Client events**
  - `users`: full array of all users (sent on connect)
  - `statusUpdate`: `{ id, status }` whenever a user's status flips online/offline
  - `userUpdated`: `{ id, name }` when the user's display name changes
- **Client → Server events**
  - `setName`: client can update their display name after connecting
    ```js
    socket.emit("setName", "New Name");
    ```

---

## 🧠 Figma Prototype (What to Show)

Create a simple list UI with a name and a small dot indicator:
```
🟢 John Doe
⚪ Jane Smith
🟢 Alice Brown
```

**Legend:**
- 🟢 = `online`
- ⚪ = `offline`

### Figma Comment (paste this into the prototype)
> The frontend fetches the initial list from `GET /users` to render names and their current status. Then it opens a Socket.IO connection with `{ auth: { userId } }`. Whenever the backend emits `statusUpdate` with `{ id, status }`, the UI finds that user in local state and updates the small dot color (green for online, gray for offline) without a full refresh.

---

## 📦 Project Structure
```
real-time-user-status/
├─ server.js
├─ package.json
├─ public/
│  └─ test.html         # optional UI to manually verify the real-time updates
└─ README.md
```

---

## 🛠️ Notes & Decisions
- **In-memory** store used to satisfy the task (no DB). A production version would persist users in a DB and handle authentication.
- We support **dynamic users**: if an unknown `userId` connects, the server adds them with the provided `name` (or default).
- We track **connection counts** per user to avoid "offline flicker" with multiple tabs.

---

## 🧪 How to Demonstrate
1. Start the server.
2. Open `public/test.html` in two tabs.
3. Connect tab A as user `1` and tab B as user `2`.
4. You’ll see both users turn 🟢 online and updates broadcast between tabs.
5. Close one tab to see that user flip to ⚪ offline.

---

## 🧭 Submission Checklist
- [ ] Push this code to a **public GitHub repo** (e.g., `real-time-user-status`).
- [ ] Include this README with setup and run instructions.
- [ ] Add your **Figma prototype link** to the README (you can add a section under this checklist).
- [ ] Verify `/users` endpoint and `statusUpdate` broadcasts using the test page or multiple clients.

---

## 🐙 GitHub Commands (Quick Reference)
```bash
# inside the project folder
git init
git add .
git commit -m "feat: real-time user status (Express + Socket.IO)"
git branch -M main
git remote add origin https://github.com/<your-username>/real-time-user-status.git
git push -u origin main
```

---

## 📄 License
MIT
