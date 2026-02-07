import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";




export const AuthContext = createContext({})

const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext)

    const [userData, setUserData] = useState(authContext)


    const router = useNavigate()

    const handleRagister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })
            if (request.status === httpStatus.CREATED) {
                return request.data.message;

            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            })
            if (request.status === httpStatus.OK) {
                sessionStorage.setItem("token", request.data.token);

                // ✅ यह लाइन जोड़ें (Name save karein):
                sessionStorage.setItem("name", request.data.name);

                router("/home");
                return request.data;
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get('/get_all_activity', {
                params: {
                    token: localStorage.getItem("token")
                }
            })
            return request.data
        } catch (err) {
            throw err
        }
    }

    const addToUserHistory = async (meetingcode) => {
        try {
            let request = await client.post('/add_to_activity', {
                token: localStorage.getItem("token"),
                meeting_code: meetingcode
            })
            return request
        } catch (e) {
            throw e;
        }
    }

    const handleDelete = async (id) => {
        try {
            await client.post('/delete_activity', {
                token: localStorage.getItem("token"),
                meetingId: id
            })
        } catch (e) {
            console.log(e)
        }
    }

    const clearAllHistory = async () => {
        try {
            await client.post('/delete_all_activity', {
                token: sessionStorage.getItem("token")
            })
            return "History cleared"
        } catch (e) {
            throw e
        }
    }


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRagister, handleLogin, handleDelete, clearAllHistory
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}