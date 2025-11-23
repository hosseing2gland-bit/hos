import crypto from 'crypto';
import config from '../config/config.js';
import logger from './logger.js';

class EncryptionService {
  constructor() {
    this.algorithm = config.encryption.algorithm;
    this.key = Buffer.from(config.encryption.key, 'utf-8');
    
    if (this.key.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes for AES-256');
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Plain text to encrypt
   * @returns {string} - Encrypted data in format: iv:encryptedData:authTag
   */
  encrypt(text) {
    try {
      if (!text) return '';

      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Return format: iv:encryptedData:authTag (all in hex)
      return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Encrypted data in format: iv:encryptedData:authTag
   * @returns {string} - Decrypted plain text
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData) return '';

      // Split the encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, encrypted, authTagHex] = parts;
      
      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data in hex format
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} - Random token in hex format
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt object (converts to JSON first)
   * @param {Object} obj - Object to encrypt
   * @returns {string} - Encrypted JSON string
   */
  encryptObject(obj) {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt object (parses JSON after decryption)
   * @param {string} encryptedData - Encrypted JSON string
   * @returns {Object} - Decrypted object
   */
  decryptObject(encryptedData) {
    const jsonString = this.decrypt(encryptedData);
    return JSON.parse(jsonString);
  }

  /**
   * Encrypt file content
   * @param {Buffer} buffer - File buffer
   * @returns {Object} - { iv, encryptedData, authTag }
   */
  encryptFile(buffer) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final(),
      ]);
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      logger.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file content
   * @param {Object} params - { iv, encryptedData, authTag }
   * @returns {Buffer} - Decrypted file buffer
   */
  decryptFile({ iv, encryptedData, authTag }) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'hex')),
        decipher.final(),
      ]);
      
      return decrypted;
    } catch (error) {
      logger.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }
}

export default new EncryptionService();
