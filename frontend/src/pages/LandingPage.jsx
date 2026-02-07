import React from 'react'
import '../App.css'
import { Link, useNavigate } from 'react-router-dom'

export default function Landing() {

  const router = useNavigate()


  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Apna video call</h2>
        </div>
        <div className="navList">
          <p onClick={() => {
            router("/asdf")
          }}>Join as guest</p>
          <p onClick={() => {
            router("/auth")
          }}>Register</p>
          <div role="button">
            <p onClick={() => {
              router("/auth")
            }}>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1><span style={{ color: '#ff9839' }}>Connect</span> with loves once</h1>
          <p>Join video calls with your loved ones anytime, anywhere.</p>
          <div className="getStartedButton">
            <Link to={"/auth"} style={{ textDecoration: 'none', color: 'white' }} role="button">Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>

    </div>
  )
}
