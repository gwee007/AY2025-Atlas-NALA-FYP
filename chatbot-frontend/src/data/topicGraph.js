// Topic graph derived from the provided flowchart. Nodes represent topics or subtopics.
// Edges capture three relationship types:
//   - "sequence": solid arrow ( --> ) meaning direct progression.
//   - "optional": dashed circle arrow ( -.-o ) meaning suggested exploration or parent-child grouping.
//   - "prerequisite": dependency arrows ( ==> ) meaning prerequisite knowledge.

export const topicNodes = [
  { id: 'id1', label: 'Introduction to Process Control' },
  { id: 'id1-1', label: 'Representative Process Control Problems' },
  { id: 'id1-2', label: 'Illustrative Example - A Blending Process' },
  { id: 'id1-3', label: 'Classification of Process Control Strategies' },
  { id: 'id1-4', label: 'A More Complicated Example - A Distillation Column' },
  { id: 'id1-5', label: 'The Hierarchy of Process Control Activities' },
  { id: 'id1-6', label: 'An Overview of Control System Design' },

  { id: 'id2', label: 'Theoretical Models of Chemical Processes' },
  { id: 'id2-1', label: 'The Rationale for Dynamic Process Models' },
  { id: 'id2-2', label: 'General Modeling Principles' },
  { id: 'id2-3', label: 'Degrees of Freedom Analysis' },
  { id: 'id2-4', label: 'Dynamic Models of Representative Processes' },
  { id: 'id2-5', label: 'Process Dynamics and Mathematical Models' },

  { id: 'id3', label: 'Laplace Transforms' },
  { id: 'id3-1', label: 'Laplace Transforms of Representative Functions' },
  { id: 'id3-2', label: 'Solution of Differential Equations by Laplace Transform Techniques' },
  { id: 'id3-3', label: 'Partial Fraction Expansion' },
  { id: 'id3-4', label: 'Other Laplace Transform Properties' },
  { id: 'id3-5', label: 'A Transient Response Example' },
  { id: 'id3-6', label: 'Software for Solving Symbolic Mathematical Problems' },

  { id: 'id4', label: 'Transfer Function Models' },
  { id: 'id4-1', label: 'Introduction to Transfer Function Models' },
  { id: 'id4-2', label: 'Properties of Transfer Functions' },
  { id: 'id4-3', label: 'Linearization of Nonlinear Models' },

  { id: 'id5', label: 'Dynamic Behavior of First-Order and Second-Order Processes' },
  { id: 'id5-1', label: 'Standard Process Inputs' },
  { id: 'id5-2', label: 'Response of First-Order Processes' },
  { id: 'id5-3', label: 'Response of Integrating Processes' },
  { id: 'id5-4', label: 'Response of Second-Order Processes' },

  { id: 'id6', label: 'Dynamic Response Characteristics of More Complicated Processes' },
  { id: 'id6-1', label: 'Poles and Zeros and Their Effect on Process Response' },
  { id: 'id6-2', label: 'Processes with Time Delays' },
  { id: 'id6-3', label: 'Approximation of Higher-Order Transfer Functions' },
  { id: 'id6-4', label: 'Interacting and Noninteracting Processes' },
  { id: 'id6-5', label: 'State-Space and Transfer Function Matrix Models' },
  { id: 'id6-6', label: 'Multiple-Input, Multiple-Output Processes' },

  { id: 'id7', label: 'Feedback Controllers' },
  { id: 'id7-2', label: 'Basic Control Modes' },
  { id: 'id7-3', label: 'Features of PID Controllers' },
  { id: 'id7-4', label: 'Digital Versions of PID Controllers' },
  { id: 'id7-5', label: 'Typical Responses of Feedback Control Systems' },
  { id: 'id7-6', label: 'On–Off Controllers' },

  { id: 'id8', label: 'Dynamic Behavior and Stability of Closed-Loop Control Systems' },
  { id: 'id8-1', label: 'Block Diagram Representation' },
  { id: 'id8-2', label: 'Closed-Loop Transfer Functions' },
  { id: 'id8-3', label: 'Closed-Loop Responses of Simple Control Systems' },
  { id: 'id8-4', label: 'Stability of Closed-Loop Control Systems' },
  { id: 'id8-5', label: 'Root Locus Diagrams' },

  { id: 'id9', label: 'PID Controller Design, Tuning, and Troubleshooting' },
  { id: 'id9-1', label: 'Performance Criteria for Closed-Loop Systems' },
  { id: 'id9-2', label: 'Model-Based Design Methods' },
  { id: 'id9-3', label: 'Controller Tuning Relations' },
  { id: 'id9-4', label: 'Controllers with Two Degrees of Freedom' },
  { id: 'id9-5', label: 'On-Line Controller Tuning' },
  { id: 'id9-6', label: 'Guidelines for Common Control Loops' },
  { id: 'id9-7', label: 'Troubleshooting Control Loops' }
];

