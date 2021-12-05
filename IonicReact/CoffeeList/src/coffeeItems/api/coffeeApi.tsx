import axios from 'axios';
import { getLogger, withLogs, authConfig, baseUrl, paginationConfig, filterConfig } from "../../core";
import { CoffeeOrigins, CoffeePropsCached } from "../CoffeeProps";
import { deleteItemInLocalStorage, getItemsFromLocalStorage, getItemsFromLocalStorageWithFilter, 
    getOriginsFromLocalStorage, saveItemToLocalStorage, updateItemInLocalStorage } from '../storage/coffeeStorage';

const log = getLogger("Coffee Api");

const coffeeUrl = `http://${baseUrl}/api/coffee`;

interface MessageData {
    type: string;
    payload: CoffeePropsCached;
}

//api stuff
export const getCoffee: (token: string | null, pageNumber: number, pageSize: number) => Promise<CoffeePropsCached[]> = (token, pageNumber, pageSize) => {
    return withLogs(axios.get(coffeeUrl, paginationConfig(token, pageNumber, pageSize)), 'getCoffee - all'); 
}

export const getCoffeeWithFilter: (token: string | null, pageNumber: number, pageSize: number, filter: string) => Promise<CoffeePropsCached[]> = (token, pageNumber, pageSize, filter) => {
    return withLogs(axios.get(coffeeUrl, filterConfig(token, pageNumber, pageSize, filter)), 'getCoffee - with filter');
}

export const createCoffee: (coffee: CoffeePropsCached, token: string | null) => Promise<CoffeePropsCached> = (coffee, token) => {
    return withLogs(axios.post(coffeeUrl, coffee, authConfig(token)), 'createCoffee');
}

export const updateCoffee: (coffee: CoffeePropsCached, token: string | null) => Promise<CoffeePropsCached> = (coffee, token) => {
    return withLogs(axios.put(`${coffeeUrl}/${coffee._id}`, coffee, authConfig(token)), 'updateCoffee');
}

export const deleteCoffee: (id: string, token: string | null) => Promise<any> = (id, token) => {
    return withLogs(axios.delete(`${coffeeUrl}/${id}`, authConfig(token)), 'deleteCoffee');
}

export const getCoffeeOrigins: (token: string | null) => Promise<CoffeeOrigins[]> = (token) => {
    return withLogs(axios.get(`${coffeeUrl}/origins`, authConfig(token)), 'getCoffeeOrigins');
}

//storage stuff
export const getCoffeeFromStorage: () => Promise<CoffeePropsCached[]> = () => {
    return withLogs(getItemsFromLocalStorage(), 'getCoffeeFromStorage - all');
}

export const getOriginsFromStorage: () => Promise<CoffeeOrigins[]> = () => {
    return withLogs(getOriginsFromLocalStorage(), 'getOriginsFromLocalStorage');
}

export const getCoffeeFromStorageWithFilter: (filter: string) => Promise<CoffeePropsCached[]> = (filter) => {
    return withLogs(getItemsFromLocalStorageWithFilter(filter), 'getCoffeeFromStorageWithFilter');
}

export const createCoffeeInStorage: (coffee: CoffeePropsCached) => Promise<CoffeePropsCached> = (coffee) => {
    return withLogs(saveItemToLocalStorage(coffee), 'createCoffeeInStorage');
}

export const updateCoffeeInStorage: (coffee: CoffeePropsCached) => Promise<CoffeePropsCached> = (coffee) => {
    return withLogs(updateItemInLocalStorage(coffee), 'updateCoffeeInStorage');
}

export const deleteCoffeeFromStorage: (id: string) => Promise<any> = (id) => {
    return withLogs(deleteItemInLocalStorage(id), 'deleteCoffeeFromStorage');
}

//websocket stuff
export const newWebSocket = (onMessage: (data: MessageData) => void, token: string | null) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}