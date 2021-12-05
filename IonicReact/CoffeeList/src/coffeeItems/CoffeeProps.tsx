import { Photo } from "../photoItems/PhotoProps";

export interface CoffeeProps {
    _id?: string;
    name: string;
    origin: string;
    picture?: Photo;
    long?: number;
    lat?: number;
}

export interface CoffeePropsCached extends CoffeeProps {
    createdInCache: boolean;
    deleted: boolean;
    isChanged: boolean;
}

export interface CoffeeOrigins {
    origin: string
}