export const topicEdges = [
  // id1 branch
  { from: 'id1', to: 'id1-1', type: 'optional' },
  { from: 'id1-1', to: 'id1-2', type: 'sequence' },
  { from: 'id1-2', to: 'id1-3', type: 'sequence' },
  { from: 'id1-3', to: 'id1-4', type: 'sequence' },
  { from: 'id1-4', to: 'id1-5', type: 'sequence' },
  { from: 'id1-5', to: 'id1-6', type: 'sequence' },

  // id2 branch
  { from: 'id2', to: 'id2-1', type: 'optional' },
  { from: 'id2-1', to: 'id2-2', type: 'sequence' },
  { from: 'id2-2', to: 'id2-3', type: 'sequence' },
  { from: 'id2-3', to: 'id2-4', type: 'sequence' },
  { from: 'id2-4', to: 'id2-5', type: 'sequence' },

  // id3 branch
  { from: 'id3', to: 'id3-1', type: 'optional' },
  { from: 'id3-1', to: 'id3-2', type: 'sequence' },
  { from: 'id3-2', to: 'id3-3', type: 'sequence' },
  { from: 'id3-3', to: 'id3-4', type: 'sequence' },
  { from: 'id3-4', to: 'id3-5', type: 'sequence' },
  { from: 'id3-5', to: 'id3-6', type: 'sequence' },

  // id4 branch
  { from: 'id4', to: 'id4-1', type: 'optional' },
  { from: 'id4-1', to: 'id4-2', type: 'sequence' },
  { from: 'id4-2', to: 'id4-3', type: 'sequence' },

  // id5 branch
  { from: 'id5', to: 'id5-1', type: 'optional' },
  { from: 'id5-1', to: 'id5-2', type: 'sequence' },
  { from: 'id5-2', to: 'id5-3', type: 'sequence' },
  { from: 'id5-3', to: 'id5-4', type: 'sequence' },

  // id6 branch
  { from: 'id6', to: 'id6-1', type: 'optional' },
  { from: 'id6-1', to: 'id6-2', type: 'sequence' },
  { from: 'id6-2', to: 'id6-3', type: 'sequence' },
  { from: 'id6-3', to: 'id6-4', type: 'sequence' },
  { from: 'id6-4', to: 'id6-5', type: 'sequence' },
  { from: 'id6-5', to: 'id6-6', type: 'sequence' },

  // id7 branch
  { from: 'id7', to: 'id7-2', type: 'optional' },
  { from: 'id7-2', to: 'id7-3', type: 'sequence' },
  { from: 'id7-3', to: 'id7-4', type: 'sequence' },
  { from: 'id7-4', to: 'id7-5', type: 'sequence' },
  { from: 'id7-5', to: 'id7-6', type: 'sequence' },

  // id8 branch
  { from: 'id8', to: 'id8-1', type: 'optional' },
  { from: 'id8-1', to: 'id8-2', type: 'sequence' },
  { from: 'id8-2', to: 'id8-3', type: 'sequence' },
  { from: 'id8-3', to: 'id8-4', type: 'sequence' },
  { from: 'id8-4', to: 'id8-5', type: 'sequence' },

  // id9 branch
  { from: 'id9', to: 'id9-1', type: 'optional' },
  { from: 'id9-1', to: 'id9-2', type: 'sequence' },
  { from: 'id9-2', to: 'id9-3', type: 'sequence' },
  { from: 'id9-3', to: 'id9-4', type: 'sequence' },
  { from: 'id9-4', to: 'id9-5', type: 'sequence' },
  { from: 'id9-5', to: 'id9-6', type: 'sequence' },
  { from: 'id9-6', to: 'id9-7', type: 'sequence' },

  // Prerequisite (==>) edges
  { from: 'id1', to: 'id8', type: 'prerequisite' },
  { from: 'id5', to: 'id8', type: 'prerequisite' },
  { from: 'id6', to: 'id8', type: 'prerequisite' },
  { from: 'id7', to: 'id8', type: 'prerequisite' },
  { from: 'id4', to: 'id6', type: 'prerequisite' },
  { from: 'id5', to: 'id6', type: 'prerequisite' },
  { from: 'id4', to: 'id5', type: 'prerequisite' },
  { from: 'id2', to: 'id4', type: 'prerequisite' },
  { from: 'id3', to: 'id4', type: 'prerequisite' },
  { from: 'id7', to: 'id9', type: 'prerequisite' }
];

// Build adjacency list keyed by node id for quick traversal.
export const adjacencyList = topicNodes.reduce((acc, node) => {
  acc[node.id] = [];
  return acc;
}, {});

topicEdges.forEach((edge) => {
  if (adjacencyList[edge.from]) {
    adjacencyList[edge.from].push({ to: edge.to, type: edge.type });
  }
});

// Reverse adjacency is often useful for prerequisite lookups.
export const reverseAdjacencyList = topicNodes.reduce((acc, node) => {
  acc[node.id] = [];
  return acc;
}, {});

topicEdges.forEach((edge) => {
  if (reverseAdjacencyList[edge.to]) {
    reverseAdjacencyList[edge.to].push({ from: edge.from, type: edge.type });
  }
});

// Utility: build an adjacency matrix (0/1) for a subset of edge types should you need it.
export function buildAdjacencyMatrix(edgeTypes = ['sequence', 'optional', 'prerequisite']) {
  const indexById = topicNodes.reduce((acc, node, index) => {
    acc[node.id] = index;
    return acc;
  }, {});

  const size = topicNodes.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  topicEdges.forEach((edge) => {
    if (edgeTypes.includes(edge.type)) {
      const row = indexById[edge.from];
      const col = indexById[edge.to];
      if (row !== undefined && col !== undefined) {
        matrix[row][col] = 1;
      }
    }
  });

  return { matrix, indexById };
}

// Helper: get direct successors respecting a filter on edge type.
export function getNextTopics(topicId, allowedTypes = ['sequence', 'optional', 'prerequisite']) {
  return (adjacencyList[topicId] || []).filter((edge) => allowedTypes.includes(edge.type));
}

// Helper: get prerequisites for a given topic.
export function getPrerequisites(topicId) {
  return (reverseAdjacencyList[topicId] || []).filter((edge) => edge.type === 'prerequisite');
}
