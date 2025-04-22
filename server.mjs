import express from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { convertTextToTasks } from "./ai.mjs";
const app = express();
import cors from "cors";

app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));

const PORT = 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tasksFile = path.join(__dirname, "tasks.json");
const getTasks = () => {
  const data = fs.readFileSync(tasksFile, "utf-8");
  return JSON.parse(data);
};

//AI POST ROUTE
app.post("/generate-ai-tasks", async (req, res) => {
  const { prompt } = req.body;

  try {
    const aiText = await convertTextToTasks(prompt);
    const cleanedText = aiText
      .replace(/```json/g, "") // Remove the opening code block markdown
      .replace(/```/g, "") // Remove the closing code block markdown
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .trim();

  
    const tasks = JSON.parse(cleanedText); // Parse the cleaned JSON
    tasks.forEach((task) => {
      task.id = uuidv4(); // Generate a unique ID
      task.isCompleted = false;
    });

    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));

    if (!cleanedText || cleanedText.length < 3) {
      return res
        .status(400)
        .json({ error: "AI returned invalid or empty output." });
    }

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// GET ROUTE
app.get("/tasks", (req, res) => {
  const tasks = getTasks();
  res.json(tasks);
});

// POST ROUTE
app.post("/tasks", (req, res) => {
  const newTask = req.body;
  const tasks = getTasks();

  newTask.id = uuidv4();
  newTask.isCompleted = false;
  tasks.push(newTask);

  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
  res.status(200).json(newTask);
});

// DELETE ROUTE
app.delete("/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  const tasks = getTasks();

  const filteredTasks = tasks.filter((task) => task.id !== taskId);

  if (filteredTasks.length === tasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  fs.writeFileSync(tasksFile, JSON.stringify(filteredTasks, null, 2));
  res.json({ message: `Task ${taskId} has been deleted` });
});

// PUT ROUTE
app.put("/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  const updatedTaskData = req.body;

  let tasks = getTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTaskData };

  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
  res.status(200).json(tasks[taskIndex]);
});

// PATCH ROUTE for updating the isCompleted field
app.patch("/tasks/:id/completed", (req, res) => {
  const taskId = req.params.id;
  const { isCompleted } = req.body;

  let tasks = getTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks[taskIndex].isCompleted = isCompleted;

  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));

  res.status(200).json(tasks[taskIndex]);
});

app.get("/", (req, res) => {
  res.send("Hello from your task backend!");
});

app.listen(PORT, () => {
  console.log(`app listening on port server 1 ${PORT}`);
});
