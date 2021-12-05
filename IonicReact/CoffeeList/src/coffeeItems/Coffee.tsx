import React from "react";
import { IonAvatar, IonItem, IonText } from '@ionic/react';
import { CoffeeProps } from "./CoffeeProps";

interface CoffeePropsExt extends CoffeeProps {
    onEdit: (id?: string) => void;
}

const Coffee: React.FC<CoffeePropsExt> = ({ _id, name, origin, picture, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonText>{name}; {origin}</IonText>
            {picture?.webPath &&
                (<IonAvatar slot="start">
                    <img src={picture!.webPath}/>
                </IonAvatar>)}
        </IonItem>
    )
}

export default Coffee;