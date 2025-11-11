import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('API Health Endpoint', () => {
  it('should return ok status', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.data.status).toBe('ok');
    expect(data.data.counts).toBeDefined();
    expect(data.data.counts.presets).toBe(3);
    expect(typeof data.data.counts.userObjects).toBe('number');
  });
});
