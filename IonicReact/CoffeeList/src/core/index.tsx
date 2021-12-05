export const baseUrl = 'localhost:3000';

export const getLogger: (tag: string) => (...args: any) => void =
    tag => (...args) => console.log(tag, ...args);

const log = getLogger('api');

export interface ResponseProps<T> {
  data: T;
}

export function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res?.data);
    })
    .catch(err => {
      log(`${fnName} - failed`);
      return Promise.reject(err);
    });
}

export const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

export const authConfig = (token: string | null) => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token ? token: ''}`,
  }
});

export const paginationConfig = (token: string | null, pageNumber: number | undefined, pageSize: number) => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token ? token : ''}`,
    'Page': pageNumber,
    'Size': pageSize,
  }
})

export const filterConfig = (token: string | null, pageNumber: number | undefined, pageSize: number, filter: string) => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token ? token : ''}`,
    'Page': pageNumber,
    'Size': pageSize,
    'Filter': filter
  }
})
