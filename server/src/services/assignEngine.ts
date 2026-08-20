export interface CandidateAgent {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  currentZoneId?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  activeOrdersCount: number;
}

export interface OrderAssignmentInput {
  orderId: string;
  pickupZoneId?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
}

export interface AssignmentResult {
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  matchType: 'IN_ZONE' | 'DISTANCE_FALLBACK' | 'NONE';
  distanceKm?: number;
  reason: string;
}

/**
 * Calculates Haversine distance between two sets of (latitude, longitude) coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2));
}

/**
 * Pure Auto-Assignment Engine Function
 * Selects the optimal available agent for an order based on zone matching, Haversine proximity, and load balancing.
 */
export function autoAssignAgent(
  order: OrderAssignmentInput,
  agents: CandidateAgent[],
  maxRadiusKm: number = 50
): AssignmentResult {
  // 1. Filter only AVAILABLE agents
  const availableAgents = agents.filter((agent) => agent.status === 'AVAILABLE');

  if (availableAgents.length === 0) {
    return {
      assignedAgentId: null,
      assignedAgentName: null,
      matchType: 'NONE',
      reason: 'No agents currently online and available',
    };
  }

  // 2. Primary Match: Agents in the pickup zone
  if (order.pickupZoneId) {
    const inZoneAgents = availableAgents.filter(
      (agent) => agent.currentZoneId === order.pickupZoneId
    );

    if (inZoneAgents.length > 0) {
      // Tie-break: Select agent with fewest active orders
      inZoneAgents.sort((a, b) => a.activeOrdersCount - b.activeOrdersCount);
      const selected = inZoneAgents[0];

      return {
        assignedAgentId: selected.id,
        assignedAgentName: selected.name,
        matchType: 'IN_ZONE',
        reason: `Matched agent in pickup zone with ${selected.activeOrdersCount} active orders`,
      };
    }
  }

  // 3. Fallback: Haversine distance match
  if (order.pickupLat != null && order.pickupLng != null) {
    const distanceCandidates = availableAgents
      .filter((agent) => agent.currentLat != null && agent.currentLng != null)
      .map((agent) => {
        const dist = calculateHaversineDistance(
          order.pickupLat!,
          order.pickupLng!,
          agent.currentLat!,
          agent.currentLng!
        );
        return { agent, dist };
      })
      .filter((item) => item.dist <= maxRadiusKm);

    if (distanceCandidates.length > 0) {
      // Sort by distance ASC, then activeOrdersCount ASC
      distanceCandidates.sort((a, b) => {
        if (a.dist !== b.dist) {
          return a.dist - b.dist;
        }
        return a.agent.activeOrdersCount - b.agent.activeOrdersCount;
      });

      const bestMatch = distanceCandidates[0];
      return {
        assignedAgentId: bestMatch.agent.id,
        assignedAgentName: bestMatch.agent.name,
        matchType: 'DISTANCE_FALLBACK',
        distanceKm: bestMatch.dist,
        reason: `Matched nearest out-of-zone agent at ${bestMatch.dist} km distance`,
      };
    }
  }

  return {
    assignedAgentId: null,
    assignedAgentName: null,
    matchType: 'NONE',
    reason: 'No available agents in zone or within max radius',
  };
}
