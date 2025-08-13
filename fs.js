// fs.js
import { FileNode } from './terminal.js';

// helper to add file quickly
function file(content, opts={}) { return new FileNode('file', { ...opts, content }); }
function dir(children={}, opts={}) { return new FileNode('dir', { ...opts, children }); }

export function buildFS() {
  const root = dir({
    'readme.txt': file(
`Flower of the Eden (FotE) — Operator Terminal
---------------------------------------------
Type \`help\` for commands. Use \`ls\` to list directories, \`cd\` to change directories,
\`open\` or \`cat\` to read files, and \`run <exe>\` to execute tools from /bin.

Notes:
- Some files are LIVE and may change when reopened.
- Some directories and files may be hidden.
- Clearance levels gate access. Doing > Knowing.`, { name:'readme.txt' }),

    'help.txt': file(
`Commands:
  ls [path]              List files and folders.
  cd <path>              Change directory.
  open <file> / cat <file>  Read a file's contents.
  run <exe> [args]       Run a program from /bin.
  back                   Go to the previous directory.
  clear                  Clear screen.
  history                Show command history.

Contextual (unlock by play):
  calibrate              Enter survival/birth laws (format: S:2,3  B:3).
  bloom                  Toggle visibility of hidden entries.
  aim [DEFUSE_CODE]      Defocus the focusing array.
  atlas                  Shortcut to run /bin/atlas.exe.
  transmit               Shortcut to run /bin/transmit.exe.

Tips:
  - Some patterns are stored as '.' and 'O' text.
  - \`gridview.exe\` can advance Next/Previous Generation and Measure properties.
  - LIVE files may append content when reopened.`, { name:'help.txt' }),

    'bin': dir({
      'plaintext.exe': file('', { exec:true, clearance:1, name:'plaintext.exe' }),
      'gridview.exe':  file('', { exec:true, clearance:1, name:'gridview.exe' }),
      'spectra.exe':   file('', { exec:true, clearance:1, name:'spectra.exe' }),
      'ecc_repair.exe':file('', { exec:true, clearance:4, name:'ecc_repair.exe' }),
      'aim.exe':       file('', { exec:true, clearance:3, name:'aim.exe' }),
      'atlas.exe':     file('', { exec:true, clearance:4, name:'atlas.exe' }),
      'transmit.exe':  file('', { exec:true, clearance:6, name:'transmit.exe' }),
      'blind.exe':     file('', { exec:true, clearance:6, name:'blind.exe' }),
      'version.txt':   file('FotE Terminal v0.9.0 (build: atlas-α3)', { name:'version.txt' }),
    }, { name:'bin' }),

    'logs': dir({
      'mission': dir({
        'primer.txt': file(
`Mission Primer (excerpt)
------------------------
A crowd suffocates a life.
A soul alone grows cold.
With two or three, we keep each other.
Three hands can raise the fallen.

(Note from an old operator: The machine listens best when you state your laws plainly.)`, { name:'primer.txt' }),
        'parity_notes.txt': file(
`Parity Notes for Field Repair
-----------------------------
We use simple modular checksums over LETTERS ONLY (A–Z). Spaces and punctuation are ignored.
Modulus: 256

Groups (indexing letters 1..N in the message):
  ALL    — sum of all letters' ASCII codes mod 256
  ODD    — sum at positions 1,3,5,... mod 256
  EVEN   — sum at positions 2,4,6,... mod 256
  MOD3_0 — sum at positions where (index-1) % 3 == 0
  MOD3_1 — sum where (index-1) % 3 == 1
  MOD3_2 — sum where (index-1) % 3 == 2

Field heuristic:
  - If exactly one letter is unknown (marked '?'), you can recover it uniquely from the checks.
  - Think in rhythms: 2-beat (ODD/EVEN) and 3-beat (MOD3_0..2) trace different oscillations.
  - The ALL checksum gives you the exact ASCII of the missing letter when others are known.`, { clearance:4, name:'parity_notes.txt' }),
        'failsafe_design.txt': file(
`Failsafe Design (Orientation Program)
-------------------------------------
Observation hazard: in rare geometry, the collimator can focus high-energy exotic flux.
Failsafe: if /.eden/flower is opened, arm a generation-based autodestruct protocol.

Protocol:
  - The reference pattern 'flower.pln' evolves to extinction in 19 generations.
  - While ARMED, advancing that pattern advances the protocol counter (GEN n/19).
  - At GEN 3, trained operators may DEFUSE by defocusing the collimator.
  - After defocus, the protocol is DISARMED; local pattern evolution is safe.

Operator reminder:
  Still forms hold the world still. Three of them in the right orientation drop the lens.`, { clearance:3, name:'failsafe_design.txt' }),
      }, { name:'mission' }),
      'ops': dir({
        'console_0001.log': file('[OK] Boot. Telemetry link nominal. CMB integration 0.97.', { name:'console_0001.log' }),
        'console_0013.log': file('[NOTICE] Scheduler drift detected. Periodicity scan queued.', { clearance:2, name:'console_0013.log' }),
      }, { name:'ops' }),
      'science': dir({
        'retrodiction_memo.txt': file(
`Retrodiction Memo
-----------------
We reconstruct forward from sparse early states; there is a horizon we cannot cross.
Call it the parentless coast. Do not claim what you cannot retrodict.`, { clearance:2, name:'retrodiction_memo.txt' }),
      }, { name:'science' }),
    }, { name:'logs' }),

    'sensors': dir({
      'cmb.txt': file(
`CMB Integration Log (LIVE)
--------------------------
t+0001: ΔT/T ~ 10^-5. Mapping anisotropy seeds...
(Note: This file appends trailing markers as sampling continues.)`, { live:true, name:'cmb.txt' }),
      'line_21cm.txt': file(
`Hydrogen 21-cm Line
-------------------
Redshifted spin-flip emission observed. Narrow-band channel stable.`, { name:'line_21cm.txt' }),
      'helium_recomb.txt': file(
`Helium Recombination
--------------------
Signatures consistent with post-recombination plasma cooling.`, { name:'helium_recomb.txt' }),
      'anisotropy_map.asc': file(
`Anisotropy Map (ASCII)
----------------------
..oOOo..o...
.o....o..o..
..oo..o..o..
(Visualization only; not to scale)`, { clearance:2, name:'anisotropy_map.asc' }),
    }, { name:'sensors' }),

    'spectra': dir({
      'quicklook.txt': file(
`Quicklook
---------
Broad blackbody spectrum with minute ripples.
Nothing is flat. Nothing is silent.`, { name:'quicklook.txt' }),
      'features.txt': file(
`Noted Features
--------------
Micro-oscillations are expected; rhythm is a property, not a defect.`, { clearance:2, name:'features.txt' }),
    }, { name:'spectra' }),

    'patterns': dir({
      'reference': dir({
        'dot.txt':     file(`O`, { name:'dot.txt' }),
        'block.txt':   file(`OO\nOO`, { name:'block.txt' }),
        'blinker.txt': file(`OOO`, { name:'blinker.txt' }),
        'toad.txt':    file(`..OOO\nOOO..`, { clearance:2, name:'toad.txt' }),
        'beacon.txt':  file(`OO..\nOO..\n..OO\n..OO`, { clearance:2, name:'beacon.txt' }),
        'glider.txt':  file(`.O.\n..O\nOOO`, { clearance:2, name:'glider.txt' }),
        'lwss.txt':    file(`.O..O\nO....\nO...O\nOOOO.`, { clearance:3, name:'lwss.txt' }),
        'pulsar.txt':  file(
`..OOO...OOO..
.............
O....O.O....O
O....O.O....O
O....O.O....O
..OOO...OOO..
.............
..OOO...OOO..
O....O.O....O
O....O.O....O
O....O.O....O
.............
..OOO...OOO..`, { clearance:3, name:'pulsar.txt' }),
      }, { name:'reference' }),
      'user': dir({
        'last.txt': file(`.`, { clearance:2, name:'last.txt' }),
      }, { name:'user' }),
    }, { name:'patterns' }),

    'research': dir({
      'ships.txt': file(
`Ships (speed notation)
----------------------
glider: c/4  (diagonal)
LWSS:   c/2  (orthogonal)`, { clearance:2, name:'ships.txt' }),
      'oscillators.txt': file(
`Oscillators (periods)
---------------------
blinker: period 2
toad:    period 2
beacon:  period 2
pulsar:  period 3`, { clearance:2, name:'oscillators.txt' }),
      'still_lifes.txt': file(
`Still-lifes (stable forms)
--------------------------
block:
OO
OO

beehive:
.OO.
O..O
.OO.

loaf:
.OO.
O..O
.O.O
..O.`, { clearance:2, name:'still_lifes.txt' }),
    }, { name:'research' }),

    '.eden': dir({
      'README.txt': file(`Hidden Workspace (.eden)\n------------------------\nYou should not be here by accident.`, { clearance:2, name:'README.txt' }),
      'flower': dir({
        'flower.pln': file(
`.OOO..OO
.OO.O.O.OOO
.OOO..OOOOO
O.O.O.O.O.O
OOOO.O.O.O
....OOO
.O.O.O.OOOO
O.O.O.O.O.O
OOOOO..OOO
OOO.O.O.OO
...OO..OOO`, { clearance:2, name:'flower.pln' }),
        'countdown.gen': file(`GEN: 0/19 (DISARMED)`, { clearance:2, name:'countdown.gen' }),
        'message.gol': file(
`OOOOO.OOOO..O...O.OOOO..OOOOO.OOOO..OOOOO.OOOO..OOOOO.OOOO
..O..O...O.O..O..O...O...O...O...O...O...O...O...O...O...O
..O..OOOOO..OO...OOOO...O....OOOOO...OOO..OOOOO...OOO..OOOO
..O..O...O.O..O..O...O...O...O...O...O...O...O...O...O...O
..O..O...O.O...O.OOOO...OOOO..OOO....OOOO.OOOO....OOO..OOO.
...........................................................
OOOOO.OOOO..OOOO..OOOO..OOOOO.O...O.OOOO..OOOOO..OOOOO.O...O
...O..O...O.O...O.O...O.O.....O...O..O...O.....O...O..O...O
..O...OOOO..OOOO..OOOO..OOOO...O.O...O...OOOO...OOO...OOOOO
.O....O...O.O..O..O..O..O.......O....O...O.....O..O...O...O
OOOOO.OOOO..O...O.O...O.OOOOO...O....O...OOOOO..O...O.O...O
...........................................................
.OOO..OOOO..OOOO..OOOO..O...O.OOOO..OOOO..OOOO..OOOOO.O...O
O...O.O...O.O...O.O...O.O...O.O...O.O...O.O...O...O...O...O
O...O.OOOO..OOOO..OOOO..OOOOO.OOOO..OOOO..OOOO....O...OOOO.
O...O.O..O..O..O..O..O..O...O.O...O.O..O..O..O...O....O...O
.OOO..O...O.O...O.O...O.O...O.OOOO..O...O.O...O..O.....O... 
...........................................................
OOOOO.OOOO..OOOO..OOOO..OOOO..OOOO..OOOO..O...O
..O..O...O.O...O.O...O.O...O...O...O...O..O...O
..O..OOOO..OOOO..OOOO..OOOO...O....OOOO..OOOOO
..O..O..O..O..O..O..O..O..O...O....O..O..O...O
..O..O...O.O...O.O...O.O...O...O....O...O.O...O`, { clearance:4, name:'message.gol' }),
        'message.cor': file(
`WE ARE OUR OWN ANCESTOR DE?USE THE LENS DECIDE WHAT TO SEND
CHECKSUMS(mod256): ALL=43, ODD=33, EVEN=10, MOD3_0=208, MOD3_1=179, MOD3_2=168`, { clearance:4, name:'message.cor' }),
        'glyph_key.asc': file(
`Glyph Key
---------
Use /bin/atlas.exe to scan a region of a grid and match it to a known glyph.
All glyphs are defined at +3 generations. This file contains no mapping.
See: /.eden/tools/atlas.map`, { clearance:4, name:'glyph_key.asc' }),
      }, { name:'flower' }),
      'tools': dir({
        'atlas.map': file('// loaded via data/atlas.map.js', { clearance:4, name:'atlas.map' }),
        'ecc_parity.map': file('// loaded via data/ecc_parity.map.js', { clearance:4, name:'ecc_parity.map' }),
      }, { name:'tools' }),
      'locks': dir({
        'focuser.lock': file('ENGAGED', { clearance:5, name:'focuser.lock' }),
        'atlas.lock':   file('PRESENT', { clearance:6, name:'atlas.lock' }),
      }, { name:'locks' }),
    }, { hidden:true, clearance:2, name:'.eden' }),

    'keys': dir({
      'clearance.key': file('1', { name:'clearance.key' }),
    }, { name:'keys' }),

    'out': dir({
      // 'transmitted.txt' appears after transmit
    }, { name:'out' }),

  }, { name:'/' });

  return root;
}
