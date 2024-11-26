

import React, { useState, useEffect, useRef } from "react";
import { fetchNearestStations, fetchDepartures, fetchServices, StationData, DepartureData, getGeolocationErrorMessage, searchStations, Coordinates, haversineDistance } from "./MvvApi";
import { registerHandlers } from "./scroll.js";
import '@fortawesome/fontawesome-svg-core/styles.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync, faPersonWalking, faMagnifyingGlass, faTimes } from '@fortawesome/free-solid-svg-icons'



export const StationDepartures: any = (station: StationData, extended: boolean, departures: DepartureData[] | null) => {


    const calculateWalkingTime = (distanceInMeters: number): number => {
        return Math.ceil(distanceInMeters / 1.5 / 60);
    };


    return <div key={station.globalId} className={`station-section ${extended ? 'open' : ''}`}>
        <div className="station-header" onClick={() => { }}>
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
        {extended && (
            <div className="departures-container">
                <div className="departures">
                    {departures?.map((departure, index) => (
                        <p key={index} className="departure-info">
                            {departure.label} · {departure.destination} · {departure.departureInMinutes < 1 ? (<>Now!</>) : (<>{departure.departureInMinutes} min</>)}
                        </p>
                    ))}
                </div>
            </div>
        )}
    </div>
}