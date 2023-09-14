const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const socketServer = require("./Routes/sockets")

//middleware
app.use(cors());
app.use(express.json());
app.use("/socket", socketServer);

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
		const roomsCollection = client.db("meetcastDb").collection("rooms");
		const profileCollection = client.db("meetcastDb").collection("profile");
		const meetingsCollection = client.db("meetcastDb").collection("meetings");

		// JWT Tokens
		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});
			res.send({ token });
		});

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

		// Get User
		
		app.get("/users", async (req, res) => {
			const result = await usersCollection.find().toArray();
			res.send(result);
		});
		
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;
			const result = await usersCollection.findOne({ email: email });
			res.send(result);
		});

		// Room Save to Database
		app.post("/rooms", async (req, res) => {
			const myRoom = req.body;
			const result = await roomsCollection.insertOne(myRoom);
			res.send(result);
		});

		app.get("/rooms/:email", async (req, res) => {
			const result = await roomsCollection.find().toArray();
			res.send(result);
		});

		app.put("/rooms/:roomId", async (req, res) => {
			const roomId = req.params.roomId;
			const { newName } = req.body;

			try {
				const updateResult = await roomsCollection.updateOne(
					{ _id: new ObjectId(roomId) }, // Use new ObjectId()
					{ $set: { roomName: newName } }
				);

				if (updateResult.modifiedCount > 0) {
					res.status(200).send("Room renamed successfully");
				} else {
					res.status(404).send("Room not found");
				}
			} catch (error) {
				console.error("Error updating room:", error);
				res.status(500).send("An error occurred while renaming the room");
			}
		});

		app.get("/rooms/:email", async (req, res) => {
			const result = await roomsCollection.find().toArray();
			res.send(result);
		});

		app.put("/rooms/:roomId", async (req, res) => {
			const roomId = req.params.roomId;
			const { newName } = req.body;

			try {
				const updateResult = await roomsCollection.updateOne(
					{ _id: new ObjectId(roomId) }, // Use new ObjectId()
					{ $set: { roomName: newName } }
				);

				if (updateResult.modifiedCount > 0) {
					res.status(200).send("Room renamed successfully");
				} else {
					res.status(404).send("Room not found");
				}
			} catch (error) {
				console.error("Error updating room:", error);
				res.status(500).send("An error occurred while renaming the room");
			}
		});

		app.get("/rooms/:email", async (req, res) => {
			const result = await roomsCollection.find().toArray();
			res.send(result);
		});

		// get specific meeting
		app.get("/meetings/:email", async (req, res) => {
			const email = req.params.email;
			const result = await meetingsCollection.find({email: email}).toArray();
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
