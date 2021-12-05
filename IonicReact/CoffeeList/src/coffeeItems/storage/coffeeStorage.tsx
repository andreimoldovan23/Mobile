import { Plugins } from '@capacitor/core';
import { ResponseProps } from '../../core';
import { CoffeeOrigins, CoffeePropsCached } from '../CoffeeProps';
import { v4 as uuidv4 } from 'uuid';

const { Storage } = Plugins;

export const getItemsFromLocalStorage: () => Promise<ResponseProps<CoffeePropsCached[]>> = () => {
    return (async () => {
        const storedItemsString = await Storage.get({ key: 'items' });
        return storedItemsString.value && storedItemsString.value !== '' ? { data: JSON.parse(storedItemsString.value) } : { data: [] };
    })();
}

export const getOriginsFromLocalStorage: () => Promise<ResponseProps<CoffeeOrigins[]>> = () => {
    return (async () => {
        const storedItems = await getItemsFromLocalStorage();
        let origins = storedItems.data.map(it => it.origin );
        origins = Array.from(new Set<string>(origins));
        return { data: origins.map(it => { return { origin: it }; })}
    })();
}

export const getItemsFromLocalStorageWithFilter: (filter: string) => Promise<ResponseProps<CoffeePropsCached[]>> = (filter) => {
    return (async () => {
        const storedItems = await getItemsFromLocalStorage();
        return { data: storedItems.data.filter(it => it.origin === filter) };
    })();
}

export const saveItemToLocalStorage: (coffee : CoffeePropsCached) => Promise<ResponseProps<CoffeePropsCached>> = (coffee) => {
    return (async () => {
        let storedItems = await getItemsFromLocalStorage();
        coffee._id = uuidv4();
        coffee.createdInCache = true;
        storedItems.data.push(coffee);
        await Storage.set({ key: 'items', value: JSON.stringify(storedItems.data) });
        return { data: coffee };
    })();
}

export const updateItemInLocalStorage: (coffee: CoffeePropsCached) => Promise<ResponseProps<CoffeePropsCached>> = (coffee) => {
    return (async () => {
        let storedItems = await getItemsFromLocalStorage();
        const index = storedItems.data.findIndex(it => it._id === coffee._id);
        if (index !== -1) {
            coffee.isChanged = true;
            storedItems.data[index] = coffee;
            await Storage.set({ key: 'items', value: JSON.stringify(storedItems.data) });
        }
        return { data: coffee };
    })();
}

export const deleteItemInLocalStorage: (id: string) => Promise<any> = (id) => {
    return (async () => {
        let storedItems = await getItemsFromLocalStorage();
        const index = storedItems.data.findIndex(it => it._id === id);
        if (index !== -1) storedItems.data[index].deleted = true;
        await Storage.set({ key: 'items', value: JSON.stringify(storedItems.data) });
    })();
}

export const saveAllToLocalStorage: (items: CoffeePropsCached[]) => Promise<any> = (items) => {
    return (async () => {
        await Storage.set({ key: 'items', value: JSON.stringify(items) });
    })();
}

export const removeAllFromLocalStorage: () => Promise<any> = () => {
    return (async () => {
        await Storage.remove({ key: 'items' });
    })();
}