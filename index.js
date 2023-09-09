const express = require("express");
const app = express();
const cors = require("cors");
const SSLCommerzPayment = require("sslcommerz-lts");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { generateToken04 } = require("./zegoServerAssistant");
const socketPort = process.env.PORT || 5001;

// sslcommerz payment key
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

// for socket io
// const http = require("http");
// const { Server } = require("socket.io");

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"],
//   },
// });

// for socket io

// Middleware
app.use(cors());
app.use(express.json());

// // Socket io
// io.on("connection", (socket) => {
// 	console.log(`user Connected ${socket.id}`);
// 	socket.on("join_room", (data) => {
// 		console.log("joining room", data);
// 		socket.join(data);
// 	});

  socket.on("messege to server", (data) => {
    console.log("setting room", data.room);
    socket.to(data.room).emit("recieve_message", data);
    // socket.broadcast.emit("recieve_message", data);
  });
  socket.on("disconnect",()=>{
	console.log("user Disconnected", socket.id)
})
});

server.listen(socketPort, () => {
  console.log("Socket io is running");
});
// socket io

// For ZegoCLoud
app.get("/token", (req, res) => {
	const appID = 2059610707;
	const serverSecret = "5692269139171731f75d087ec95f3344";
	const userId = "user1";
	const effectiveTimeInSeconds = 3600;
	const payload = "";

	const token = generateToken04(appID, userId, serverSecret, effectiveTimeInSeconds, payload);
	console.log("Akhtar:", token);
	res.send(token);
});

// For ZegoCLoud

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
    const userAddress = client
      .db("meetcastDb")
      .collection("UserPaymentAddress ");
    const monthlyCololection = client.db("meetcastDb").collection("monthly");
    const yearlyCololection = client.db("meetcastDb").collection("yearly");
    const orderCololection = client.db("meetcastDb").collection("order");
    const roomsCollection = client.db("meetcastDb").collection("rooms");
    const meetingsCollection = client.db("meetcastDb").collection("meetings");

    // JWT tokens
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
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
      const result = await usersCollection.updateOne(
        { email: email },
        updateDoc,
        options
      );
      console.log(result);
      res.send(result);
    });

    // Get User
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

    app.get("/monthly", async (req, res) => {
      const result = await monthlyCololection.find().toArray();
      res.send(result);
    });

    app.get("/yearly", async (req, res) => {
      const result = await yearlyCololection.find().toArray();
      res.send(result);
    });

    // priceing id

    app.get("/monthly/:id", async (req, res) => {
      try {
        const id = req.params.id; // Use req.params to access the URL parameter

        console.log(id);
        // Assuming you have a MongoDB collection named "monthlyCollection"
        // Replace with your actual collection name
        const result = await monthlyCololection.findOne({
          _id: new ObjectId(id),
        });

        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ error: "Not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/yearly/:id", async (req, res) => {
      const id = req.body;
      console.log(id);
      const result = await yearlyCololection.find().toArray();
      res.send(result);
    });

    // order

    app.post("/order", async (req, res) => {
      console.log(req.body.planId);

      const tranId = new ObjectId().toString();

      const product = await monthlyCololection.findOne({
        _id: new ObjectId(req.body.planId),
      });

      const data = {
        total_amount: product?.price,
        currency: "USD",
        tran_id: tranId, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${tranId}`,
        fail_url: "http://localhost:3030/fail",
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: "Customer Name",
        cus_email: "customer@example.com",
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);
      });

      const finalOrder = { product, paidStatus: false, transactionId: tranId };

      const result = orderCololection.insertOne(finalOrder);

      app.post("payment/success/:tranId", async (req, res) => {
        console.log("tran", req.params.tranId);
        const result = orderCololection.updateOne(
          { transactionId: req.params.tranId },
          {
            $set: {
              paidStatus: true,
            },
          }
        );
      });

      if (result.modifiedCount > 0) {
        res.redirect(
          `http://localhost:5173/payment/success/${req.params.tranId}`
        );
      }
    });

    // Payment User Address

    app.post("/userAddress", async (req, res) => {
      try {
        const address = req.body;
        console.log(address);
        const result = await userAddress.insertOne(address);

        res.status(201).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.get("/userAddress", async (req, res) => {
      try {
        const result = await userAddress.find().toArray();

        res.status(201).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Payment Gateway SSLcommerz

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
  console.log(`Meetcast is running on port ${port}`);
});
