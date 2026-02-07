import { Server } from "socket.io"

let connections = {}
let messages = {}
let timeOnline = {}

export const createToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["get", "post"],
            allowedHeaders: "*",
            credentials: true
        }
    })

    io.on("connection", (socket) => {

        // ✅ FIXED join-call Logic
        // ... (बाकी कोड समान है)

        // ✅ FIXED join-call Logic
        socket.on("join-call", (path) => {

            if (connections[path] === undefined) {
                connections[path] = []
            }

            // 1. यूजर को लिस्ट में जोड़ें
            connections[path].push(socket.id);

            // 2. टाइम नोट करें
            timeOnline[socket.id] = new Date();

            // 🔥 FIX: यह लूप सबको मैसेज भेजेगा (खुद को भी)
            // तभी Tab 2 को पता चलेगा कि उसे Offer create करना है
            connections[path].forEach(elem => {
                io.to(elem).emit("user-joined", socket.id, connections[path])
            });

            // ... (बाकी कोड समान है)

            // 3. अगर पुराने चैट मैसेज हैं तो भेजें
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    )
                }
            }

            console.log(`${socket.id} joined room: ${path}`);
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message)
        })

        // 👇👇👇 (यह कोड गायब है, इसे पेस्ट करें) 👇👇👇
        // 🎥 Video Toggle Event (Backend Logic)
        // यह कोड Backend फाइल में socket.on("connection") के अंदर आएगा

        socket.on("video-toggle", (isMyVideoOn) => {
            // 1. रूम ढूंढो
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [room, isFound];
            }, ["", false]);

            if (found) {
                // 2. रूम के बाकी लोगों को बताओ
                connections[matchingRoom].forEach((elem) => {
                    // socket.id = जिसने बटन दबाया
                    // isMyVideoOn = उसका नया स्टेटस (true/false)
                    io.to(elem).emit("video-toggle", socket.id, isMyVideoOn);
                });
            }
        });
        // 👆👆👆

        socket.on("chat-message", (data, sender) => {
            // रूम ढूंढने का लॉजिक
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ["", false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }
                messages[matchingRoom].push({ 'sender': sender, 'data': data, "socket-id-sender": socket.id })
                console.log(messages)

                // 🔥 मैसेज रूम के बाकी लोगों को भी भेजना पड़ेगा
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })


        // ✅ FIXED Disconnect Logic
        socket.on("disconnect", () => {
            var diffTime = Math.abs(timeOnline[socket.id] - new Date())
            var key

            for (const [k, v] of Object.entries(connections)) {
                let index = v.indexOf(socket.id); // यूजर को ढूंढो

                if (index !== -1) {
                    key = k;

                    // रूम के बाकी लोगों को बताओ कि यूजर चला गया
                    for (let a = 0; a < connections[key].length; ++a) {
                        io.to(connections[key][a]).emit('user-left', socket.id)
                    }

                    // 🔥 CRITICAL FIX: splice(index, 1) use karein
                    connections[key].splice(index, 1);

                    if (connections[key].length === 0) {
                        delete connections[key]
                    }

                    console.log(`${socket.id} left room: ${key}`);
                    break; // मिल गया तो लूप बंद करो
                }
            }
        })
    })

    return io;
}