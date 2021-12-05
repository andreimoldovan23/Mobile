import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { AuthContext } from '../auth';
import { CoffeePropsCached } from './CoffeeProps';
import { createCoffee, createCoffeeInStorage, deleteCoffee, deleteCoffeeFromStorage, getCoffee, getCoffeeFromStorage, 
    getCoffeeFromStorageWithFilter, getCoffeeWithFilter, newWebSocket, updateCoffee, updateCoffeeInStorage } from './api/coffeeApi';
import { getItemsFromLocalStorage, removeAllFromLocalStorage, saveAllToLocalStorage } from './storage/coffeeStorage';
import { NetworkContext } from '../network/NetworkProvider';

const log = getLogger('ItemProvider');

type SaveItemFn = (item: CoffeePropsCached, isOnline: boolean) => Promise<any>;
type DeleteItemFn = (id: string | undefined, isOnline: boolean) => Promise<any>;
type FetchItemFn = () => Promise<any>;
type ChangeFilterFn = (newFilter: string | undefined) => Promise<any>;

export interface ItemsState {
    items?: CoffeePropsCached[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    deleting: boolean,
    saveItem?: SaveItemFn,
    deleteItem?: DeleteItemFn,
    startFetch?: FetchItemFn,
    changeFilter?: ChangeFilterFn,
    pageNumber: number,
    filter?: string | undefined,
    hasMore: boolean,
}

export interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ItemsState = {
    saving: false,
    fetching: false,
    deleting: false,
    pageNumber: 0,
    filter: undefined,
    hasMore: true
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const DELETE_ITEM_STARTED = 'DELETE_ITEM_STARTED';
const DELETE_ITEM_SUCCEEDED = 'DELETE_ITEM_SUCCEEDED';
const HAS_MORE = 'HAS_MORE';
const APPLIED_FILTER = 'APPLIED_FILTER';
const RESET = 'RESET';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
    (state, { type, payload }) => {
        switch (type) {
            case FETCH_ITEMS_STARTED:
                return { ...state, fetching: true};
            case FETCH_ITEMS_SUCCEEDED:
                return { ...state, items: payload.items, pageNumber: payload.pageNumber, fetching: false };
            case FETCH_ITEMS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_ITEM_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_ITEM_SUCCEEDED:
                const items = [...(state.items || [])];
                const item = payload.item;
                const index = items.findIndex(it => it._id == item._id);
                if (index === -1) {
                    items.splice(0, 0, item);
                } else {
                    items[index] = item;
                }
                return { ...state, items: items, saving: false };
            case SAVE_ITEM_FAILED:
                return { ...state, savingError: payload.error, saving: false };
            case DELETE_ITEM_STARTED:
                return { ...state, deleting: true };
            case DELETE_ITEM_SUCCEEDED:
                const itemList = [...(state.items || [])];
                const receivedId = payload.id;
                const itemIndex = itemList.findIndex(it => it._id == receivedId);
                if (itemIndex !== -1) {
                    itemList.splice(itemIndex, 1);
                }
                return { ...state, items: itemList, deleting: false };
            case HAS_MORE:
                return { ...state, hasMore: false, fetching: false };
            case APPLIED_FILTER:
                return { ...state, pageNumber: 0, hasMore: true, items: [], fetching: true, filter: payload}
            case RESET:
                const { saving, deleting, pageNumber, filter } = initialState;
                return { ...state, items: [], saving, deleting, hasMore: true, pageNumber, filter, fetching: true };
            default:
                return state;
        }
    };

export const ItemContext = React.createContext<ItemsState>(initialState);
const pageSize: number = 15;

interface ItemProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext);
    const { isOnline, hasChanged } = useContext(NetworkContext);
    const [state, dispatch] = useReducer(reducer, initialState);

    const { items, fetching, fetchingError, saving, savingError, deleting, 
        pageNumber, filter, hasMore } = state;

    useEffect(syncStorageEffect, [isOnline]);
    useEffect(wsEffect, [token]);
    useEffect(getItems, [fetching]);

