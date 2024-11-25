'use client'

import React, { useState, useEffect } from "react";
import "./App.css";
import { fetchNearestStations, fetchDepartures, fetchServices, StationData, DepartureData, StationServiceInfo } from "./MvvApi";
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo, faSync, faPersonWalking, faCoffee } from '@fortawesome/free-solid-svg-icons'
import { Departures } from "./Departures";

const App: React.FC = () => {
  const [showKofi, setShowKofi] = useState(false);

  const toggleKofi = () => setShowKofi(!showKofi);

  return (
    <div className="app-container">
      <header className="app-header">
        <img src="/transport/images/Logo512.png" alt="PVBLIC." className="logo" />
        <button onClick={toggleKofi} className="kofi-button">
          A Project by Critical Mass Works
          <FontAwesomeIcon icon={faCoffee} className="coffee-icon" />
        </button>
        <div className="separator" />
      </header>
      <main className={`app-main ${showKofi ? 'show-kofi' : ''}`}>
        {showKofi ? (
          <div className="kofi-container">
            <div className="kofi-text">
              <h2>Support PVBLIC</h2>
              <p>
                Hi, I’m Bruno, and I’m working on PVBLIC, a project to reimagine the public transport experience. Combining design with simplicity, PVBLIC creates seamless functionality while integrating a community feedback layer. Users share their thoughts about the city, which AI transforms into insights for planners, businesses, and location-based stories that enrich urban experiences.
              </p>
              <p>
                PVBLIC is part of Critical Mass Works, my initiative to promote micro and mass urban mobility through community-driven projects. By fostering grassroots engagement, I aim to create more sustainable, livable, and inclusive cities.
              </p>
              <p>
                If you believe in the power of design, community, and innovation to shape better cities, I’d love your support. Your contribution helps me continue building tools like PVBLIC and driving forward the mission of Critical Mass Works.
              </p>
            </div>
            <iframe
              id="kofi-frame"
              src="https://ko-fi.com/bikebusrepeat/?hidefeed=true&widget=true&embed=true&preview=true"
              style={{ border: 'none', padding: '10px', background: '#FFFFFF' }}
              height="550"
              title="bikebusrepeat"
            />
          </div>
        ) : (

          <Departures></Departures>
        )}

      </main>
      <footer className="app-footer">
        <div className="separator" />
      </footer>

    </div>
  );
};
export default App;
