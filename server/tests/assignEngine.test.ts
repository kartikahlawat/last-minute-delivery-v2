import {
  autoAssignAgent,
  calculateHaversineDistance,
  CandidateAgent,
  OrderAssignmentInput,
} from '../src/services/assignEngine';

describe('Auto-Assignment Engine', () => {
  describe('calculateHaversineDistance', () => {
    it('should calculate distance between Bangalore Central and Whitefield correctly (~15-20 km)', () => {
      // Bangalore Central (12.9716, 77.5946), Whitefield (12.9698, 77.7499)
      const dist = calculateHaversineDistance(12.9716, 77.5946, 12.9698, 77.7499);
      expect(dist).toBeGreaterThan(15);
      expect(dist).toBeLessThan(20);
    });

    it('should return 0 for identical coordinates', () => {
      const dist = calculateHaversineDistance(12.9716, 77.5946, 12.9716, 77.5946);
      expect(dist).toBe(0);
    });
  });

  describe('autoAssignAgent', () => {
    const mockAgents: CandidateAgent[] = [
      {
        id: 'agent-1',
        name: 'Rahul Agent',
        status: 'AVAILABLE',
        currentZoneId: 'zone-bangalore-south',
        currentLat: 12.9716,
        currentLng: 77.5946,
        activeOrdersCount: 2,
      },
      {
        id: 'agent-2',
        name: 'Priya Agent',
        status: 'AVAILABLE',
        currentZoneId: 'zone-bangalore-south',
        currentLat: 12.9750,
        currentLng: 77.5990,
        activeOrdersCount: 0, // Fewer active orders!
      },
      {
        id: 'agent-3',
        name: 'Vikram Agent',
        status: 'BUSY',
        currentZoneId: 'zone-bangalore-south',
        currentLat: 12.9716,
        currentLng: 77.5946,
        activeOrdersCount: 1,
      },
      {
        id: 'agent-4',
        name: 'Amit Agent (Out of Zone)',
        status: 'AVAILABLE',
        currentZoneId: 'zone-bangalore-north',
        currentLat: 12.9800,
        currentLng: 77.6000,
        activeOrdersCount: 0,
      },
    ];

    it('should prefer AVAILABLE agent in the same pickup zone with lowest active orders', () => {
      const order: OrderAssignmentInput = {
        orderId: 'order-101',
        pickupZoneId: 'zone-bangalore-south',
      };

      const result = autoAssignAgent(order, mockAgents);

      expect(result.assignedAgentId).toBe('agent-2'); // Priya has 0 active orders vs Rahul's 2
      expect(result.matchType).toBe('IN_ZONE');
    });

    it('should fallback to nearest available agent via Haversine distance when no in-zone agent is available', () => {
      const order: OrderAssignmentInput = {
        orderId: 'order-102',
        pickupZoneId: 'zone-bangalore-east', // No agent in East zone
        pickupLat: 12.9810,
        pickupLng: 77.6010,
      };

      const result = autoAssignAgent(order, mockAgents, 50);

      expect(result.matchType).toBe('DISTANCE_FALLBACK');
      expect(result.assignedAgentId).toBeDefined();
      expect(result.distanceKm).toBeGreaterThan(0);
    });

    it('should return NONE when all agents are BUSY or OFFLINE', () => {
      const busyAgents: CandidateAgent[] = [
        { id: 'a1', name: 'Busy 1', status: 'BUSY', activeOrdersCount: 1 },
        { id: 'a2', name: 'Offline 1', status: 'OFFLINE', activeOrdersCount: 0 },
      ];

      const order: OrderAssignmentInput = {
        orderId: 'order-103',
        pickupZoneId: 'zone-bangalore-south',
      };

      const result = autoAssignAgent(order, busyAgents);

      expect(result.assignedAgentId).toBeNull();
      expect(result.matchType).toBe('NONE');
    });
  });
});
