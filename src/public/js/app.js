// connecting soectIO to our frontend
const socket = io(); // automatically running the server socketIO
const welcome = document.getElementById("welcome")
const roomForm = welcome.querySelector("form");

const room = document.getElementById("room");
room.hidden = true;
let roomName = "";

const nameForm = welcome.querySelector("#name");

function backendDone(){
    console.log('backend done');
};

// ====== First Main Page ====== //
// 1) Enter the room number that user wants to enter
// 2) Display the room number and trigger showRoom function
function handleRoomSubmit(event){
    event.preventDefault();
    const input = roomForm.querySelector("input");
    roomName = input.value;
    socket.emit("enter_room", input.value, showRoom);
    // 1) we can send an object, doesn't have to be a string
    // 2) we can send any event, "event_room" is the event and sent to backend
    // we are running the connected function which is 'backendDone' function on the frontend
    // to do this, we must include a function as the last argument inside .emit()
    input.value = "";
};

// nicknames
function handleNickNameSubmit(event){
    event.preventDefault();
    const input = welcome.querySelector("#name input");
    socket.emit("nick_name", input.value);
    // console.log("nickname function executed");
};

roomForm.addEventListener("submit", handleRoomSubmit);
nameForm.addEventListener("submit", handleNickNameSubmit); // to submit message


// 1) hide the room enter block and display message enter block
// 2) Clicking 'Send' button will triggeer handleMessageSubmit function
function showRoom(){
    welcome.hidden = true;
    nameForm.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;

    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit); // to submit the name
};

// display the message that we sent
function addMessage(message){
    const ul = room.querySelector('ul');
    const li = document.createElement('li');
    li.innerText = message;
    ul.appendChild(li);
};

// sending the message to the backend after entering 'Send' button
function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");

    /** Working Mechanism!! */
    // 1) from the brower(client), we are sending this event, 'new_message' with the arguments
    // 2) 'new_message' event will hit the sever 
    // 3) server will send 'new_message' event, which is from .emit("new_message"...)
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You : ${input.value}`);
        input.value = "";
    });
};




// Events sent from the server, socket.emit events
// backend signals to trigger function from the frontend

socket.on('welcome', (user, newCount) => {
    addMessage(`${user} joined`);
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} : ${newCount}`;
});

socket.on("bye", (user, newCount) => {
    addMessage(`${user} left`);
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} has ${newCount}`;
});

socket.on("new_message", addMessage); // have to study more on this part

//socket.on("room_change", (msg) => console.log(msg));
// console.log == (msg) => console.log(msg)

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    let roomAvail = welcome.querySelector("h4");
    roomList.innerHTML = "";

    // if no rooms are available, display the message
    if(rooms.length == 0){
        roomAvail.innerText = "No rooms are Available at the moment";
        return;
    };

    // if we have available rooms
    roomAvail.innerText = "Current Available Rooms";
    rooms.forEach((room)=>{
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});