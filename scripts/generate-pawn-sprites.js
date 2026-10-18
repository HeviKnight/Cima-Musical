const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }
  
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlineLength = width * 4;
  const rawData = Buffer.alloc(height * (1 + scanlineLength));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + scanlineLength)] = 0;
    rgbaBuffer.copy(rawData, y * (1 + scanlineLength) + 1, y * scanlineLength, (y + 1) * scanlineLength);
  }
  const idat = makeChunk('IDAT', zlib.deflateSync(rawData));
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const PALETTE = {
  P1: {
    pawn_base: [139, 92, 246, 255],
    pawn_dark: [91, 33, 182, 255],
    pawn_light: [216, 180, 254, 255],
    tower_base: [99, 102, 241, 255],
    tower_dark: [49, 46, 129, 255],
    tower_light: [199, 210, 254, 255],
    king_base: [236, 72, 153, 255],
    king_dark: [157, 23, 77, 255],
    king_light: [251, 207, 232, 255],
    gold: [250, 204, 21, 255],
    outline: [17, 24, 39, 255]
  },
  P2: {
    pawn_base: [239, 68, 68, 255],
    pawn_dark: [153, 27, 27, 255],
    pawn_light: [254, 202, 202, 255],
    tower_base: [249, 115, 22, 255],
    tower_dark: [154, 52, 18, 255],
    tower_light: [254, 215, 170, 255],
    king_base: [234, 179, 8, 255],
    king_dark: [133, 77, 14, 255],
    king_light: [254, 240, 138, 255],
    gold: [250, 204, 21, 255],
    outline: [17, 24, 39, 255]
  }
};

const PAWN_MAP = [
  '0000000000000000',
  '0000009999000000',
  '0000093322900000',
  '0000093221900000',
  '0000009219000000',
  '0000099219900000',
  '0000933221190000',
  '0000932221190000',
  '0000093221900000',
  '0000093221900000',
  '0000993221990000',
  '0009332221119000',
  '0093322221111900',
  '0099999999999900',
  '0000000000000000',
  '0000000000000000',
];

const TOWER_MAP = [
  '0000000000000000',
  '0009909909900000',
  '0009399399190000',
  '0009322222190000',
  '0000932221900000',
  '0000932421900000',
  '0000932421900000',
  '0000932221900000',
  '0000932221900000',
  '0009332221190000',
  '0009322221190000',
  '0093322221119000',
  '0093222222119000',
  '0099999999999900',
  '0000000000000000',
  '0000000000000000',
];

const KING_MAP = [
  '0000000990000000',
  '0000009449000000',
  '0009900990099000',
  '0093399449911900',
  '0093244224421900',
  '0009222442229000',
  '0009922222299000',
  '0000932222190000',
  '0009332442119000',
  '0009324444219000',
  '0009332442119000',
  '0093322222211900',
  '0093222222221900',
  '0099999999999900',
  '0000000000000000',
  '0000000000000000',
];

function renderSprite(map, pColors) {
  const buf = Buffer.alloc(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    const row = map[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      const idx = (y * 16 + x) * 4;
      let col = [0, 0, 0, 0];
      if (ch === '9') col = pColors.outline;
      else if (ch === '1') col = pColors.pawn_dark;
      else if (ch === '2') col = pColors.pawn_base;
      else if (ch === '3') col = pColors.pawn_light;
      else if (ch === '4') col = pColors.gold;
      buf[idx] = col[0];
      buf[idx + 1] = col[1];
      buf[idx + 2] = col[2];
      buf[idx + 3] = col[3];
    }
  }
  return buf;
}

function renderTower(map, pColors) {
  const buf = Buffer.alloc(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    const row = map[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      const idx = (y * 16 + x) * 4;
      let col = [0, 0, 0, 0];
      if (ch === '9') col = pColors.outline;
      else if (ch === '1') col = pColors.tower_dark;
      else if (ch === '2') col = pColors.tower_base;
      else if (ch === '3') col = pColors.tower_light;
      else if (ch === '4') col = pColors.gold;
      buf[idx] = col[0];
      buf[idx + 1] = col[1];
      buf[idx + 2] = col[2];
      buf[idx + 3] = col[3];
    }
  }
  return buf;
}

function renderKing(map, pColors) {
  const buf = Buffer.alloc(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    const row = map[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      const idx = (y * 16 + x) * 4;
      let col = [0, 0, 0, 0];
      if (ch === '9') col = pColors.outline;
      else if (ch === '1') col = pColors.king_dark;
      else if (ch === '2') col = pColors.king_base;
      else if (ch === '3') col = pColors.king_light;
      else if (ch === '4') col = pColors.gold;
      buf[idx] = col[0];
      buf[idx + 1] = col[1];
      buf[idx + 2] = col[2];
      buf[idx + 3] = col[3];
    }
  }
  return buf;
}

['p1', 'p2'].forEach(prefix => {
  const key = prefix.toUpperCase();
  const colors = PALETTE[key];
  fs.writeFileSync(`public/assets/sprites/pawn_${prefix}_1.png`, createPng(16, 16, renderSprite(PAWN_MAP, colors)));
  fs.writeFileSync(`public/assets/sprites/pawn_${prefix}_2.png`, createPng(16, 16, renderTower(TOWER_MAP, colors)));
  fs.writeFileSync(`public/assets/sprites/pawn_${prefix}_6.png`, createPng(16, 16, renderKing(KING_MAP, colors)));
});

const NEUTRAL = {
  outline: [17, 24, 39, 255],
  pawn_base: [148, 163, 184, 255],
  pawn_dark: [71, 85, 105, 255],
  pawn_light: [226, 232, 240, 255],
  tower_base: [56, 189, 248, 255],
  tower_dark: [3, 105, 161, 255],
  tower_light: [186, 230, 253, 255],
  king_base: [234, 179, 8, 255],
  king_dark: [161, 98, 7, 255],
  king_light: [254, 240, 138, 255],
  gold: [250, 204, 21, 255]
};
fs.writeFileSync('public/assets/sprites/pawn_piece_1.png', createPng(16, 16, renderSprite(PAWN_MAP, NEUTRAL)));
fs.writeFileSync('public/assets/sprites/pawn_piece_2.png', createPng(16, 16, renderTower(TOWER_MAP, NEUTRAL)));
fs.writeFileSync('public/assets/sprites/pawn_piece_6.png', createPng(16, 16, renderKing(KING_MAP, NEUTRAL)));

console.log('Pixel art sprites created successfully!');
