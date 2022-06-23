import axios, { AxiosResponse } from 'axios';

// eslint-disable-next-line no-shadow
enum HttpStatusCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

const errorStatusCodes = [
  HttpStatusCode.UNAUTHORIZED,
  HttpStatusCode.FORBIDDEN,
  HttpStatusCode.UNPROCESSABLE_ENTITY,
  HttpStatusCode.NOT_FOUND,
  HttpStatusCode.INTERNAL_SERVER_ERROR,
];

export class APIService {
  handleErrorStatusCodes(response: AxiosResponse) {
    if (errorStatusCodes.includes(response.status)) {
      throw new Error(`Error with response status ${response.status}`);
    }
    if (!response || !response.data) {
      throw new Error(`Error with response ${response}`);
    }
  }

  async get(endpoint: string) {
    const input: RequestInfo = endpoint;
    const response = await axios.get(input);
    this.handleErrorStatusCodes(response);
    return response.data;
  }
}
