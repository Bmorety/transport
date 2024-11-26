
export interface StationData {
    name: string;
    globalId: string;
    transportTypes: string[];
    distanceInMeters: number;
    services: StationServiceInfo[];
    latitude: number;
    longitude: number;
}

export enum TransportType {
    BUS = "BUS",
    TRAM = "TRAM",
    UBAHN = "UBAHN",
    SBAHN = "SBAHN",
    BAHN = "BAHN",
    SCHIFF = "SCHIFF",
    REGIONAL_BUS = "REGIONAL_BUS",
    RUFTAXI = "RUFTAXI",
}

export interface DepartureData {
    transportType: string;
    label: string;
    destination: string;
    departureInMinutes: number;
}

export interface StationServiceInfo {
    label: string;
    transportType: TransportType,
    trainType: string;
    network: string;
    divaId: string;
    sev: boolean;
}


export const fetchNearestStations = async (lat: number, lon: number, limit: number = 3) => {
    const fetchStations = async (latitude: number, longitude: number) => {
        const response = await fetch(
            `https://www.mvg.de/api/bgw-pt/v3/stations/nearby?latitude=${latitude}&longitude=${longitude}`
        );
        if (!response.ok) throw new Error("Failed to fetch data from MVG API");
        const data = await response.json();
        return data.slice(0, limit);
    };

    try {
        const stations = await fetchStations(lat, lon);
        if (stations.length > 0) {
            return stations;
        } else {
            // If no stations found, use fixed location (Munich Central Station)
            const fixedLat = 48.1407;
            const fixedLon = 11.5583;
            return await fetchStations(fixedLat, fixedLon);
        }
    } catch (error) {
        console.error("Error fetching stations:", error);
        // If API call fails, use fixed location (Munich Central Station)
        const fixedLat = 48.1407;
        const fixedLon = 11.5583;
        return await fetchStations(fixedLat, fixedLon);
    }
};

export const searchStations = async (query: string, location: Coordinates | null = null): Promise<StationData[]> => {
    try {
        const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/locations?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error("Failed to fetch stations");
        }

        const locations = await response.json();
        let stations = locations.filter((loc: any) => loc["type"] === "STATION");
        if (!stations)
            return [];

        // transform data 
        stations = stations.map((station: any) => ({
            ...station,
            distanceInMeters: station.distanceInMeters || location === null ? 0 : haversineDistance(station, location),
            services: undefined,
        }));

        // sort by geo distance
        stations.sort((a: StationData, b: StationData) => compare(a.distanceInMeters, b.distanceInMeters));



        return stations;
    } catch (error) {
        console.error("Error searching stations:", error);
        return [];
    }
}

const transportOrder = Object.keys(TransportType);
export const fetchServices = async (station: StationData): Promise<StationServiceInfo[]> => {
    try {
        const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/lines/${station.globalId}`);
        if (!response.ok)
            return [];

        let data: StationServiceInfo[] = Array.from(await response.json());

        // Filter out BAHN services and organize by transport type
        data = data.filter(service => service.transportType !== TransportType.BAHN)

        // sort regular services by type and night service
        data.sort((a, b) =>
            compare(a.label.startsWith('N'), b.label.startsWith('N')) ||
            compare(transportOrder.indexOf(a.transportType), transportOrder.indexOf(b.transportType))
        )

        return data;
    } catch {
        return [];
    }
}

function compare(a: Number | boolean, b: Number | boolean) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

export const fetchDepartures = async (
    stationId: string,
    transportTypes: { [key: string]: boolean },
    limit: number = 11
) => {
    try {
        const enabledTypes = Object.entries(transportTypes)
            .filter(([_, enabled]) => enabled)
            .map(([type]) => type)
            .join(',');

        const response = await fetch(
            `https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${stationId}&limit=${limit}&transportTypes=${enabledTypes}`
        );

        if (!response.ok)
            throw new Error("Failed to fetch departure data from MVG API");

        const data = await response.json();
        const now = new Date();
        const departuresWithMinutes = data
            .map((dep: any) => ({
                ...dep,
                departureInMinutes: timestampToRelative(dep.realtimeDepartureTime, now),
            }))
            .slice(0, 11); // Limit to 6 results at API level
        return departuresWithMinutes;
    } catch (error) {
        console.error("Error fetching departures:", error);
        return [];
    }
};
function timestampToRelative(timestamp: string, now: Date) {
    return Math.round(
        (new Date(timestamp).getTime() - now.getTime()) /
        60000
    );
}


export const getGeolocationErrorMessage = (
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

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export function haversineDistance(coord1: Coordinates, coord2: Coordinates) {

    const R = 6371000; // Earth's radius in meters
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const lat1 = toRadians(coord1.latitude);
    const lon1 = toRadians(coord1.longitude);
    const lat2 = toRadians(coord2.latitude);
    const lon2 = toRadians(coord2.longitude);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}