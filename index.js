const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.json()); // Middleware to parse JSON data
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const users = []; // Array to store user objects

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  console.log("POST /api/users - username:", username); // Log the received username

  if (!username) {
    return res.status(400).send("Username is required");
  }

  // Check if the username already exists in the users array
  if (users.some((user) => user.username === username)) {
    return res.status(400).send("Username already exists");
  }

  try {
    const { nanoid } = await import("nanoid");
    const _id = nanoid(24);
    const newUser = { username, _id, exerciseLog: [] }; // No need to initialize count here
    users.push(newUser); // Add new user to the users array
    console.log("POST /api/users - New user added:", newUser); // Log the new user added
    return res.json({ username, _id });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error generating short User");
  }
});

// Endpoint to add an exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = users.find((user) => user._id === userId);

  if (!user) {
    return res.status(404).send("User not found");
  }

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
  };

  user.exerciseLog.push(exercise);

  return res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = users.find((user) => user._id === userId);

  if (!user) {
    return res.status(404).send("User not found");
  }

  let logs = user.exerciseLog;

  if (from) {
    const fromDate = new Date(from);
    logs = logs.filter((exercise) => new Date(exercise.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    logs = logs.filter((exercise) => new Date(exercise.date) <= toDate);
  }

  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  return res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs,
  });
});

app.get("/api/users", (req, res) => {
  console.log("GET /api/users - users:", users); // Log the current users array
  res.json(users.map((user) => ({ username: user.username, _id: user._id })));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
