import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import style from "../styles/VideoComponents.module.css"
import io from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useParams } from 'react-router-dom';
import server from '../environment';





const server_url = server

var connections = {}

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" },
    ]
}

export default function VideoMeetComponents() {

    var socketRef = useRef()
    let socketIdRef = useRef()
    let localVideoRef = useRef()

    const { url } = useParams();

    let routeTo = useNavigate()

    let [videoAvailable, setVideoAvailable] = useState(true)
    let [audioAvailable, setAudioAvailable] = useState(true)
    let [video, setVideo] = useState(true)
    let [audio, setAudio] = useState(true)
    let [screen, setScreen] = useState(false)
    let [showModal, setShowModal] = useState(true)
    let [screenAvailable, setScreenAvailable] = useState()
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("")
    let [newMessages, setNewMessages] = useState(0)
    let [askForUsername, setAskForUsername] = useState(true)
    let [username, setUsername] = useState(sessionStorage.getItem("name") || "")
    let [isChatOpen, setIsChatOpen] = useState(false);

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])

    const getParmistion = async () => {
        try {
            const videoParmistion = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoParmistion) {
                setVideoAvailable(true)
            } else {
                setVideoAvailable(false)
            }
            const audioParmistion = await navigator.mediaDevices.getUserMedia({ audio: true })
            if (audioParmistion) {
                setAudioAvailable(true)
            } else {
                setAudioAvailable(false)
            }
            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true)
            } else {
                setScreenAvailable(false)
            }
            if (videoParmistion || audioParmistion) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoParmistion, audio: audioParmistion })
                if (userMediaStream) {
                    window.localStream = userMediaStream
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream
                    }
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        getParmistion();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }, [])

    useEffect(() => {
        if (!sessionStorage.getItem("token")) {
            // Agar token nahi mila, to wapas Login par bhejo
            routeTo("/auth");
        }
    }, []);

    // 🔥 FIX: जैसे ही कनेक्ट हो, लोकल वीडियो को फिर से सेट करो
    useEffect(() => {
        if (!askForUsername && localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername, video]); // ✅ 'video' भी जोड़ दिया



    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        // 🔍 CHECK: क्या सिग्नल आ रहा है?
        console.log(`📩 Signal Received from ${fromId}`, signal.type || "ICE Candidate");

        if (fromId !== socketIdRef.current) {
            if (!connections[fromId]) {
                connections[fromId] = new RTCPeerConnection(peerConfigConnections)

                connections[fromId].onicecandidate = (event) => {
                    if (event.candidate !== null) {
                        socketRef.current.emit("signal", fromId, JSON.stringify({ 'ice': event.candidate }))
                    }
                }

                connections[fromId].ontrack = (event) => {
                    console.log(`📹 Stream Aayi Hai! (via Signal) from ${fromId}`);

                    let videoExist = videoRef.current.find((video) => video.socketId === fromId)

                    if (videoExist) {
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === fromId ? { ...video, stream: event.streams[0] } : video
                            )
                            videoRef.current = updatedVideos
                            return updatedVideos;
                        })
                    } else {
                        let newVideo = {
                            socketId: fromId,
                            stream: event.streams[0],
                            autoPlay: true,
                            playsinline: true
                        }
                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        })
                    }
                }

                if (window.localStream !== undefined && window.localStream != null) {
                    window.localStream.getTracks().forEach(track => {
                        connections[fromId].addTrack(track, window.localStream);
                    })
                }
            }

            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        console.log("🔔 Offer Accepted! Sending Answer...");
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }



    let addMessage = (data, sender, socketIdSender) => {

        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ])


        if (socketIdSender !== socketIdRef.current && chatOpenRef.current === false) {
            setNewMessages((prevMessages) => prevMessages + 1)
        }
    }

    const chatOpenRef = useRef(false);

    let toggleChat = () => {
        if (isChatOpen === false) {
            setShowModal(true)
            setIsChatOpen(true);
            setNewMessages(0);
            chatOpenRef.current = true; // 🔥 जैसे ही खोला, बैज हटा दिया (0 कर दिया)
        } else {
            // अगर चैट बंद कर रहे हैं
            setShowModal(false);
            setIsChatOpen(false);
            chatOpenRef.current = false;
        }
    }

    let connectToSocketServer = () => {
        if (socketRef.current && socketRef.current.connected) {
            return;
        }

        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", url) // Fixed Room ID
            socketIdRef.current = socketRef.current.id;
        });

        socketRef.current.on("chat-message", addMessage)

        socketRef.current.on("user-left", (id) => {
            console.log(`User left: ${id}`);

            // 1. Connection close aur delete karein
            if (connections[id]) {
                connections[id].close();
                delete connections[id];
            }

            // 2. Video list update karein
            setVideos((prevVideos) => {
                const remainingVideos = prevVideos.filter((video) => video.socketId !== id);

                // 🔥 LOGIC: Agar samne wala chala gaya aur ab koi nahi bacha (sirf aap ho)
                // Note: 'videos' state mein sirf remote users hote hain.
                if (remainingVideos.length === 0) {
                    console.log("Sab chale gaye, redirection to home...");
                    // Thoda delay taaki user ko achanak jhatka na lage
                    setTimeout(() => {
                        hendleEndCall();
                    }, 2000);
                }

                return remainingVideos;
            });
        });

        socketRef.current.on("user-joined", (id, clients) => {
            console.log("🚀 User Joined:", id);

            clients.forEach((socketListId) => {
                if (socketListId === socketIdRef.current) return;

                console.log(`🔗 Matching with ${socketListId}...`);

                connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => {
                        connections[socketListId].addTrack(track, window.localStream);
                    });
                    console.log(`📤 Tracks Added for ${socketListId}`);
                } else {
                    console.log("❌ NO LOCAL STREAM FOUND! (Camera issue?)");
                }

                connections[socketListId].onicecandidate = (event) => {
                    if (event.candidate !== null) {
                        socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
                    }
                }

                connections[socketListId].ontrack = (event) => {
                    console.log(`📹 STREAM RECEIVED from ${socketListId}`);

                    setVideos(prevVideos => {
                        const isAlreadyAdded = prevVideos.some(video => video.socketId === socketListId);

                        if (isAlreadyAdded) {

                            return prevVideos;
                        }

                        return [...prevVideos, {
                            socketId: socketListId,
                            stream: event.streams[0],
                            autoPlay: true,
                            playsinline: true
                        }];
                    });
                }
            });

            if (id === socketIdRef.current) {
                console.log("👋 I AM NEW USER - Initiating Call...");
                clients.forEach((clientId) => {
                    if (clientId === socketIdRef.current) return;

                    console.log(`✨ Sending Offer to ${clientId}`);
                    connections[clientId].createOffer().then((description) => {
                        connections[clientId].setLocalDescription(description).then(() => {
                            socketRef.current.emit("signal", clientId, JSON.stringify({ 'sdp': connections[clientId].localDescription }));
                        });
                    });
                });
            }
        });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("video-toggle", (userId, isVideoOn) => {
            setVideos((oldVideos) => {
                return oldVideos.map((video) => {
                    if (video.socketId === userId) {
                        return { ...video, videoActive: isVideoOn };
                    }
                    return video;
                });
            });
        });
    }

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) {
            console.log(e)
        }

        if (audio === false) {
            stream.getAudioTracks().forEach(track => track.enabled = false);
        }

        if (video === false) {
            stream.getVideoTracks().forEach(track => track.enabled = false);
        }

        window.localStream = stream
        localVideoRef.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            let videoSender = connections[id].getSenders().find(sender => sender.track.kind === 'video');
            if (videoSender && stream.getVideoTracks().length > 0) {
                videoSender.replaceTrack(stream.getVideoTracks()[0]);
            }

            let audioSender = connections[id].getSenders().find(sender => sender.track.kind === 'audio');
            if (audioSender && stream.getAudioTracks().length > 0) {
                audioSender.replaceTrack(stream.getAudioTracks()[0]);
            }
        }
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {

            navigator.mediaDevices.getUserMedia({ video: video, audio: true })
                .then(getUserMediaSuccess)
                .catch(e => console.log("❌ Camera Error:", e));
        } else {

        }
    }


    let connect = () => {
        setAskForUsername(false)
        connectToSocketServer()
    }

    let handleVideo = () => {
        const newVideoState = !video;
        setVideo(newVideoState);

        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = newVideoState;
            }
        }

        if (socketRef.current) {
            socketRef.current.emit("video-toggle", newVideoState);
        }
    }

    let handleAudio = () => {
        let newAudioState = !audio;
        setAudio(newAudioState);

        if (localVideoRef.current && localVideoRef.current.srcObject) {
            let currentStream = localVideoRef.current.srcObject;

            // उसके ऑडियो ट्रैक को Enable/Disable करें
            let audioTrack = currentStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = newAudioState;
            }
        }
    }


    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getVideoTracks().forEach(track => track.stop());
        } catch (e) { console.log(e); }

        let audioTrack = window.localStream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            let videoSender = connections[id].getSenders().find(sender => sender.track.kind === 'video');
            if (videoSender) videoSender.replaceTrack(stream.getVideoTracks()[0]);
        }

        stream.getVideoTracks()[0].onended = () => {
            console.log("🛑 Browser Stop Button Clicked");
            stopScreenSharing();
        };
    }

    let stopScreenSharing = () => {
        if (screen === false) return;

        setScreen(false);

        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }


        setTimeout(() => {
            getUserMedia();
        }, 500);
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(stream => {
                        getDisplayMediaSuccess(stream);
                    })
                    .catch(e => console.log(e))
            }
        }
    }


    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia()
        }
    }, [screen])


    let handleScreen = () => {
        if (screen === true) {
            stopScreenSharing();
        }
        else {
            setScreen(true);
        }
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username)
        setMessage("")
    }

    let hendleEndCall = () => {
        try {
            // 1. Local tracks stop karein
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }

            // 2. Saare Peer Connections close karein
            for (let id in connections) {
                connections[id].close();
                delete connections[id];
            }

            // 3. Socket disconnect karein
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        } catch (e) {
            console.log("Error during call end:", e);
        }

        // 4. Redirect to home
        routeTo("/home");
    };

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    return (
        <div>
            {askForUsername === true ? (
                <div>
                    <div style={{ display: "flex" }}>
                        <div>
                            <IconButton onClick={() => routeTo("/home")}>
                                <HomeIcon fontSize="large" />
                            </IconButton>
                        </div>
                        <div>
                            <h2 style={{ margin: "10px 30px" }} >Enter your name to join the call</h2>
                            <TextField id="outlined-basic" label="username" style={{ marginLeft: " 30px" }} value={username} onChange={(e) => setUsername(e.target.value)} variant="outlined" />
                            <Button variant="contained" style={{ marginLeft: "10px", padding: "15px" }} onClick={connect}>Connect</Button>
                        </div>
                    </div>
                    <div>
                        <video ref={localVideoRef} autoPlay muted style={{ width: "100vw", height: "100vh", marginTop: "30px", objectFit: "cover", position: "fixed", top: 100, left: 0 }}></video>
                    </div>
                </div>
            ) : (
                <div className={style.meetVideoContainer}>
                    {showModal ? <div className={style.chatRoom}>
                        {isChatOpen && (
                            <div className={style.chatContainer}>
                                <h2>Chat</h2>
                                <hr />
                                <div className={style.chattingDisplay}>
                                    {messages.length > 0 ? messages.map((item, index) => {
                                        return (
                                            <div key={index} className={style.chatbox}>
                                                <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                                <p> {item.data}</p>

                                            </div>
                                        )
                                    }) : <p>No messages</p>}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className={style.chattingArea}>
                                    <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter your chat" variant="outlined" />
                                    <Button onClick={sendMessage} variant="contained">Send</Button>
                                </div>
                            </div>
                        )}

                    </div> : <></>}



                    <div className={style.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        <IconButton onClick={hendleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton> : <></>
                        }

                        <Badge badgeContent={newMessages} max={999} color="error">
                            <IconButton onClick={toggleChat} style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    {video === true ? (
                        <video
                            className={style.meetUserVideo}
                            ref={localVideoRef}
                            autoPlay
                            muted
                        ></video>
                    ) : null}

                    <div className={style.meetVideoContainer}>
                        {videos.map((video) => (
                            (video.videoActive !== false) ? (
                                <div className={style.conferenceView} key={video.socketId}>
                                    <video
                                        data-socket={video.socketId}
                                        ref={(ref) => {
                                            if (ref && video.stream) {
                                                ref.srcObject = video.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                    />
                                </div>
                            ) : null
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} ``