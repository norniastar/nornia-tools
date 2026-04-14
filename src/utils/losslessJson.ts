import { parse, stringify } from 'lossless-json';

export const parseJsonPreservingNumbers = (input: string) => parse(input);

export const stringifyJsonPreservingNumbers = (value: unknown, space: number | string = 0) => {
  const output = stringify(value, undefined, space);

  if (typeof output !== 'string') {
    throw new TypeError('Top-level JSON value is not serializable');
  }

  return output;
};

export const formatJsonPreservingNumbers = (input: string, space = 2) =>
  stringifyJsonPreservingNumbers(parseJsonPreservingNumbers(input), space);

export const minifyJsonPreservingNumbers = (input: string) =>
  stringifyJsonPreservingNumbers(parseJsonPreservingNumbers(input));
