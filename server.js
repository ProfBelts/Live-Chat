const express = require("express");
const app = express();
const path = require("path");

// Set up static files and view engine
app.use(express.static(path.join(__dirname, "./public")));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

// Render views/index.ejs when the client requests "/"
app.get("/", function (req, res) {
    res.render("index", { users: connectedUsers });
});

// Listen for socket connections
const server = app.listen(8000);
const io = require("socket.io")(server);
let connectedUsers = [];
let chatHistory = [];

// Listen for "connection" event from the client
io.on("connection", function (socket) {
    // Prompt the user for their name
    socket.on("new_user", function (username) {
        socket.username = username;
        connectedUsers.push(username);
        io.emit("user_connected", connectedUsers);
    });

    // Send chat history to user
    socket.emit("chat_history", chatHistory);
    // Send chat history to user
    io.emit("chat_history", chatHistory);

    // Listen for "send_message" event from the clientnt
    socket.on("send_message", function (data) {
        const { message, recipient } = data; // Destructure data object to extract message and recipient

        if (recipient === "Everyone") {
            // If recipient is "Everyone", broadcast the message to all connected users except the sender
            io.emit("message", {
                user: socket.username,
                text: message,
                recipient: "everyone",
            });
        } else {
            // If recipient is a specific user, find the corresponding socket and emit the message to that user only
            io.sockets.sockets.forEach((sock) => {
                if (sock.username === recipient) {
                    sock.emit("message", {
                        user: socket.username,
                        text: message,
                        recipient: recipient,
                    });
                }
            });
        }
        // Append the message to the chat history for the sender and the recipient
        chatHistory.push({
            user: socket.username,
            text: message,
            recipient: recipient === "Everyone" ? "everyone" : recipient,
        });

        // Emit the updated chat history to all clients
        io.emit("chat_history", chatHistory);
    });

    // Listen for "disconnect" event from the client
    socket.on("disconnect", () => {
        if (socket.username) {
            const index = connectedUsers.indexOf(socket.username);
            if (index > -1) {
                connectedUsers.splice(index, 1);
                io.emit("user_disconnected", socket.username);
            }
        }
    });
});
