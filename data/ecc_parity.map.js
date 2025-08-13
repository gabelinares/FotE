// data/ecc_parity.map.js
export default {
  modulus: 256,
  letters_only: true,
  groups: {
    ALL:     { description: "Sum of all letter ASCII codes mod modulus", indexing: "1..N" },
    ODD:     { description: "Sum at odd positions (1,3,5,...)",          indexing: "1..N" },
    EVEN:    { description: "Sum at even positions (2,4,6,...)",          indexing: "1..N" },
    MOD3_0:  { description: "Sum where (index-1) % 3 == 0", indexing: "1..N" },
    MOD3_1:  { description: "Sum where (index-1) % 3 == 1", indexing: "1..N" },
    MOD3_2:  { description: "Sum where (index-1) % 3 == 2", indexing: "1..N" }
  }
};
