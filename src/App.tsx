import React, { useState, useEffect } from "react";
import "./App.css";

interface StationData {
  name: string;
  globalId: string;
  transportTypes: string[];
  distanceInMeters: number;
}

interface DepartureData {
  transportType: string;
  label: string;
  destination: string;
  departureInMinutes: number;
}

const App: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [departures, setDepartures] = useState<Record<string, DepartureData[]>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetchNearestStations(latitude, longitude);
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
  }, []);

  const fetchNearestStations = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://www.mvg.de/api/fib/v2/station/nearby?latitude=${lat}&longitude=${lon}`
      );
      if (!response.ok) throw new Error("Failed to fetch data from MVG API");
      const data = await response.json();
      setStations(data.slice(0, 3)); // Get the 3 nearest stations

      // Fetch departures for each station
      for (const station of data.slice(0, 3)) {
        await fetchDepartures(station.globalId);
      }
    } catch (error) {
      console.error("Error fetching stations:", error);
      // Use mock stations if API call fails
      const mockStations: StationData[] = [
        {
          name: "Haidhausen",
          globalId: "de:09162:1785",
          transportTypes: ["S1", "S2", "S3", "S4", "S6", "S7", "S8"],
          distanceInMeters: 0,
        },
        {
          name: "Ostbahnhof",
          globalId: "de:09162:6",
          transportTypes: [
            "U5",
            "S1",
            "S2",
            "S3",
            "S4",
            "S6",
            "S7",
            "S8",
            "Tram 19",
          ],
          distanceInMeters: 500,
        },
        {
          name: "Max-Weber-Platz",
          globalId: "de:09162:10",
          transportTypes: ["U4", "U5", "Tram 19"],
          distanceInMeters: 800,
        },
      ];
      setStations(mockStations);
      for (const station of mockStations) {
        await fetchDepartures(station.globalId);
      }
    }
  };

  const fetchDepartures = async (stationId: string) => {
    try {
      const response = await fetch(
        `https://www.mvg.de/api/fib/v2/departure?globalId=${stationId}&limit=5&offsetInMinutes=0`
      );
      if (!response.ok)
        throw new Error("Failed to fetch departure data from MVG API");
      const data = await response.json();
      const now = new Date();
      const departuresWithMinutes = data.map((dep: any) => ({
        ...dep,
        departureInMinutes: Math.round(
          (new Date(dep.realtimeDepartureTime).getTime() - now.getTime()) /
            60000
        ),
      }));
      setDepartures((prev) => ({
        ...prev,
        [stationId]: departuresWithMinutes,
      }));
    } catch (error) {
      console.error("Error fetching departures:", error);
    }
  };

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

  return (
    <div className="app">
      {error && <p className="error">{error}</p>}
      {stations.map((station) => (
        <div key={station.globalId} className="station-section">
          <h2 className="station-name">{station.name}</h2>
          <p className="station-services">
            {station.transportTypes.join(" · ")}
          </p>
          <p className="station-distance">{station.distanceInMeters} m</p>
          <div className="departures">
            {departures[station.globalId]?.map((departure, index) => (
              <p key={index} className="departure-info">
                {departure.label} · {departure.destination} ·{" "}
                {departure.departureInMinutes} min
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default App;
