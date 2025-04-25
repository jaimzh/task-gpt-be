import express from "express";
import cors from "cors";
import { convertTextToTasks } from "./ai.mjs";
import { connectToDB, getDB } from "./db.js";
import { ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
  ? "https://task-gpt-fe.vercel.app/"  
  : "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));

// AI POST ROUTE
app.post("/generate-ai-tasks", async (req, res) => {
  const db = getDB();
  const { prompt } = req.body;

  try {
    const aiText = await convertTextToTasks(prompt);
    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/'/g, '"')
      .trim();

    const tasks = JSON.parse(cleanedText);
    tasks.forEach(task => (task.isCompleted = false));

    const result = await db.collection("tasks").insertMany(tasks);
    tasks.forEach((task, index) => (task._id = result.insertedIds[index]));

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// GET all tasks
app.get("/tasks", async (req, res) => {
  const db = getDB();
  const tasks = await db.collection("tasks").find().toArray();
  res.json(tasks);
});

// POST new task
app.post("/tasks", async (req, res) => {
  const db = getDB();
  const newTask = {
    ...req.body,
    isCompleted: false
  };

  const result = await db.collection("tasks").insertOne(newTask);
  newTask._id = result.insertedId;

  res.status(200).json(newTask);
});

// DELETE a task
app.delete("/tasks/:id", async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;

  const result = await db.collection("tasks").deleteOne({ _id: new ObjectId(taskId) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json({ message: `Task ${taskId} has been deleted` });
});

// PUT (full update)
app.put("/tasks/:id", async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;
  const updatedTask = req.body;

  const result = await db.collection("tasks").findOneAndUpdate(
    { _id: new ObjectId(taskId) },
    { $set: updatedTask },
    { returnDocument: "after" }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(200).json({ message: "Task successfully updated" });
});

// PATCH (update isCompleted only)
app.patch("/tasks/:id/completed", async (req, res) => {
  const db = getDB();
  const taskId = req.params.id;
  const { isCompleted } = req.body;

  const result = await db.collection("tasks").findOneAndUpdate(
    { _id: new ObjectId(taskId) },
    { $set: { isCompleted } },
    { returnDocument: "after" }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(200).json({ message: "Task successfully updated"});
});

// Root route
app.get("/", (req, res) => {
  res.send("Hello from your task backend!");
});




// Start server after DB connects
connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
