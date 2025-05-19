// utils/dateHelpers.js
import dayjs from 'dayjs';

/**
 * Format text input to dd/mm/yyyy while typing
 * @param {string} value
 * @returns {string}
 */
export const formatDateInput = (value) => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  let result = '';

  if (numbers.length <= 2) {
    result = numbers;
  } else if (numbers.length <= 4) {
    result = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    result = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  }

  return result;
};

/**
 * Convert dd/mm/yyyy to yyyy-mm-dd (ISO)
 * @param {string} formattedDate
 * @returns {string|null} ISO string or null if invalid
 */
export const convertToISODate = (formattedDate) => {
  const [day, month, year] = formattedDate.split('/');
  const iso = `${year}-${month}-${day}`;

  return dayjs(iso, 'YYYY-MM-DD', true).isValid() ? iso : null;
};

/**
 * Format ISO date string to dd/mm/yyyy
 * @param {string} iso
 * @returns {string}
 */
export const formatToDDMMYYYY = (iso) => {
  return dayjs(iso).format('DD/MM/YYYY');
};

/**
 * Format ISO date string to yyyy-mm-dd (native input)
 * @param {string} iso
 * @returns {string}
 */
export const formatToNativeDate = (iso) => {
  return dayjs(iso).format('YYYY-MM-DD');
};
