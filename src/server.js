import express from "express";
import http from "http";
// import WebSocket from "ws";
import {WebSocketServer} from "ws";
// import SocketIO from "socket.io";
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");


const app = express();

// part for the express.js

// ==== Http ==== // 
//1) set the views
app.set("view engine", 'pug');
// _dirname -> 현재의 파일(file)이 위치한 폴더(directory)의 절대경로(absolute path)를 알려줍니다.
app.set("views", __dirname + "/views");

// public is executed on the frontend
app.use("/public", express.static(__dirname + "/public"));

// 2) to the home page
app.get("/", (req, res) => res.render("home"));
// if user enters any other things besides home, redirect to the home
app.get("/*", (req, res) => res.redirect("/")); 
const handleListen = () => console.log(`Listening on ws://localhost:3000`);
// app.listen(3000, handleListen);


// ==== WebSocket ==== //
// create http server
const server = http.createServer(app);
// create ws server on top of http server
const wss = new WebSocketServer({ server });
// we are doing this to expose our http server so then we can create a wss sever on top of http server
// on the same port, both http & ws can be used

// container for all the sockets
// it is to receive message among different sockets
const sockets = [];

// wss is the basic protocol,  we have to make our own funcitons
// this is the manual version
// wss.on("connection", (socket) => {
//     sockets.push(socket); // we will add each connected socket into the array
//     socket["nickname"] = "annon";
//     console.log("connected to Browser!!");
//     socket.on("close", () => console.log("Disconnected from the browser"));

//     // executes when the socket sends a message
//     // msg -> JSON.stringify from the frontend
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);

//         switch (message.type){
//             // if parsed.type === "new_message"
//             case "new_message":
//                 sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//                 break; // to prevent using the message.payload as a nickname
//             case "nickname":
//                 console.log(message.payload);
//                 socket["nickname"] = message.payload;
//                 break;
//         };
        
//     });
// });



// ======= Socket IO ======= //
// ====== For Live Chat Feature ====== //
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(wsServer, {
    auth: false,
    mode: "development",
});

// to give public rooms

function publicRooms(){
    const sids = wsServer.sockets.adapter.sids;
    const rooms = wsServer.sockets.adapter.rooms;
    // or 
    // const {
    //     sockets: {
    //       adapter: { sids, rooms },
    //     },
    // } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
};

// count the number of rooms
function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
};

wsServer.on('connection', (socket) => {
    socket["nick_name"] = "Anon";
    
    // to check all the events on the socket
    socket.onAny((event) => {
        console.log(`socket event: ${event}`);
        console.log(wsServer.sockets.adapter);
    });

    // once we enter the room
    socket.on("enter_room", (roomName, done) => {
        // entering the room
        socket.join(roomName);
        console.log(socket.rooms);
        done(); 
        // done () only initiates backendDone(), not running on backend!!
        // we are running the connected function which is 'backendDone' function on the frontend

        socket.to(roomName).emit("welcome", socket.nick_name, countRoom(roomName)); // sending message yo one socket

        wsServer.sockets.emit("room_change", publicRooms()); // sending message to all the sockets
    });

    // disconnection event
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit("bye", socket.nick_name, countRoom(room)-1); // socket.nick_name -> event from the frontend
        });
    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });


    //nickname
    socket.on("nick_name", (nickname) => {socket["nick_name"] = nickname}); // nickname sent from the frontend

    // new message event
    // msg -> input.value, room -> roomName, done -> last argument which is the function
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nick_name} : ${msg}`);
        done(); // this will execute the function from the frontend
    });

    
});

httpServer.listen(3000, handleListen);


