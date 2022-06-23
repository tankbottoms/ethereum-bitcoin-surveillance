import moment from 'moment';
import { BLANK } from './constants';
import { logger } from '.';

export const dateFormat = 'MM/DD/YYYY';

export const is_date_same = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export const DAY_ABBREVIATED = ['Sun', 'M', 'T', 'W', 'Th', 'F', 'Sat'];
export const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const PST_OFFSET = 8;
export const TODAY_DATE = new Date();
export const now = TODAY_DATE;
export const DEFAULT_START_DATE = new Date(now.getFullYear(), now.getMonth(), now.getDay() - 30 + 1, now.getDate());

export type DateRange = { fromDate: Date; toDate: Date };

export const dateFormatISO8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
export const getCurrentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

export const validate_date_range = (start_date: string, end_date: string): boolean => {
  const start = new Date(start_date).getTime();
  const end = new Date(end_date).getTime();
  let valid: boolean = false;
  if (start > end) {
    false && logger.error(`from "${start_date}" shouldn't be larger than "${end_date}"`);
    valid = false;
  } else valid = true;
  return valid;
};

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

export const dateToStr = (date: Date) => {
  try {
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    console.error(e);
    return e;
  }
};

export const strToDate = (date: string) => {
  try {
    const result = /(\d+)\/(\d+)\/(\d+)/.exec(date);
    if (!result) {
      throw new Error('The provided date is invalid. It should be in the mm/dd/yyyy format.');
    } else {
      const [, month, day, year] = result;
      // eslint-disable-next-line no-shadow
      const dateFormat = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (dateFormat.toString() === 'Invalid Date')
        throw new Error('The provided toDate is invalid. It should be in the mm/dd/yyyy format.');
      return dateFormat;
    }
  } catch (e) {
    console.error(e);
    return e;
  }
};

// preferred formating for Slack
export const formatDateTime = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = checkValueLength(`${d.getMonth() + 1}`);
  const day = checkValueLength(`${d.getDate()}`);
  const hours = checkValueLength(`${d.getHours()}`);
  const mins = checkValueLength(`${d.getMinutes()}`);
  const seconds = checkValueLength(`${d.getSeconds()}`);
  const milliseconds = checkValueLength(`${d.getMilliseconds()}`);
  const finalTime = [hours, mins, seconds, milliseconds].join(':');
  const finalDate = [year, month, day].join('-');
  return `${finalDate}-${finalTime}`;
};

export const formatDate = (date: Date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
};

export const formatDateWithDivider = (date: Date, divider: string = '/') => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join(divider);
};

export const eightCharDate = (date: Date) => {
  try {
    return moment(date).format('YYYYMMDD').toString();
  } catch (e) {
    console.error(e);
    return e;
  }
};

export const compactLoggingDateTime = () => {
  const hours = ('0' + now.getHours()).slice(-2); // 0-23
  const minutes = ('0' + now.getMinutes()).slice(-2); // 0-59
  const seconds = ('0' + now.getSeconds()).slice(-2);
  const ms = '0' + now.getMilliseconds(); //.slice(-2);
  return `[${eightCharDate(new Date())}:${hours}h:${minutes}m:${seconds}s:${ms}ms]`;
};

export const compactLoggingTime = () => {
  try {
    const hours = ('0' + now.getHours()).slice(-2); // 0-23
    const minutes = ('0' + now.getMinutes()).slice(-2); // 0-59
    const seconds = ('0' + now.getSeconds()).slice(-2);
    const ms = '0' + now.getMilliseconds(); //.slice(-2);
    return `[${hours}h:${minutes}m:${seconds}s:${ms}ms]`;
  } catch (e) {
    console.error(e);
    return e;
  }
};

export const isDate = (dateStr: string) => {
  return !isNaN(new Date(dateStr).getDate());
};

