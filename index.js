const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
	const authorization = req.headers.authorization;
	if (!authorization) {
		return res.status(401).send({ error: true, message: "Invalid Token" });
	}
	console.log(authorization);

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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
		const profileCollection = client.db("meetcastDb").collection("profile");
		const meetingsCollection = client.db("meetcastDb").collection("meetings");
		const blogsCollection = client.db("meetcastDb").collection("blogs");

		// JWT Tokens
		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});
			res.send({ token });
		});

		const verifyAdmin = async (req, res, next) => {
			const email = req.decoded.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			console.log(user);
			if (user?.role !== "admin") {
				return res.send({ admin: false });
			}
			next();
		};

		//userProfile Information

		app.post("/userProfile", async (req, res) => {
			const userProfile = req.body;
			const result = await profileCollection.insertOne(userProfile);
			res.send(result);
		});

		app.get("/userProfile", async (req, res) => {
			const result = await profileCollection.find().toArray();
			console.log(result);
			res.send(result);
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

		// Get Specific User By Id
		app.get("/users/:id", async (req, res) => {
			const id = req.params.id;
			const result = await usersCollection.findOne({ _id: new ObjectId(id) });
			res.send(result);
		});

		// Get Specific User By Email
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;
			const result = await usersCollection.findOne({ email: email });
			res.send(result);
		});

		// Get All User
		app.get("/users", async (req, res) => {
			const result = await usersCollection.find().toArray();
			res.send(result);
		});

		// Change User Email Role
		app.patch("/users/editor/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updatedDoc = {
				$set: {
					role: "editor",
				},
			};
			const result = await usersCollection.updateOne(filter, updatedDoc);
			res.send(result);
		});

		app.get("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
			const email = req.params.email;

			if (req.decoded.email !== email) {
				res.send({ admin: false });
			}
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			const result = { admin: user?.role === "admin" };
			res.send(result);
		});

		app.get("/users/editor/:email", verifyJWT, async (req, res) => {
			const email = req.params.email;

			if (req.decoded.email !== email) {
				res.send({ editor: false });
			}

			const query = { email: email };
			const user = await usersCollection.findOne(query);
			const result = { editor: user?.role === "editor" };
			res.send(result);
		});

		// get specific meeting
		app.get("/meetings/:email", async (req, res) => {
			const email = req.params.email;
			const result = await meetingsCollection.find({ email: email }).toArray();
			res.send(result);
		});

		// save meeting
		app.post("/meetings", async (req, res) => {
			try {
				const meetingData = req.body;
				const result = await meetingsCollection.insertOne(meetingData);

				res.status(200).send("Meeting scheduled successfully");
			} catch (error) {
				console.error("Error scheduling meeting:", error);
				res.status(500).send("An error occurred while scheduling the meeting");
			}
		});

		// delete meeting
		app.delete("/meetings/:id", async (req, res) => {
			const meetingId = req.params.id;
			try {
				const deleteResult = await meetingsCollection.deleteOne({
					_id: new ObjectId(meetingId),
				});

				if (deleteResult.deletedCount === 1) {
					res.status(200).send("Meeting deleted successfully");
				} else {
					res.status(404).send("Meeting not found");
				}
			} catch (error) {
				console.error("Error deleting meeting:", error);
				res.status(500).send("An error occurred while deleting the meeting");
			}
		});

		// Save a Blogs Data in Database
		app.post("/blogs", async (req, res) => {
			const room = req.body;
			const result = await blogsCollection.insertOne(room);
			res.send(result);
		});

		// Get all Rooms
		app.get("/blogs", async (req, res) => {
			const result = await blogsCollection.find().toArray();
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
