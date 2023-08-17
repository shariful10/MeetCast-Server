const express = require('express');
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const socketPort = process.env.PORT || 5001;

// forsocket io
const http = require('http');
const {Server} = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ["GET", "POST"],
    },
})

// forsocket io

// Middleware
const corsOptions = {
	// origin: "*",  
	credentials: true,
	optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

//Middleware

app.get("/", (req, res) => {
	res.send("Meetcast Server is running...");
});

app.listen(port, () => {
	console.log(`Meetcast is running on port ${port}`);
});

// socket io 
io.on("connection", (socket)=>{
    console.log(`user Connected ${socket.id}`)
    
    socket.join("join_room", (room)=>{
        socket.join(room)
    })

    socket.on("the message", (data)=>{
        socket.broadcast.emit("recieve_message", data)
    })
})

server.listen(socketPort, ()=>{
    console.log("Socket io is running")
})
// socket io 