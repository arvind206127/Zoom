import React, { useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';


export default function History() {

    const { getHistoryOfUser, handleDelete, clearAllHistory } = React.useContext(AuthContext)

    const [meetings, setMeetings] = useState([])
    const [message, setMessage] = useState("")
    const [open, setOpen] = useState(false)

    const routeTo = useNavigate()

    const deleteHestory = async (id) => {
        try {
            await handleDelete(id)
            setMeetings((prevMeeting) => prevMeeting.filter((m) => m._id !== id))

        } catch (e) {
            console.log(e)
        }

    }

    const allClearHistory = async () => {
        try {
            await clearAllHistory()
            setMessage("All History Deleted!");
            setOpen(true);
            setMeetings([])
        } catch (e) {
            setMessage(e.message);
            setOpen(true);
        }
    }

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser()
                setMeetings(history)
            } catch {

            }
        }

        fetchHistory()
    }, [])

    return (
        <div>
            <div>
                <IconButton style={{ margin: "10px" }} onClick={() => routeTo("/home")}>
                    <HomeIcon fontSize="large" />
                </IconButton>
                <IconButton onClick={allClearHistory}>
                    <DeleteIcon color="error" />
                    <h5>All clear</h5>
                </IconButton>
                {meetings.length > 0 ? meetings.map((e, i) => {
                    return (
                        <Card key={i} style={{ margin: "10px 20px", width: '15rem', padding: "5px", boxShadow: '5px 4px 10px', display: "flex", alignItems: "start", justifyContent: "space-between" }}>
                            <CardContent>
                                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                    UserId: {e.user_id}
                                </Typography>
                                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                    Meeting Code: {e.meetingcode}
                                </Typography>

                                <Typography variant="body2">
                                    Date: {new Date(e.date).toLocaleDateString()}
                                    <br />
                                    Time: {new Date(e.date).toLocaleTimeString()}
                                </Typography>
                            </CardContent>
                            <IconButton onClick={() => deleteHestory(e._id)}>
                                <DeleteIcon color="error" /> {/* Red color ka dustbin */}
                            </IconButton>
                        </Card>
                    )
                }) : <p className="history-text">No history found</p>}
            </div>
            <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} message={message} />
        </div >

    )
}
