import React, { useContext, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLoading,
  useIonModal,
} from '@ionic/react';
import { add, searchSharp, alert, checkmarkCircle, close } from 'ionicons/icons';
import Coffee from './Coffee';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { AuthContext } from '../auth';
import { CoffeeFilter } from './CoffeeFilter';
import { NetworkContext } from '../network/NetworkProvider';

const log = getLogger('CoffeeList');

const CoffeeList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError, startFetch, changeFilter, hasMore } = useContext(ItemContext);
  const { token, logout } = useContext(AuthContext);
  const { isOnline } = useContext(NetworkContext);

  const handleDismiss = () => {
    log('dismiss');
    dismiss();
  };

  const handleSelect: (filter: string | undefined) => void = (async (filter) => {
    log("Filter is", filter);
    dismiss();
    await changeFilter?.(filter)
  });

  const [present, dismiss] = useIonModal(CoffeeFilter, {
    token, isOnline, onSelect: handleSelect, onDismiss: handleDismiss
  });

  log('render');

  useEffect(() => {
    if (!items || items.length === 0)
      (async () => {
        log('View entered');
        await startFetch?.();
      })();
  }, []);

  async function searchNext($event: CustomEvent<void>) {
    log('Infinite scroll');
    if (isOnline && hasMore)
      await startFetch?.();
    ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar mode="ios">
          <IonIcon slot="start" icon={isOnline ? checkmarkCircle : alert} color={isOnline ? "success" : "danger"} />
          <IonTitle>Coffee Inventory</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => { history.push('/'); logout?.(); }}>
              <IonIcon icon={close} color="danger" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" spinner="dots"/>
        {items && (
          <IonList>
            {items.map(it => {
              if (!it.deleted)
                return <Coffee key={it._id} _id={it._id} name={it.name} origin={it.origin} picture={it.picture} onEdit={id => history.push(`/coffee/${id}`)} />;
            })}
          </IonList>
        )}
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch items'}</div>
        )}
        <IonInfiniteScroll threshold="5px" 
          onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
          <IonInfiniteScrollContent
            loadingSpinner="dots"
            loadingText="Loading more items...">
          </IonInfiniteScrollContent>
        </IonInfiniteScroll>
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/coffee')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <IonFab vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton onClick={() => present()}>
            <IonIcon icon={searchSharp} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );

};

export default CoffeeList;
