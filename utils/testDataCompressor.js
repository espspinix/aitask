import { dataCompressor } from './dataCompressor.js';

const tests = [
  {
    name: 'Basic collapse: array of objects with two attributes',
    input: [ { name: 'a', data: 1 }, { name: 'b', data: 2 } ],
    expected: { a: { data: 1 }, b: { data: 2 } },
    options: { collapseOptions: { collapseSingleAttr: false } } // override default behavior
  },
  {
    name: 'Basic collapse: array of objects with single attribute (collapsed)',
    input: [ { name: 'a', data: 1 }, { name: 'b', data: 2 } ],
    expected: { a: 1, b: 2 }
  },
  {
    name: 'Basic collapse: array of objects with single attribute (not collapsed)',
    input: [ { name: 'a', data: 1 }, { name: 'b', data: 2 } ],
    expected: { a: { data: 1 }, b: { data: 2 } },
    options: { collapseOptions: { collapseSingleAttr: false } }
  },
  {
    name: 'Collapse with different key attribute',
    input: [ { id: 'x', value: 10 }, { id: 'y', value: 20 } ],
    expected: { x: { value: 10 }, y: { value: 20 } },
    options: { collapseOptions: { keyAttr: 'id', collapseSingleAttr: false } }
  },
  {
    name: 'Nested collapse: array within object values',
    input: [ { name: 'group1', items: [ { name: 'itemA', val: 1 }, { name: 'itemB', val: 2 } ] } ],
    expected: { group1: { items: { itemA: { val: 1 }, itemB: { val: 2 } } } },
    options: { collapseOptions: { collapseSingleAttr: false } }
  },
  {
    name: 'Nested collapse: array of objects with array values (collapsed)',
    input: [ { name: 'a', data: [1,4,8,2] }, { name: 'b', data: [2,3,7,5] } ],
    expected: { a: [1,4,8,2], b: [2,3,7,5] }
  },
  {
    name: 'No collapse for non-array input',
    input: { name: 'a', data: 1 },
    expected: { name: 'a', data: 1 }
  },
  {
    name: 'No collapse for array of non-objects',
    input: [1, 2, 3],
    expected: [1, 2, 3]
  },
  {
    name: 'No collapse for array of objects missing keyAttr',
    input: [ { id: 1, data: 'a' }, { data: 'b' } ],
    expected: [ { id: 1, data: 'a' }, { data: 'b' } ]
  },
  {
    name: 'Deep nesting with mixed types',
    input: [
      { name: 'level1A', children: [ { name: 'level2A', value: 10 }, { name: 'level2B', value: 20 } ] },
      { name: 'level1B', data: { type: 'info', details: [ { name: 'detailX', code: 'X' } ] } }
    ],
    expected: {
      level1A: { children: { level2A: { value: 10 }, level2B: { value: 20 } } },
      level1B: { data: { type: 'info', details: { detailX: { code: 'X' } } } }
    },
    options: { collapseOptions: { collapseSingleAttr: false } }
  },
  {
    name: 'Deep nesting with single attribute collapse',
    input: [
      { name: 'level1A', children: [ { name: 'level2A', value: 10 }, { name: 'level2B', value: 20 } ] },
      { name: 'level1B', data: { type: 'info', details: [ { name: 'detailX', code: 'X' } ] } }
    ],
    expected: {
      level1A: { level2A: 10, level2B: 20 },
      level1B: { type: 'info', details: { detailX: 'X' } }
    },
    options: { collapseOptions: { collapseSingleAttr: true } }
  },
  {
    name: 'Omit shallow key',
    input: { name: 1, type: 2, data: 3 },
    expected: { name: 1, data: 3 },
    options: { omit: 'type' }
  },
  {
    name: 'Omit deep key with wildcard',
    input: { a: { type: 1, x: 2 }, b: { type: 3, y: 4 } },
    expected: { a: { x: 2 }, b: { y: 4 } },
    options: { omit: '*.type' }
  },
  {
    name: 'Omit nested path',
    input: { attributes: { type: 1, value: 2 }, meta: { type: 3 } },
    expected: { attributes: { value: 2 }, meta: { type: 3 } },
    options: { omit: 'attributes.type' }
  },
  {
    name: 'Omit multiple keys',
    input: { name: 'x', type: 'y', data: { type: 1, value: 2 } },
    expected: { name: 'x', data: { value: 2 } },
    options: { omit: ['type', '*.type'] }
  },
  {
    name: 'Omit inside arrays',
    input: [ { data: 'a', type: 1 }, { data: 'b', type: 2 } ],
    expected: [ { data: 'a' }, { data: 'b' } ],
    options: { omit: '*.type' }
  },
  {
    name: 'Omit Test Func',
    input: [ { data: 'a', type: 1 }, { data: 'b', type: 2 } ],
    expected: [ { data: 'a', type: 1 }, { data: 'b' } ],
    options: { omit: [['*.type', (value) => value === 2]] }
  }
];

let passed = 0;
console.log('--- Running dataCompressor tests ---');
for (const t of tests) {
  const result = dataCompressor(t.input, t.options);
  const expected = t.expected;

  // Deep comparison for objects/arrays
  const isEqual = JSON.stringify(result) === JSON.stringify(expected);

  if (isEqual) {
    console.log(`✅ ${t.name}`);
    passed++;
  } else {
    console.log(`❌ ${t.name}`);
    console.log(`  Expected: ${JSON.stringify(expected, null, 2)}`);
    console.log(`  Got: ${JSON.stringify(result, null, 2)}`);
  }
}
console.log(`\n--- Test Summary: ${passed}/${tests.length} tests passed ---`);
