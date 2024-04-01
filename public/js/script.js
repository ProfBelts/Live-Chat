$(document).ready(function () {
    const socket = io();
    let name = prompt("What is your name?");

    // Emit the username to the server
    socket.emit("new_user", name);

    // Listen for messages from the server
    socket.on("message", function (data) {
        displayMessage(data); // Display the received message
    });

    // Listen for updates to the participants list
    socket.on("user_connected", function (participants) {
        updateParticipantsList(participants);
    });

    // Listen for user disconnection
    socket.on("user_disconnected", function (username) {
        removeParticipant(username);
    });

    // Function to update participants list
    function updateParticipantsList(participants) {
        $(".participants-list").empty(); // Clear existing list
        participants.forEach((participant) => {
            $(".participants-list").append("<li>" + participant + "</li>");
        });

        // Update the recipient dropdown list with current user's name and "Everyone" option
        $(".recipient-dropdown").empty(); // Clear existing options
        $(".recipient-dropdown").append(
            `<option value="everyone">Everyone</option>`
        ); // Add Everyone option
        participants.forEach((participant) => {
            $(".recipient-dropdown").append(
                `<option value="${participant}">${participant}</option>`
            );
        });
    }

    // Function to remove a participant from the list
    function removeParticipant(username) {
        $(".participants-list li").each(function () {
            if ($(this).text() === username) {
                $(this).remove();
            }
        });
    }

    // Handle chat history from the server
    socket.on("chat_history", function (history) {
        $(".chat-message").empty(); // Clear existing messages
        history.forEach((entry) => {
            displayMessage(entry); // Display each message in the chat history
        });
    });

    // Function to display a message in the chat
    function displayMessage(data) {
        const isPrivateMessage =
            data.recipient !== "everyone" && data.recipient !== name;
        if (!isPrivateMessage || data.recipient === "everyone") {
            $(".chat-message").append(
                `<h3>${data.user}</h3> <p>${data.text}</p>`
            );
        }
    }

    // Handle form submission
    $(".message-form").submit(function (e) {
        e.preventDefault();
        let message = $(".message-input").val();
        let recipient = $(".recipient-dropdown").val();

        // Emit the message based on recipient selection
        if (recipient === "everyone") {
            socket.emit("send_message", {
                message: message,
                recipient: "Everyone",
            });
        } else {
            socket.emit("send_message", {
                message: message,
                recipient: recipient,
            });
        }

        // Display the sent message for the sender
        displayMessage({ user: name, text: message, recipient: recipient });

        $(".message-input").val("");
    });
});
