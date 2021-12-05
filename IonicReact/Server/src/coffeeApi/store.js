import dataStore from 'nedb-promise';

export class CoffeeStore {
  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload });
  }
  
  async find(props) {
    return this.store.find(props);
  }
  
  async findOne(props) {
    return this.store.findOne(props);
  }
  
  async insert(cof) {
    if (!cof.name || !cof.origin) { 
      throw new Error('Missing properties')
    }
    return this.store.insert(cof);
  };
  
  async update(props, cof) {
    return this.store.update(props, cof);
  }
  
  async remove(props) {
    return this.store.remove(props);
  }
}

export default new CoffeeStore({ filename: './db/coffee.json', autoload: true });