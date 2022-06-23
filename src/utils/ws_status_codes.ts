// eslint-disable-next-line no-shadow
export enum specificStatusCodeMappings {
  'Normal Closure' = 1000,
  'Going Away' = 1001,
  'Protocol Error' = 1002,
  'Unsupported Data' = 1003,
  '(For future)' = 1004,
  'No Status Received' = 1005,
  'Abnormal Closure' = 1006,
  'Invalid frame payload data' = 1007,
  'Policy Violation' = 1008,
  'Message too big' = 1009,
  'Missing Extension' = 1010,
  'Internal Error' = 1011,
  'Service Restart' = 1012,
  'Try Again Later' = 1013,
  'Bad Gateway' = 1014,
  'TLS Handshake' = 1015,
}

export const getStatusCodeString = (code: any): string => {
  if (code >= 0 && code <= 999) {
    return '(Unused)';
  } else if (code >= 1016) {
    if (code <= 1999) {
      return '(For WebSocket standard)';
    } else if (code <= 2999) {
      return '(For WebSocket extensions)';
    } else if (code <= 3999) {
      return '(For libraries and frameworks)';
    } else if (code <= 4999) {
      return '(For applications)';
    }
  }

  if (typeof specificStatusCodeMappings[code] !== 'undefined') {
    return specificStatusCodeMappings[code];
  }

  return '(Unknown)';
};
