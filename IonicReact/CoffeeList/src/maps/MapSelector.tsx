import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { useEffect, useState } from "react";
import { getLogger } from "../core";
import { Map } from "./Map";
import { GeolocationPosition, Plugins } from '@capacitor/core';

const { Geolocation } = Plugins;

const log = getLogger('Map');

interface Location {
    long: number | undefined;
    lat: number | undefined;
    error?: Error;
}

interface ModalState {
    long: number | undefined;
    lat: number | undefined;
    onSave: (lat: number, long: number) => void;
    onDismiss: () => void;
}

export const MapSelector: React.FC<ModalState> = ({ long, lat, onSave, onDismiss }) => {
    const [state, setState] = useState<Location>({ lat: lat, long: long });
    useEffect(watchLocation, []);

    const { lat: currentLat, long: currentLong } = state;

    function watchLocation() {
        if (long && lat) return;

        let cancelled = false;

        Geolocation.getCurrentPosition()
            .then(position => updateMyPosition('current', position))
            .catch(error => updateMyPosition('current', undefined, error));

        return () => {
            cancelled = true;
        };

        function updateMyPosition(source: string, position?: GeolocationPosition, error: any = undefined) {
            console.log(source, position, error);
            if (!cancelled) {
                setState({
                    ...state,
                    lat: position?.coords.latitude || state.lat,
                    long: position?.coords.longitude || state.long,
                    error
                });
            }
        }
    }

    function setNewCoords(coords: any) {
        const lat = coords.latLng.lat();
        const lng = coords.latLng.lng();
        log('Marker dragged', lat, lng);

        setState({ ...state, lat: lat, long: lng });
    }

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar mode="ios">
                    <IonTitle>Location</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => onSave(currentLat!, currentLong!)}>Save</IonButton>
                    </IonButtons>
                    <IonButtons slot="start">
                        <IonButton color="danger" onClick={() => onDismiss()}>Close</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {currentLat && currentLong &&
                    <Map
                        lat={currentLat}
                        lng={currentLong}
                        onMapClick={() => log('Click')}
                        onMarkerClick={() => log('Marker click')}
                        selectedLocation={(coord: any) => setNewCoords(coord)}
                    />}
            </IonContent>
        </IonPage>
    );
}