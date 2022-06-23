import moment from 'moment';

export const today = moment(moment.utc().startOf('day').toDate()).format('MM/DD/YYYY');
export const one_month_ago = moment(moment.utc().startOf('day').subtract(1, 'month').toDate()).format('MM/DD/YYYY');

export const updateTimestamp = (timestamp: string | number) => {
  const block_timestamp = timestamp;
  const d = new Date(0);
  let final_timestamp;
  d.setUTCSeconds(Number(block_timestamp));
  d.getMonth() > 10
    ? (final_timestamp = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`)
    : (final_timestamp = `${d.getFullYear()}-0${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`);
  return final_timestamp;
};
