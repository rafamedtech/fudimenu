import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../src/lib/import/csv';

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('keeps commas inside quoted fields', () => {
    expect(parseCsv('name,price\n"Tacos, 3 pzas",120')).toEqual([
      ['name', 'price'],
      ['Tacos, 3 pzas', '120'],
    ]);
  });

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsv('desc\n"line1\nline2"')).toEqual([['desc'], ['line1\nline2']]);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('q\n"say ""hi"""')).toEqual([['q'], ['say "hi"']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('strips a leading UTF-8 BOM', () => {
    expect(parseCsv('﻿name\nTacos')).toEqual([['name'], ['Tacos']]);
  });

  it('drops fully-empty lines but keeps ragged rows', () => {
    expect(parseCsv('a,b\n\n1\n\n')).toEqual([['a', 'b'], ['1']]);
  });

  it('flushes a final row with no trailing newline', () => {
    expect(parseCsv('a\nb')).toEqual([['a'], ['b']]);
  });
});
