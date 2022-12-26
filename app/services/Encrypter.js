const crypto = require('crypto');

class Encrypter {

  constructor(encryptionKey) {
    this.algorithm = 'aes-256-cbc';
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  encrypt(clearText) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = cipher.update(clearText, 'utf8', 'hex');
    return [
      encrypted + cipher.final('hex'),
      Buffer.from(iv).toString('hex'),
    ].join('|');
  }

  dencrypt(encryptedText) {
    const [encrypted, iv] = encryptedText.split('|');
    if (!iv) throw new Error('IV not found');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }
}

module.exports = Encrypter;
