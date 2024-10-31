
export interface StationData {
    name: string;
    globalId: string;
    transportTypes: string[];
    distanceInMeters: number;
    services: StationServiceInfo[]|undefined;
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
    let stations: StationData[];
    try {
        const response = await fetch(
            `https://www.mvg.de/api/bgw-pt/v3/stations/nearby?latitude=${lat}&longitude=${lon}`
        );
        if (!response.ok) throw new Error("Failed to fetch data from MVG API");
        const data = await response.json();
        return data.slice(0, limit);
    } catch (error) {
        console.error("Error fetching stations:", error);
        // Use mock stations if API call fails
        return [
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
    }
}

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
