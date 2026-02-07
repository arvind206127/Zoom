
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import Authentication from './pages/authentication.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import VideoMeetComponents from './pages/VideoMeetComponents.jsx'
import HomeComponent from './pages/home.jsx'
import History from './pages/history.jsx'

function App() {


  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/auth' element={<Authentication />} />
            <Route path='/home' element={<HomeComponent />} />
            <Route path='/history' element={<History />} />
            <Route path='/:url' element={<VideoMeetComponents />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
