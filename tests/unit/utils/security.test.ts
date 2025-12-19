import { SecurityService } from '../../../src/utils/security';

describe('SecurityService', () => {
  describe('password operations', () => {
    test('should hash and verify passwords correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await SecurityService.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      
      const isValid = await SecurityService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await SecurityService.verifyPassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });
  });
  
  describe('input validation', () => {
    test('should validate email addresses correctly', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com',
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
      ];
      
      validEmails.forEach(email => {
        expect(SecurityService.isValidEmail(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(SecurityService.isValidEmail(email)).toBe(false);
      });
    });
    
    test('should validate usernames correctly', () => {
      const validUsernames = ['user', 'user123', 'test_user', 'User_Name123'];
      const invalidUsernames = ['us', 'user!', 'user name', 'user@domain'];
      
      validUsernames.forEach(username => {
        expect(SecurityService.isValidUsername(username)).toBe(true);
      });
      
      invalidUsernames.forEach(username => {
        expect(SecurityService.isValidUsername(username)).toBe(false);
      });
    });
    
    test('should validate password strength', () => {
      const strongPassword = 'StrongPass123!';
      const weakPasswords = [
        'weak',
        'nouppercase1!',
        'NOLOWERCASE1!',
        'NoNumbers!',
        'NoSpecialChars123',
      ];
      
      const result = SecurityService.validatePassword(strongPassword);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      weakPasswords.forEach(password => {
        const result = SecurityService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('input sanitization', () => {
    test('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = SecurityService.sanitizeInput(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });
  });
  
  describe('file validation', () => {
    test('should validate allowed files', () => {
      const validFile = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'photo.jpg',
      };
      
      const result = SecurityService.validateFileUpload(validFile);
      expect(result.isValid).toBe(true);
    });
    
    test('should reject oversized files', () => {
      const oversizedFile = {
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB
        originalname: 'large.jpg',
      };
      
      const result = SecurityService.validateFileUpload(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });
    
    test('should reject disallowed file types', () => {
      const exeFile = {
        mimetype: 'application/x-executable',
        size: 1024,
        originalname: 'malware.exe',
      };
      
      const result = SecurityService.validateFileUpload(exeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });
    
    test('should reject dangerous filenames', () => {
      const dangerousFile = {
        mimetype: 'text/plain',
        size: 1024,
        originalname: '../../../etc/passwd',
      };
      
      const result = SecurityService.validateFileUpload(dangerousFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid filename');
    });
  });
  
  describe('rate limiting', () => {
    test('should allow requests within limit', () => {
      const limiter = SecurityService.createRateLimiter(5, 60000); // 5 requests per minute
      
      for (let i = 0; i < 5; i++) {
        expect(limiter('user123')).toBe(true);
      }
    });
    
    test('should block requests exceeding limit', () => {
      const limiter = SecurityService.createRateLimiter(2, 60000); // 2 requests per minute
      
      expect(limiter('user456')).toBe(true);
      expect(limiter('user456')).toBe(true);
      expect(limiter('user456')).toBe(false); // Should be rate limited
    });
    
    test('should reset rate limit after window', (done) => {
      const limiter = SecurityService.createRateLimiter(1, 100); // 1 request per 100ms
      
      expect(limiter('user789')).toBe(true);
      expect(limiter('user789')).toBe(false);
      
      setTimeout(() => {
        expect(limiter('user789')).toBe(true);
        done();
      }, 150);
    });
  });
});