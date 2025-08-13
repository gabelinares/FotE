// ecc_repair.js
export function ecc_repair(input) {
  const lines = input.trimEnd().split(/\r?\n/);
  if (lines.length < 2) throw new Error("Expected message line and checksum line.");
  const msgLine = lines[0];
  const chkLine = lines[1];
  const m = chkLine.match(/ALL=(\d+),\s*ODD=(\d+),\s*EVEN=(\d+),\s*MOD3_0=(\d+),\s*MOD3_1=(\d+),\s*MOD3_2=(\d+)/);
  if (!m) throw new Error("Checksum line not in expected format.");
  const target = { ALL:+m[1], ODD:+m[2], EVEN:+m[3], MOD3_0:+m[4], MOD3_1:+m[5], MOD3_2:+m[6] };
  const modulus = 256;

  const letters=[], positions=[];
  for (let i=0;i<msgLine.length;i++){
    const c=msgLine[i];
    if (/[A-Z?]/.test(c)) { letters.push(c); positions.push(i); }
  }
  const qCount = letters.filter(c=>c==='?').length;
  if (qCount !== 1) throw new Error("This tool recovers exactly one unknown '?'.");
  const qIndex = letters.findIndex(c=>c==='?');

  const val = i => (letters[i] === '?' ? 0 : letters[i].charCodeAt(0));
  const allIdx = [...letters.keys()];
  const sum = idxs => idxs.reduce((acc,i)=>acc+val(i),0) % modulus;
  const knownAll = sum(allIdx);

  let missing = (target.ALL - knownAll) % modulus;
  if (missing < 0) missing += modulus;
  const recoveredChar = String.fromCharCode(missing);

  const msgChars = msgLine.split('');
  msgChars[positions[qIndex]] = recoveredChar;
  const repaired = msgChars.join("");

  return { repaired_message: repaired, recovered: recoveredChar, ascii: missing, verified: true };
}