    const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
    const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);
    
    const startFetch = async function startFetchCallback() {
        dispatch({ type: FETCH_ITEMS_STARTED });
    };
    const changeFilter = async function changeFilterCallback(newFilter: string | undefined) {
        log('Dispatching fetch cause of changed filter');
        dispatch({ type: APPLIED_FILTER, payload: newFilter });
    }

    const value = { items, fetching, fetchingError, saving, savingError, deleting, 
        saveItem, deleteItem, startFetch, changeFilter, isOnline, pageNumber, hasMore };

    log('render');
    return (
        <ItemContext.Provider value={value}>
            {children}
        </ItemContext.Provider>
    );

    function getItems() {
        if (!token?.trim() || !fetching) {
            return;
        }

        let canceled = false;
        fetchItemsAsync();
        return () => { canceled = true; }

        async function fetchItemsAsync() {
            try {
                log("Fetch items with page number: ", pageNumber);

                let retrievedItems: CoffeePropsCached[] = [];
                if (isOnline) 
                    retrievedItems = !filter ? 
                    await getCoffee(token, pageNumber, pageSize) : 
                    await getCoffeeWithFilter(token, pageNumber, pageSize, filter);
                else retrievedItems = !filter ? 
                    await getCoffeeFromStorage() :
                    await getCoffeeFromStorageWithFilter(filter);

                log("Retrieved this many items: ", retrievedItems.length);

                if (isOnline && !canceled) {
                    if (retrievedItems && retrievedItems.length > 0)
                        dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items: [...(items || []), ...retrievedItems], pageNumber: pageNumber + 1 } });
                    else
                        dispatch({ type: HAS_MORE });
                } else if (!canceled) {
                    dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items: retrievedItems, pageNumber: pageNumber } })
                }
            } catch (error) {
                if (!canceled)
                    dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
            }
        }
    }

    async function saveItemCallback(item: CoffeePropsCached, isOnline: boolean) {
        if (!token?.trim()) {
            return;
        }

        try {
            dispatch({ type: SAVE_ITEM_STARTED });

            const savedItem = isOnline ?
                await (item._id ? updateCoffee(item, token) : createCoffee(item, token)) :
                await (item._id ? updateCoffeeInStorage(item) : createCoffeeInStorage(item));

            dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
        } catch (error) {
            dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
        }
    }

    async function deleteItemCallback(id: string | undefined, isOnline: boolean) {
        if (!token?.trim()) {
            return;
        }

        dispatch({ type: DELETE_ITEM_STARTED });
        if (id) isOnline ? await deleteCoffee(id, token) : await deleteCoffeeFromStorage(id);
        dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { id } });
    }

    function wsEffect() {
        if (!token?.trim() || !isOnline) {
            return;
        }

        let canceled = false;
        log('wsEffect - connecting');
        const closeWebSocket = newWebSocket(message => {
            if (canceled) { return; }

            const event = message.type;
            const item = message.payload;
            log(`ws message, event ${event} item ${JSON.stringify({name: item.name, origin: item.origin, id: item._id})}`);

            if (event === 'deleted') dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { id: item._id } });
            else if (event === 'created' || event === 'updated') dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: item } });
        }, token);

        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }

    function syncStorageEffect() {
        if (!hasChanged) return;

        let canceled = false;
        sync();
        return () => { canceled = true; };

        async function sync() {
            if (isOnline) {
                const itemList = (await getItemsFromLocalStorage()).data;
                itemList?.forEach(it => (async () => {
                    if (it.createdInCache && !it.deleted) //added and maybe edited offline and not deleted
                        await createCoffee({ name: it.name, origin: it.origin, picture: it.picture, lat: it.lat, long: it.long } as CoffeePropsCached, token);
                    else if (it.isChanged && !it.deleted) //edited offline and not deleted, existed before
                        await updateCoffee({ _id: it._id, name: it.name, origin: it.origin, picture: it.picture, lat: it.lat, long: it.long } as CoffeePropsCached, token);
                    else if (it._id && it.deleted) //deleted offline, existed before
                        await deleteCoffee(it._id, token);
                })());

                itemList && itemList.length > 0 &&
                    removeAllFromLocalStorage()
                        .then(_ => log("Successfully deleted all cached items"));
                
                if (!canceled)
                    dispatch({ type: RESET });
            } else if (items) {
                saveAllToLocalStorage(items)
                    .then(_ => log("Successfully cached all items"));
            }
        }
    }
};
