'use client'

import React, { useState, useEffect } from "react";
import { registerHandlers } from "./scroll.js";
import "./App.css";
import { fetchNearestStations, fetchDepartures, fetchServices, StationData, DepartureData, StationServiceInfo } from "./MvvApi";



let loaded = false;

const App: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [departures, setDepartures] = useState<Record<string, DepartureData[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [updateTime, setUpdateTime] = useState<string>(""); //

  const loadData = function () {
    setDepartures({});
    setUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const stations = await fetchNearestStations(latitude, longitude);

          setStations(stations);
          setOpenAccordion(stations[0]?.globalId || null);


          for (const station of stations) {
            station.services = await fetchServices(station);
            setStations(stations);
          }

          for (const station of stations) {
            const departures = await fetchDepartures(station.globalId);

            setDepartures((prev) => ({
              ...prev,
              [station.globalId]: departures,
            }));
          }
        },
        (error) => {
          setError(getGeolocationErrorMessage(error));
          // Use a default location (Haidhausplatz) if geolocation fails
          fetchNearestStations(48.1351, 11.592);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      // Use a default location (Haidhausplatz) if geolocation is not supported
      fetchNearestStations(48.1351, 11.592);
    }
  };

  useEffect(() => {
    if (loaded) return;
    loaded = true;
    loadData();
    registerHandlers(loadData);
  }, []);

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

  console.log(stations)

  return (
    <main className="app">
      <img src="/transport/images/Logo512.png" alt="PVBLIC." className="logo" />
      <div className="update-time" onClick={loadData} role="button" tabIndex={0}>
        Updated: {updateTime}
      </div>
      <div className="separator" />
      {error && <p className="error">{error}</p>}
      {stations.map((station, index) => (
        <div key={station.globalId} className={`station-section ${openAccordion === station.globalId ? 'open' : ''}`}>
          <div className="station-header" onClick={() => toggleAccordion(station.globalId)}>
            <h2 className="station-name">{station.name}</h2>
            <span className="walking-time">{calculateWalkingTime(station.distanceInMeters)} min</span>
          </div>
          {station.services && station.services.length > 0 && (
            <div className="station-services">
              {station.services?.map(s => s.label).join(' · ')}
            </div>
          ) || (
              <div className="station-service-types">
                {station.transportTypes.join(' · ')}
              </div>
            )
          }
          {openAccordion === station.globalId && (
            <div className="departures">
              {departures[station.globalId]?.map((departure, index) => (
                <p key={index} className="departure-info">
                  {departure.label} · {departure.destination} · {departure.departureInMinutes} min
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="separator" />
      
      
    
    </main>
  );
};

export default App;