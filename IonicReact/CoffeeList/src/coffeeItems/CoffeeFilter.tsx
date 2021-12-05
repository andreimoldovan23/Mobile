import { IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonLoading, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import { useEffect, useReducer } from "react";
import { getLogger } from "../core";
import { getCoffeeOrigins, getOriginsFromStorage } from "./api/coffeeApi";
import { ActionProps } from "./ItemProvider";

const log = getLogger('CoffeeFilter');

interface ModalState {
    token: string | null,
    isOnline: boolean,
    onDismiss: () => void,
    onSelect: (filter: string | undefined) => void,
}

interface OriginCheckboxes {
    origin: string,
    isChecked: boolean,
}

interface FilterState {
    filter: string | undefined,
    origins: OriginCheckboxes[],
    fetching: boolean,
    searchString: string
}

const initialState: FilterState = {
    filter: undefined,
    origins: [],
    fetching: true,
    searchString: ''
};

const FETCHED_ORIGINS = 'FETCHED_ORIGINS';
const NEW_SELECTION = 'NEW_SELECTION';
const CHANGED_SEARCH = 'CHANGED_SEARCH';

const reducer: (state: FilterState, action: ActionProps) => FilterState =
    (state, { type, payload }) => {
        switch (type) {
            case FETCHED_ORIGINS:
                return { ...state, fetching: false, origins: payload};
            case NEW_SELECTION:
                return { ...state, origins: payload.origins, filter: payload.filter }
            case CHANGED_SEARCH:
                return { ...state, searchString: payload }
            default:
                return state;
        }
    };

export const CoffeeFilter: React.FC<ModalState> = ({ token, isOnline, onDismiss, onSelect }) => {
    log('render');

    const [state, dispatch] = useReducer(reducer, initialState);
    const { filter, origins, fetching, searchString } = state;

    log("Online", isOnline);
    log("Token", token);

    useEffect(fetchOrigins, []);

    function fetchOrigins() {
        let canceled = false;
        fetch();
        return () => { canceled = true; }

        async function fetch() {
            const coffeeOrigins = isOnline ? await getCoffeeOrigins(token) : await getOriginsFromStorage();
            const checkboxes = coffeeOrigins.map(it => { return { origin: it.origin, isChecked: false }; });
            if (!canceled) {
                dispatch({ type: FETCHED_ORIGINS, payload: checkboxes });
            }
        }
    }

    function changeSelect(origin: string) {
        let canceled = false;
        process();
        return () => { canceled = true; }

        async function process() {
            const localOrigins = [...origins];
            const selectedIndex = localOrigins.findIndex(it => it.origin === origin);
            localOrigins.forEach(it => it.isChecked = false);
            localOrigins[selectedIndex].isChecked = !localOrigins[selectedIndex].isChecked;

            log("Selected origin, ", origin, localOrigins[selectedIndex].isChecked);

            if (!canceled) { 
                dispatch({ type: NEW_SELECTION, payload: {origins: localOrigins, filter: localOrigins[selectedIndex].isChecked ? origin : undefined } })
            }
        }
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar mode="ios">
                    <IonTitle>Origin List</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => { onSelect(filter); }}>
                            Save
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="start">
                        <IonButton color="danger" onClick={() => { onDismiss(); }}>
                            Close
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching items" />
                <IonSearchbar value={searchString} debounce={1000} onIonChange={e => dispatch({ type: CHANGED_SEARCH, payload: e.detail.value! })}/>
                {origins && (
                    <IonList>
                        {origins
                        .filter(it => it.origin.indexOf(searchString) >= 0)
                        .map(it => {
                            return (
                                <IonItem key={it.origin}>
                                    <IonCheckbox slot="start" color="primary" checked={it.isChecked} onClick={() => changeSelect(it.origin)} />
                                    <IonLabel>{it.origin}</IonLabel>
                                </IonItem>
                            )
                        })}
                    </IonList>
                )}
            </IonContent>
        </IonPage>
    );
}