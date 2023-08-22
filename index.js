const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const socketPort = process.env.PORT || 5001;

// Forsocket io
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

// forsocket io

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

	socket.join("join_room", (room) => {
		socket.join(room);
	});

	socket.on("the message", (data) => {
		socket.broadcast.emit("recieve_message", data);
	});
});

server.listen(socketPort, () => {
	console.log("Socket io is running");
});

// JWT authentication
const verifyJWT = (req, res, next) => {
	const authorization = req.headers.authorization;
	if (!authorization) {
		return res.status(401).send({ error: true, message: "Invalid Token" });
	}
	// Bearer token
	const token = authorization.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res.status(401).send({ error: true, message: "Invalid Token" });
		}
		req.decoded = decoded;
		next();
	});
};

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

		// JWT tokens
		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
			res.send({ token });
		});

		// User collection
		app.put("/users/:email", async (req, res) => {
			const email = req.params.email;
			const user = req.body;
			const options = { upsert: true };
			const updateDoc = {
				$set: user,
			};
			const result = await usersCollection.updateOne({ email: email }, updateDoc, options);
			console.log(result);
			res.send(result);
		});

		// Get User
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;
			const result = await usersCollection.findOne({ email: email });
			res.send(result);
		});


		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Meetcast Server is running...");
});

app.listen(port, () => {
	console.log(`Meetcast is running on port ${port}`);
});
