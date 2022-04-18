
import { BigNumber } from '@ethersproject/bignumber';
import { MaxUint256, NegativeOne, One, Zero } from '@ethersproject/constants';
import { concat, arrayify } from '@ethersproject/bytes';

const toBytesNumber = (bitSize, signed) => (value) => {
  const val = BigNumber.from(value);

  // Check bounds are safe for encoding
  const maxUintValue = MaxUint256.mask(bitSize);

  if (signed) {
    const bounds = maxUintValue.mask(bitSize - 1); // 1 bit for signed
    if (val.gt(bounds) || val.lt(bounds.add(One).mul(NegativeOne))) {
      throw new Error('value out-of-bounds, value: ' + value);
    }
  } else if (val.lt(Zero) || val.gt(maxUintValue.mask(bitSize))) {
    throw new Error('value out-of-bounds, value: ' + value);
  }

  const valTwos = val.toTwos(bitSize).mask(bitSize);

  const bytes = arrayify(valTwos);

  if (valTwos.gte(0)) {
    // for positive number, we had to deal with paddings
    if (bitSize > 64) {
      // if zero just return zero
      if (valTwos.eq(0)) {
        return bytes;
      }
      // for u128, u256, u512, we have to and append extra byte for length
      return concat([bytes, Uint8Array.from([bytes.length])])
        .slice()
        .reverse();
    } else {
      // for other types, we have to add padding 0s
      const byteLength = bitSize / 8;
      return concat([
        bytes.slice().reverse(),
        new Uint8Array(byteLength - bytes.length)
      ]);
    }
  } else {
    return bytes.reverse();
  }
};

const toBytesU32 = toBytesNumber(32, false);


export const toHexString = (byteArray) => {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

export const toBytesString = (str) => {
  const arr = Uint8Array.from(Buffer.from(str));
  return concat([toBytesU32(arr.byteLength), arr]);
}
export const sleepTime = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}