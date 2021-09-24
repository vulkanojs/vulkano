module.exports = (str, _len, _pad, _dir) => {

  const STR_PAD_LEFT = 1;
  const STR_PAD_RIGHT = 2;
  const STR_PAD_BOTH = 3;

  const len = _len || 0;
  const pad = _pad || ' ';
  const dir = _dir || STR_PAD_RIGHT;

  let newStr = '';

  if (len + 1 >= str.length) {

    const padlen = len - str.length;
    const right = Math.ceil(padlen / 2);
    const left = padlen - right;

    switch (dir) {
      case STR_PAD_LEFT:
        newStr = Array(len + 1 - str.length).join(pad) + str;
        break;
      case 'left':
        newStr = Array(len + 1 - str.length).join(pad) + str;
        break;
      case STR_PAD_BOTH:
        newStr = Array(left + 1).join(pad) + str + Array(right + 1).join(pad);
        break;
      default:
        newStr = str + Array(len + 1 - str.length).join(pad);
        break;
    } // switch

  }

  return newStr;

};