export const twelveCharDate = (date: Date) => {
  let monthPad: boolean = false,
    dayPad: boolean = false,
    hourPad: boolean = false;
  if ((date.getMonth() + 1).toString().length === 1) monthPad = true;
  if ((date.getDate() + 1).toString().length === 1) dayPad = true;
  if ((date.getHours() + 1).toString().length === 1) hourPad = true;

  return (
    `${date.getFullYear()}` +
    `${monthPad ? 0 : BLANK}` +
    `${date.getMonth() + 1}` +
    `${dayPad ? 0 : BLANK}` +
    `${date.getDate()}` +
    `${hourPad ? 0 : BLANK}` +
    `${date.getHours()}`
  ).toString();
};

export const sixteenCharDate = (date: Date) => {
  let monthPad: boolean = false,
    dayPad: boolean = false,
    hourPad: boolean = false,
    minutePad: boolean = false,
    secondPad: boolean = false,
    millisecPad: boolean = false;
  if ((date.getMonth() + 1).toString().length === 1) monthPad = true;
  if ((date.getDate() + 1).toString().length === 1) dayPad = true;
  if ((date.getHours() + 1).toString().length === 1) hourPad = true;
  if ((date.getMinutes() + 1).toString().length === 1) minutePad = true;
  if ((date.getSeconds() + 1).toString().length === 1) secondPad = true;
  if ((date.getMilliseconds() + 1).toString().length === 1) millisecPad = true;

  return (
    `${date.getFullYear()}` +
    `${monthPad ? 0 : BLANK}` +
    `${date.getMonth() + 1}` +
    `${dayPad ? 0 : BLANK}` +
    `${date.getDate()}` +
    `${hourPad ? 0 : BLANK}` +
    `${date.getHours()}` +
    `${minutePad ? 0 : BLANK}` +
    `${date.getMinutes()}` +
    `${secondPad ? 0 : BLANK}` +
    `${date.getSeconds()}` +
    `${millisecPad ? 0 : BLANK}` +
    `${date.getMilliseconds().toString().slice(-2)}`
  ).toString(); // 202101012359010111
};

export const convertUTCDateToLocalDate = (date: Date) => {
  const localtime = new Date(date.getTime() + PST_OFFSET * 60 * 1000);
  const offset = date.getTimezoneOffset() / 60;
  const hours = date.getHours();
  localtime.setHours(hours - offset);
  return localtime;
};

const checkValueLength = (value: string) => {
  if (value.length < 2) return '0' + value.toString();
  return value.toString();
};

export const isWeekend = (day: number) => {
  if (day === 0 || day >= 6) return true;
  return false;
};

export const isOfficeHours = (hour: number) => {
  if (hour >= 9 && hour <= 17) return true;
  return false;
};

export const getMonthDateRange = (dateRange: { fromDate: string; toDate: string }) => {
  try {
    const from = new Date(dateRange.fromDate);
    const to = new Date(dateRange.toDate);
    const INCLUSIVE = 1;
    const TOTAL_MONTH_OF_THE_YEAR = 12;
    const alldate: Date[] = [];
    const fromMonth = from.getMonth();
    const fromYear = from.getFullYear();
    const toMonth = to.getMonth();
    const toYear = to.getFullYear();
    const yearDifference = (toYear - fromYear) * TOTAL_MONTH_OF_THE_YEAR;
    const monthDifference = toMonth + yearDifference - fromMonth;
    if (monthDifference === 0) alldate.push(new Date(fromYear, fromMonth));
    let count = 0;
    for (let i = 0; i < monthDifference + INCLUSIVE; i++) {
      const newMonth = fromMonth + count;
      alldate.push(new Date(fromYear, newMonth));
      count++;
    }
    return alldate;
  } catch (e) {
    console.error(e);
    return e;
  }
};

