const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const socketPort = process.env.PORT || 5001;
const { generateToken04 } = require("./zegoServerAssistant");

// for socket io
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// For ZegoCLoud
app.get("/token", (req, res) => {
  const appID = 2059610707;
  const serverSecret = "5692269139171731f75d087ec95f3344";
  const userId = "user1";
  const effectiveTimeInSeconds = 3600;
  const payload = "";

  const token = generateToken04(
    appID,
    userId,
    serverSecret,
    effectiveTimeInSeconds,
    payload
  );
  console.log("Akhtar:", token);
  res.send(token);
});

// For ZegoCLoud

// for socket io

// Middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
//middleware

// Socket io
io.on("connection", (socket) => {
  console.log(`user Connected ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
  });

  socket.on("the message", (data) => {
    // socket.to(data.room).emit("recieve_message", data);
    socket.broadcast.emit("recieve_message", data);
  });
});

server.listen(socketPort, () => {
  console.log("Socket io is running");
});
// socket io

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bq2ef3t.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("meetcastDb").collection("users");

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Meetcast Server is running...");
});

app.listen(port, () => {
  console.log(`Meetcast is running on port http://localhost:${port}`);
});
