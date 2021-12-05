import React, { useContext, useEffect, useState } from 'react';
import {
    IonActionSheet,
    IonButton,
    IonButtons,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
    IonInput,
    IonItem,
    IonLabel,
    IonLoading,
    IonPage,
    IonRow,
    IonTitle,
    IonToolbar,
    useIonModal,
    createAnimation,
    IonText
} from '@ionic/react';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { CoffeePropsCached } from './CoffeeProps';
import { NetworkContext } from '../network/NetworkProvider';
import { usePhotoGallery } from '../photoItems/usePhotoGallery';
import { camera, close, map, trash } from 'ionicons/icons';
import { MapSelector } from '../maps/MapSelector';
import { useCustomAnimations } from './useCustomAnimations';

const log = getLogger('CoffeeEdit');
const StrRegEx = new RegExp("^[a-zA-Z]+(?:[\\s.\\-'][a-zA-Z]+)*$");

interface CoffeeEditProps extends RouteComponentProps<{
    id?: string;
}> { }

const CoffeeEdit: React.FC<CoffeeEditProps> = ({ history, match }) => {
    const { items, saving, savingError, deleting, saveItem, deleteItem } = useContext(ItemContext);
    const { isOnline } = useContext(NetworkContext);

    const [item, setItem] = useState<CoffeePropsCached>({ name: '', origin: '', picture: undefined, long: undefined, lat: undefined } as CoffeePropsCached);
    const [action, setAction] = useState<boolean>(false);
    const [valErr, setErr] = useState<boolean>(false);
    const { takePhoto, deletePhoto, getOrCreate } = usePhotoGallery();
    const { enterAnimation, leaveAnimation } = useCustomAnimations();

    const displayLoading = saving || deleting;
    const deleteDisabled = !match.params.id;

    useEffect(() => {
        log('useEffect');
        let canceled = false;
        selectItem();
        return () => { canceled = true; }

        async function selectItem() {
            const routeId = match.params.id || '';
            const foundItem = items?.find(it => it._id == routeId);

            if (foundItem && !canceled) {
                if (foundItem.picture)
                    foundItem.picture = await getOrCreate(foundItem.picture);

                setItem(foundItem);
            }
        }
    }, [match.params.id]);

    useEffect(() => {
        if (!valErr) return;
        let canceled = false;
        playAnimation();
        return () => { canceled = true };

        async function playAnimation() {
            log('Validation error');
            const nameInput = document.querySelector('.nameInput');
            const originInput = document.querySelector('.originInput');
            if (nameInput && originInput) {
                const animationA = genAnimation(nameInput);
                const animationB = genAnimation(originInput);
                const parentAnimation = createAnimation()
                    .addAnimation([animationA, animationB]);
                await parentAnimation.play();
            }

            if (!canceled) setErr(false);
        }

        function genAnimation(el: Element) {
            return createAnimation()
                .addElement(el)
                .easing('cubic-bezier(0.42, 0, 0.58, 1)')
                .duration(2500)
                .keyframes([
                    { offset: 0, transform: 'translateX(0)' },
                    { offset: 0.125, transform: 'translateX(-6px) rotateY(-5deg)' },
                    { offset: 0.375, transform: 'translateX(5px) rotateY(4deg)' },
                    { offset: 0.625, transform: 'translateX(-3px) rotateY(-2deg)' },
                    { offset: 0.875, transform: 'translateX(2px) rotateY(1deg)' },
                    { offset: 1, transform: 'translateX(0)' }
                ]);
        }
    }, [valErr]);

    const handleChangeCoords = (lat: number, long: number) => {
        log('Save location');
        log('New coords', lat, long);
        dismiss();

        let canceled = false;
        changeCoordsAsync();
        return () => { canceled = true };

        async function changeCoordsAsync() {
            if (!canceled)
                setItem({ ...item, lat: lat, long: long });
        }
    };

    const handleDismiss = () => {
        log('Dismiss map');
        dismiss();
    }

    const [present, dismiss] = useIonModal(MapSelector,
        { long: item.long, lat: item.lat, onSave: handleChangeCoords, onDismiss: handleDismiss });

    const handleSave = () => {
        if (!validate()) {
            setErr(true);
            return;
        }
        
        saveItem && saveItem(item, isOnline).then(() => history.goBack());
        function validate() {
            return StrRegEx.test(item.name) && StrRegEx.test(item.origin);
        }
    };

    const handleDelete = () => {
        deleteItem && deleteItem(item._id, isOnline).then(() => history.goBack());
        handleDeletePicture();
    }

    const handleTakePicture = () => {
        let canceled = false;
        asyncTakePicture();
        return () => { canceled = true; };

        async function asyncTakePicture() {
            const photo = await takePhoto();

            if (canceled) return;
            setItem({ ...item, picture: photo });
        }
    };

    const handleDeletePicture = () => {
        let canceled = false;
        asyncDeletePicture();
        return () => { canceled = true; };

        async function asyncDeletePicture() {
            if (!item.picture) return;
            await deletePhoto(item.picture);

            if (canceled) return;
            setItem({ ...item, picture: undefined });
        }
    };

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="start">
                        <IonButton disabled={deleteDisabled} color="danger" onClick={handleDelete}>
                            Delete
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave} color="primary">
                            Save
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem className="nameInput">
                    <IonLabel position="floating" color={valErr ? 'warning' : 'dark'}>Name</IonLabel>
                    <IonInput value={item.name} onIonChange={e => setItem({ ...item, name: e.detail.value || '' })} />
                </IonItem>
                <IonItem className="originInput">
                    <IonLabel position="floating" color={valErr ? 'warning' : 'dark'}>Origin</IonLabel>
                    <IonInput value={item.origin} onIonChange={e => setItem({ ...item, origin: e.detail.value || '' })} />
                </IonItem>
                <IonItem hidden={!valErr}>
                    <IonText color="danger">Invalid input!</IonText>
                </IonItem>
                {
                    item.picture &&
                    (<IonGrid>
                        <IonRow>
                            <IonCol size='12' key={item.name}>
                                <IonImg onClick={() => setAction(true)} src={item.picture.webPath} onIonError={() => log('Image rerendering failed')} />
                            </IonCol>
                        </IonRow>
                    </IonGrid>)
                }
                <IonFab vertical="bottom" horizontal="start" slot="fixed">
                    <IonFabButton onClick={() => handleTakePicture()} disabled={typeof item.picture !== 'undefined'}>
                        <IonIcon icon={camera} />
                    </IonFabButton>
                </IonFab>
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => present()} disabled={!isOnline}>
                        <IonIcon icon={map} />
                    </IonFabButton>
                </IonFab>
                <IonActionSheet
                    isOpen={action}
                    animated
                    backdropDismiss
                    buttons={[{
                        text: 'Delete',
                        role: 'destructive',
                        icon: trash,
                        handler: () => { handleDeletePicture() }
                    }, {
                        text: 'Cancel',
                        icon: close,
                        role: 'cancel'
                    }]}
                    onDidDismiss={() => setAction(false)}
                    enterAnimation={enterAnimation}
                    leaveAnimation={leaveAnimation}
                />
                <IonLoading isOpen={displayLoading} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save item'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default CoffeeEdit;
