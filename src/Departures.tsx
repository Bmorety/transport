import React, { useState, useEffect, useRef } from "react";
import { fetchNearestStations, fetchDepartures, fetchServices, StationData, DepartureData, getGeolocationErrorMessage, searchStations, Coordinates, haversineDistance } from "./MvvApi";
import { registerHandlers } from "./scroll.js";
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync, faPersonWalking, faMagnifyingGlass, faTimes } from '@fortawesome/free-solid-svg-icons'


let loaded = false;
let loading = false;


export const Departures: React.FC = () => {
    const [stations, setStations] = useState<StationData[]>([]);
    const [manualStation, setManualStation] = useState<StationData | null>(null);
    const [geoPosition, setGeoPosition] = useState<Coordinates>({ latitude: 48.1351, longitude: 11.592 });

    const [departures, setDepartures] = useState<Record<string, DepartureData[]>>({});
    const [error, setError] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<StationData[] | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [updateTime, setUpdateTime] = useState<string>(""); //
    const [busChecked, setBusChecked] = useState(true)
    const [tramChecked, setTramChecked] = useState(true)
    const [ubahnChecked, setUbahnChecked] = useState(true)
    const [sbahnChecked, setSbahnChecked] = useState(true)
    const [bahnChecked, setBahnChecked] = useState(false)  // Initially unchecked

    const toggleBusCheck = () => setBusChecked(!busChecked)
    const toggleTramCheck = () => setTramChecked(!tramChecked)
    const toggleUbahnCheck = () => setUbahnChecked(!ubahnChecked)
    const toggleSbahnCheck = () => setSbahnChecked(!sbahnChecked)
    const toggleBahnCheck = () => setBahnChecked(!bahnChecked)


    const inputRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null);

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

    const getGeoPosition = (): Promise<Coordinates | null> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                setError("Geolocation is not supported by this browser.");
                reject(null);
            }

            navigator.geolocation.getCurrentPosition(
                (result) => resolve(result.coords),
                (error) => {
                    setError(error.message);
                    reject(null);
                }
            );
        });
    }

    const loadData = async function () {
        if (loading)
            return;
        loading = true;

        setDepartures({});
        setUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

        const coords = await getGeoPosition();

        if (coords)
            // update state
            setGeoPosition(coords);

        // fetch nearby stations
        const { latitude, longitude } = coords || geoPosition;
        const stations = await fetchNearestStations(latitude, longitude);

        setStations(stations);

        if (openAccordion !== manualStation?.globalId)
            setOpenAccordion(stations[0]?.globalId || null);

        // load service data for them
        for (const station of stations)
            station.services = await fetchServices(station);

        setStations(stations);

        // fetch departures for them
        await loadDepartures(stations);

        if (manualStation)
            await loadDepartures([manualStation]);

        // finished loading
        loading = false;
    };

    // on load
    useEffect(() => {
        if (loading || loaded) return;

        registerHandlers(loadData);
        loadData().then(() => loaded = true);
    }, []);

    // Reload data when transport type filters change
    useEffect(function () {
        if (!loaded) return;
        loadDepartures(stations);
        if (manualStation)
            loadDepartures([manualStation])
    }, [busChecked, tramChecked, ubahnChecked, sbahnChecked, bahnChecked]);

    const toggleAccordion = (stationId: string) => {
        setOpenAccordion(openAccordion === stationId ? null : stationId);
    };

    const toggleSearch = async () => {
        setSearchOpen(!searchOpen);
    };

    useEffect(() => inputRef.current?.focus(), [searchOpen]);

    const calculateWalkingTime = (distanceInMeters: number): number => {
        return Math.ceil(distanceInMeters / 1.5 / 60);
    };

    const searchStation = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value;
        const results = await searchStations(query, geoPosition);

        setSearchResults(results.slice(0, 6));
    };

    const handleSearchResultClick = async (station: StationData) => {
        setSearchOpen(false);
        setOpenAccordion(station.globalId);

        // check if already in results
        for (const s of stations)
            if (s.globalId == station.globalId)
                return;

        // add to list
        setManualStation(station);

        // load missing data
        const transportTypes = {
            BUS: busChecked,
            TRAM: tramChecked,
            UBAHN: ubahnChecked,
            SBAHN: sbahnChecked,
            BAHN: bahnChecked
        };

        station.services = await fetchServices(station);
        const departures = await fetchDepartures(station.globalId, transportTypes);
        setDepartures((prev) => ({
            ...prev,
            [station.globalId]: departures,
        }));
    }

    const stationList = manualStation
        ? [manualStation, ...stations]
        : stations;

    return <>
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

            <div className="update-time" onClick={loadData} role="button" tabIndex={0}
                title="Refresh">
                {updateTime}
                <FontAwesomeIcon icon={faSync} style={{ paddingLeft: ".4em" }} fixedWidth />
            </div>
        </div>
        <div className="separator" />
        {error && <p className="error">{error}</p>}
        <div className="position-relative" title="Search">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="float-end cursor-click" onClick={toggleSearch} fixedWidth />
        </div>
        {searchOpen ? <>
            <input ref={inputRef} className="search-input" placeholder="Search for a station" onChange={searchStation}></input>
            {searchResults === null
                ? ""
                : searchResults ?
                    <> Select
                        {searchResults.map(
                            (station: StationData) => <div className="cursor-click ml-1" onClick={() => handleSearchResultClick(station)}>
                                {station.name}
                            </div>
                        )}
                    </>
                    :
                    "No results"
            }
        </>
            : <></>
        }
        {stationList
            ? stationList.map((station) => (
                <div key={station.globalId} className={`station-section ${openAccordion === station.globalId ? 'open' : ''}`}>
                    <div className="station-header" onClick={() => toggleAccordion(station.globalId)}>
                        <h2 className="station-name flex items-center">
                            {station.name}
                            <span className="ml-4 text-muted-foreground text-s">
                                <FontAwesomeIcon icon={faPersonWalking} style={{ paddingLeft: ".4em" }} />
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
                                {departures[station.globalId]?.map((departure, index) => (
                                    <p key={index} className="departure-info">
                                        {departure.label} · {departure.destination} · {departure.departureInMinutes < 1 ? (<>Now!</>) : (<>{departure.departureInMinutes} min</>)}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))
            : <>Loading</>
        }
    </>
}