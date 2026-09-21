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

        socket.on("join-call", (path) => {

            if (connections[path] === undefined) {
                connections[path] = []
            }

            connections[path].push(socket.id);

            timeOnline[socket.id] = new Date();

            connections[path].forEach(elem => {
                io.to(elem).emit("user-joined", socket.id, connections[path])
            });

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

        socket.on("video-toggle", (isMyVideoOn) => {
           
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [room, isFound];
            }, ["", false]);

            if (found) {

                connections[matchingRoom].forEach((elem) => {
                    
                    io.to(elem).emit("video-toggle", socket.id, isMyVideoOn);
                });
            }
        });
        

        socket.on("chat-message", (data, sender) => {
           
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

                
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })


        
        socket.on("disconnect", () => {
            var diffTime = Math.abs(timeOnline[socket.id] - new Date())
            var key

            for (const [k, v] of Object.entries(connections)) {
                let index = v.indexOf(socket.id); 

                if (index !== -1) {
                    key = k;

                    
                    for (let a = 0; a < connections[key].length; ++a) {
                        io.to(connections[key][a]).emit('user-left', socket.id)
                    }

                    
                    connections[key].splice(index, 1);

                    if (connections[key].length === 0) {
                        delete connections[key]
                    }

                    console.log(`${socket.id} left room: ${key}`);
                    break; 
                }
            }
        })
    })

    return io;
}