// migrate to moment library to avoid any bugs, see function above
export const getDaysDateRange = (dateRange: { fromDate: string | Date; toDate: string | Date }) => {
  try {
    const from = typeof dateRange.fromDate !== 'string' ? dateRange.fromDate : new Date(dateRange.fromDate);
    const to = typeof dateRange.toDate !== 'string' ? dateRange.toDate : new Date(dateRange.toDate);

    // console.log(`${from} => ${to}`);
    const TOTAL_MONTH_OF_THE_YEAR = 12;
    const APPROXIMATE_DAYS_OF_THE_MONTH = 28;
    const alldate: Date[] = [];
    const INCLUSIVE = 1;
    const fromDay = from.getUTCDate();
    const fromMonth = from.getUTCMonth();
    const fromYear = from.getUTCFullYear();
    const toMonth = to.getUTCMonth();
    const toYear = to.getUTCFullYear();
    const toDay = to.getUTCDate();
    const hrs = 24 - 8;
    const yearDifference = (toYear - fromYear) * TOTAL_MONTH_OF_THE_YEAR;
    const monthDifference = (toMonth + yearDifference - fromMonth) * APPROXIMATE_DAYS_OF_THE_MONTH;
    const dayDifference = toDay + monthDifference - fromDay;

    // console.log(to, from, dayDifference, toDay, fromDay, monthDifference, yearDifference, hrs, "difference");
    if (dayDifference <= 0) return alldate.push(new Date(toYear, toMonth, toDay));

    let count = -1;
    for (let i = 0; i < dayDifference + INCLUSIVE; i++) {
      const newDay = fromDay + count;
      alldate.push(new Date(fromYear, fromMonth, newDay, hrs));
      count++;
    }
    return alldate;
  } catch (e) {
    console.error(e);
    return e;
  }
};

export const makeTime = (firebaseTimestamp: { _seconds: number; _nanoseconds: number }): Date | null => {
  if (!firebaseTimestamp || !firebaseTimestamp._seconds) return null;
  return new Date(firebaseTimestamp._seconds * 1000);
};

export const dateInPast = (firstDate: Date, secondDate: Date) => {
  return new Date(firstDate) > new Date(secondDate); // true if time1 is later
};

// ISO 8601
export function getWeekNumber(year: number, month: number, dDate: number) {
  const newDate = new Date(year, month, dDate);
  const date = newDate.getDate();
  const day = newDate.getDay();
  // process.stdout.write(`${newDate.toDateString()} => dayDate:${date}, day of week:${day} to week no. =>`);
  const Q = (date + day) / 7;
  const R = (date + day) % 7;
  if (R !== 0) {
    // process.stdout.write(`${Math.floor(Q)}\n`);
    return Math.floor(Q);
  } else {
    // process.stdout.write(`${Q}\n`);
    return Q;
  }
}
// https://en.wikipedia.org/wiki/Federal_holidays_in_the_United_States
export const holidays = {
  // keys are formatted as month,week,day
  '0,1,1': 'New Years Day',
  '0,3,15': 'Martin Luther King, Jr. Day',
  '1,4,22': "Washington's Birthday",
  '1,2,1': "President's Day",
  '6,4,30': 'Memorial Day',
  '7,1,4': 'Independance Day',
  '8,1,7': 'Labor Day', // First Monday in September
  '10,2,11': "Veteran's Day",
  '9,2,14': 'Columbus Day', // Second Monday in October
  '10,3,28': 'Thanksgiving Day', // Fourth Thursday of November
  '11,4,25': 'Christmas Day',
  '11,4,31': 'New Years Eve',
};

export const floatingHolidays = {
  // month, count/week, day
  '0,3,1': 'Martin Luther King, Jr. Day', // 3rd Monday of January
  '4,4,1': 'Memorial Day', // Last Monday in May
  '8,1,1': 'Labor Day', // First Monday in September
  '9,2,1': 'Columbus Day', // 2nd Monday in October
  '10,4,5': 'Thanksgiving Day',
};

export const addMinutes = (date: Date, minutes: number) => {
  return new Date(date.getTime() + minutes * 60000);
};
