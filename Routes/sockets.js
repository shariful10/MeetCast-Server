const express = require("express");
const router = express.Router();

const socketPort = process.env.SOCKET_PORT || 5001;

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(router);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
	console.log(`user Connected ${socket.id}`);
	socket.on("join_room", (data) => {
		console.log("joining room", data);
		socket.join(data);
	});

  socket.on("messege to server", (data) => {
    console.log("setting room", data.room);
    socket.to(data.room).emit("recieve_message", data);
    // socket.broadcast.emit("recieve_message", data);
  });
  socket.on("disconnect",()=>{
	  console.log("user Disconnected", socket.id)
  })
})  

server.listen(socketPort, () => {
  console.log(`Socket io is running at Port ${socketPort}`);
});

module.exports = router