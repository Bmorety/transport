
export interface StationData {
    name: string;
    globalId: string;
    transportTypes: string[];
    distanceInMeters: number;
    services: StationServiceInfo[] | undefined;
}

export enum TransportType {
    BUS,
    TRAM,
    UBAHN,
    SBAHN,
    BAHN,
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

export const fetchServices = async (station: StationData): Promise<StationServiceInfo[]> => {
    try {

        const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/lines/${station.globalId}`);


        if (!response.ok)
            // todo: debug this
            return [];


        const data = await response.json();
        return data;
    } catch {
        return [];
    }
}
export const fetchDepartures = async (stationId: string, limit: number = 6) => {
    try {

        const response = await fetch(
            `https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${stationId}&limit=${limit}&transportTypes=UBAHN,REGIONAL_BUS,BUS,TRAM,SBAHN`
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
        return departuresWithMinutes;
    } catch (error) {
        console.error("Error fetching departures:", error);
    }
};
