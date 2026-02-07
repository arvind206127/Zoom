import React, { use, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css"
import IconButton from '@mui/material/IconButton'
import RestoreIcon from '@mui/icons-material/Restore';
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { AuthContext } from '../contexts/AuthContext'

function HomeComponent() {

    let navigate = useNavigate()

    const [meetingCode, setMeetingCode] = useState("")
    const { addToUserHistory } = React.useContext(AuthContext)

    const generateRandomCode = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result; // जैसे "a4k9z"
    }


    const handleJoinVideoCall = async () => {
        if (meetingCode.length > 0) {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        } else {
            alert("Please enter a meeting code!");
        }
    }

    const handleCreateMeeting = async () => {
        const randomCode = generateRandomCode();
        setMeetingCode(randomCode); // इनपुट बॉक्स में दिखा भी दो
        await addToUserHistory(randomCode);
        navigate(`/${randomCode}`);
    }


    return (
        <>

            <div className="navbar">
                <div className='nabimg'>
                    <img src="/logo2.png" onClick={() => { navigate("/") }} />
                </div>
                <div className='nabHistory'>
                    <IconButton className='historyIcon' onClick={() => { navigate('/history') }}>
                        <RestoreIcon />
                        <p>History</p>
                    </IconButton>
                    <Button onClick={() => {
                        sessionStorage.removeItem("token")
                        navigate("/auth")
                    }} variant='contained' color="primary">
                        Logout
                    </Button>

                </div>
            </div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <h2>Providing  <span>Quality </span> video call just like Education</h2>
                    <p>Connect, Learn, and Grow with Seamless Communication</p>
                    <div className="buttonContainer" >
                        <TextField onChange={e => setMeetingCode(e.target.value)} value={meetingCode} id='outlined-basic' label='Enter Meeting Code' variant='outlined' />
                        <div>
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join Meeting</Button>
                            <Button onClick={handleCreateMeeting} variant='contained' color="secondary">Generate Code</Button>
                        </div>
                    </div>
                </div>
                <div className="rightPanel">
                    <img srcSet="/logo3.png" alt="" />
                </div>
            </div>

        </>
    )
}

export default withAuth(HomeComponent)
