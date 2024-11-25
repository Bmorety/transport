'use client'

import React, { useState, useEffect } from "react";
import { registerHandlers } from "./scroll.js";
import "./App.css";
import { fetchNearestStations, fetchDepartures, fetchServices, StationData, DepartureData, StationServiceInfo } from "./MvvApi";
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo, faSync, faPersonWalking, faCoffee } from '@fortawesome/free-solid-svg-icons'

config.autoAddCss = false;

let loaded = false;
let loading = false;

const App: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [departures, setDepartures] = useState<Record<string, DepartureData[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [updateTime, setUpdateTime] = useState<string>(""); //
  const [busChecked, setBusChecked] = useState(true)
  const [tramChecked, setTramChecked] = useState(true)
  const [ubahnChecked, setUbahnChecked] = useState(true)
  const [sbahnChecked, setSbahnChecked] = useState(true)
  const [bahnChecked, setBahnChecked] = useState(false)  // Initially unchecked
  const [showKofi, setShowKofi] = useState(false);

  const toggleBusCheck = () => setBusChecked(!busChecked)
  const toggleTramCheck = () => setTramChecked(!tramChecked)
  const toggleUbahnCheck = () => setUbahnChecked(!ubahnChecked)
  const toggleSbahnCheck = () => setSbahnChecked(!sbahnChecked)
  const toggleBahnCheck = () => setBahnChecked(!bahnChecked)
  const toggleKofi = () => setShowKofi(!showKofi);

  const loadDepartures = async function (stations: StationData[]) {
    const transportTypes = {
      BUS: busChecked,
      TRAM: tramChecked,
      UBAHN: ubahnChecked,
      SBAHN: sbahnChecked,
      BAHN: bahnChecked
    };

    for (const station of stations) {
      const departures = await fetchDepartures(station.globalId, transportTypes);
      setDepartures((prev) => ({
        ...prev,
        [station.globalId]: departures,
      }));
    }
  }

  const loadData = async function () {
    setDepartures({});
    setUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      fetchNearestStations(48.1351, 11.592);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // fetch nearby stations
        const { latitude, longitude } = position.coords;
        const stations = await fetchNearestStations(latitude, longitude);

        setStations(stations);
        setOpenAccordion(stations[0]?.globalId || null);

        // load service data for them
        for (const station of stations)
          station.services = await fetchServices(station);

        setStations(stations);

        // fetch departures for them
        await loadDepartures(stations);
      },
      (error) => {
        setError(getGeolocationErrorMessage(error));
        fetchNearestStations(48.1351, 11.592);
      }
    );
  };

  // on load
  useEffect(() => {
    if (loading || loaded) return;
    loading = true;
    registerHandlers(loadData);
    loadData().then(() => loaded = true);
  }, []);

  // Reload data when transport type filters change
  useEffect(function () {
    if (!loaded) return;
    loadDepartures(stations);
  }, [busChecked, tramChecked, ubahnChecked, sbahnChecked, bahnChecked]);

  const getGeolocationErrorMessage = (
    error: GeolocationPositionError
  ): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "User denied the request for Geolocation.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "The request to get user location timed out.";
      default:
        return "An unknown error occurred.";
    }
  };

  const toggleAccordion = (stationId: string) => {
    setOpenAccordion(openAccordion === stationId ? null : stationId);
  };

  const calculateWalkingTime = (distanceInMeters: number): number => {
    return Math.ceil(distanceInMeters / 1.5 / 60);
  };

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
          <>
            <div className="flex flex-row justify-content-between align-item-baseline" style={{ "gap": "1em" }}>
              <div className="transport-button-container">
                <button
                  onClick={toggleBusCheck}
                  className={`transport-button ${busChecked ? 'active' : ''}`}
                  aria-pressed={busChecked}
                >
                  Bus
                </button>
                <button
                  onClick={toggleTramCheck}
                  className={`transport-button ${tramChecked ? 'active' : ''}`}
                  aria-pressed={tramChecked}
                >
                  Tram
                </button>
                <button
                  onClick={toggleUbahnCheck}
                  className={`transport-button ${ubahnChecked ? 'active' : ''}`}
                  aria-pressed={ubahnChecked}
                >
                  UBahn
                </button>
                <button
                  onClick={toggleSbahnCheck}
                  className={`transport-button ${sbahnChecked ? 'active' : ''}`}
                  aria-pressed={sbahnChecked}
                >
                  SBahn
                </button>
                <button
                  onClick={toggleBahnCheck}
                  className={`transport-button ${bahnChecked ? 'active' : ''}`}
                  aria-pressed={bahnChecked}
                >
                  Bahn
                </button>
              </div>

              <div className="update-time" onClick={loadData} role="button" tabIndex={0}>
                {updateTime}
                <FontAwesomeIcon icon={faSync} style={{ paddingLeft: ".4em" }} />
              </div>
            </div>
            <div className="separator" />
            {error && <p className="error">{error}</p>}
            {stations
              ? stations.map((station) => (
                <div key={station.globalId} className={`station-section ${openAccordion === station.globalId ? 'open' : ''}`}>
                  <div className="station-header" onClick={() => toggleAccordion(station.globalId)}>
                    <h2 className="station-name flex items-center">
                      {station.name}
                      <span className="ml-4 text-muted-foreground text-s">
                        <FontAwesomeIcon icon={faPersonWalking} className="mr-2 h-3 w-3" style={{ paddingLeft: ".4em" }} />
                        {calculateWalkingTime(station.distanceInMeters)} min
                      </span>
                    </h2>
                  </div>
                  <div className="station-services">
                    {station.services ? (
                      <>
                        {station.services.map(s => s.label).join(' · ')}
                      </>
                    ) : (
                      station.transportTypes.join(' · ')
                    )}
                  </div>
                  {openAccordion === station.globalId && (
                    <div className="departures-container">
                      <div className="departures">
                        {departures[station.globalId]?.slice(0, 6).map((departure, index) => (
                          <p key={index} className="departure-info">
                            {departure.label} · {departure.destination} · {departure.departureInMinutes < 1 ? (<>Now!</>) : (<>{departure.departureInMinutes} min</>)}
                          </p>
                        ))}
                      </div>
                      {departures[station.globalId] && departures[station.globalId].length > 6 && (
                        <div className="departures departures-extended">
                          {departures[station.globalId]?.slice(6).map((departure, index) => (
                            <p key={index + 6} className="departure-info">
                              {departure.label} · {departure.destination} · {departure.departureInMinutes < 1 ? (<>Now!</>) : (<>{departure.departureInMinutes} min</>)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
              : <>Loading</>
            }

          </>
        )}
      </main>
      <footer className="app-footer">
        <div className="separator" />
      </footer>

    </div>
  );
};
export default App;
