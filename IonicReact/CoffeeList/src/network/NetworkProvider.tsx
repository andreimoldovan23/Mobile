import { NetworkStatus, Plugins } from '@capacitor/core';
import { IonToast } from '@ionic/react';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../auth';
import { getLogger } from '../core';

const { Network } = Plugins;

const log = getLogger('NetworkProvider');

export interface NetworkState {
    isOnline: boolean,
    hasChanged: boolean
}

const initialState: NetworkState = {
    isOnline: true,
    hasChanged: false
}

interface NetworkProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const NetworkContext = React.createContext<NetworkState>(initialState);

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [state, setState] = useState<NetworkState>(initialState);
    const { isOnline } = state;

    useEffect(networkStatusEffect, []);

    log('render');
    return (
        <NetworkContext.Provider value={state}>
            {children}
            <IonToast
                isOpen={isOnline && token?.trim() !== ''}
                message="You are online now, communicating directly with the server"
                duration={3000}
                cssClass='toast-custom-class'
                buttons={[
                    {
                        side: 'end',
                        text: 'Got it',
                        role: 'cancel'
                    }
                ]} />
            <IonToast
                isOpen={!isOnline && token?.trim() !== ''}
                message="You have went offline. All operations on data will be performed locally and sent to the server when you are back online"
                cssClass='toast-custom-class'
                duration={6000}
                buttons={[
                    {
                        side: 'end',
                        text: 'Got it',
                        role: 'cancel'
                    }
                ]} />
        </NetworkContext.Provider>
    );

    function networkStatusEffect() {
        let canceled = false;
        const handler = Network.addListener('networkStatusChange', handleNetworkStatusChange);;

        function handleNetworkStatusChange(status: NetworkStatus) {
            if (!canceled) {
                setState({ isOnline: status.connected, hasChanged: true });
            }
        }

        return () => { canceled = true; handler.remove(); };
    }
}