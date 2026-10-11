import {
  DocumentRecord,
  DocumentAnalysis,
  PracticeSetRecord,
  QuestionItem,
  SolutionExplanation,
  HintResponse,
  SimplifyResponse,
  AttemptRecord,
  AnalyticsOverview,
  DifficultyLevel,
  QuestionType
} from '../types';

const STORAGE_KEYS = {
  DOCUMENTS: 'studypath_local_documents',
  PRACTICE_SETS: 'studypath_local_practice_sets',
  ATTEMPTS: 'studypath_local_attempts',
};

// Seed initial document if storage is empty
function getStoredDocuments(): DocumentRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  if (!raw) {
    const initialDocs: DocumentRecord[] = [
      {
        id: 'doc_sample_algorithms_101',
        ownerId: 'usr_demo_student_42',
        originalName: 'Algorithms_and_Data_Structures_Sample.pdf',
        storagePath: 'samples/Algorithms_and_Data_Structures_Sample.pdf',
        fileType: 'pdf',
        fileSize: 1420500,
        pageCount: 18,
        status: 'ready',
        progress: 100,
        analysisSummary: {
          subject: 'Algorithms & Computation Theory',
          courseOrChapter: 'CS-204: Advanced Algorithmic Thinking',
          mainTopics: [
            'Master Theorem & Recurrences',
            'Divide & Conquer Strategies',
            'Graph Traversal & Search',
            'Dynamic Programming Invariants'
          ],
          subtopics: [
            'Asymptotic Big-O Bounds',
            'Depth-First Search vs Breadth-First Search',
            'Memoization Tables',
            'Greedy Choice Property'
          ],
          questionTypes: ['multiple_choice', 'short_answer', 'coding', 'numerical'],
          approximateDifficulty: 'medium',
          questionCount: 12,
          commonFormulas: [
            'T(n) = a*T(n/b) + O(n^d)',
            'Space Complexity: O(V + E) for Adjacency List'
          ],
          formattingPatterns: ['Formal theorem followed by complexity analysis exercises.'],
          learningObjectives: [
            'Deconstruct recursive algorithms into recurrence equations.',
            'Select optimal graph exploration strategies.',
            'Construct optimal substructure proofs for DP.'
          ],
          summaryText: 'Sample guide covers essential algorithms with mathematical proofs and complexity derivations.'
        },
        warnings: [],
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 27 * 86400000).toISOString(),
      }
    ];
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(initialDocs));
    return initialDocs;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredDocuments(docs: DocumentRecord[]) {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
}

function getStoredPracticeSets(): PracticeSetRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.PRACTICE_SETS);
  if (!raw) {
    const initialSets: PracticeSetRecord[] = [
      {
        id: 'pset_demo_graph_mastery',
        ownerId: 'usr_demo_student_42',
        documentId: 'doc_sample_algorithms_101',
        title: 'Algorithms Core Practice Set (Medium)',
        selectedTopics: ['Master Theorem & Recurrences', 'Graph Traversal & Search', 'Dynamic Programming Invariants'],
        difficulty: 'medium',
        questionTypes: ['multiple_choice', 'short_answer', 'coding'],
        questions: [
          {
            id: 'q_demo_01',
            topic: 'Master Theorem & Recurrences',
            difficulty: 'medium',
            type: 'multiple_choice',
            questionText: 'Given the recurrence relation T(n) = 4T(n/2) + O(n^2), what is the tight asymptotic time complexity bound according to the Master Theorem?',
            options: [
              'A) O(n^2)',
              'B) O(n^2 log n)',
              'C) O(n^3)',
              'D) O(2^n)'
            ],
            expectedAnswerCriteria: 'Correctly identify Master Theorem Case 2 where log_b(a) = log_2(4) = 2 equals d = 2.',
            conceptTested: 'Master Theorem Critical Exponent Equality (Case 2)',
            sampleAnswer: 'B) O(n^2 log n)',
            hint: 'Compute log_b(a) and compare with the exponent of the non-recursive overhead f(n).',
            watermark: 'Practice Material • Not for Submission'
          },
          {
            id: 'q_demo_02',
            topic: 'Graph Traversal & Search',
            difficulty: 'medium',
            type: 'short_answer',
            questionText: 'Under what edge weight condition does Breadth-First Search (BFS) guarantee finding the shortest path between two vertices in a graph? Explain why.',
            expectedAnswerCriteria: 'Must specify unweighted or uniform edge weights, and explain level-by-level queue expansion.',
            conceptTested: 'BFS Shortest-Path Property on Uniform Weight Graphs',
            sampleAnswer: 'BFS guarantees the shortest path when all edges have equal non-negative weight (or weight = 1), because vertices are visited in non-decreasing order of distance from the source.',
            hint: 'Consider how the FIFO queue controls the sequence in which node frontiers are explored.',
            watermark: 'Practice Material • Not for Submission'
          },
          {
            id: 'q_demo_03',
            topic: 'Dynamic Programming Invariants',
            difficulty: 'hard',
            type: 'coding',
            questionText: 'Write a Python function `coin_change_min(coins: list[int], amount: int) -> int` that determines the fewest number of coins needed to make up the given amount. Return -1 if impossible.',
            expectedAnswerCriteria: 'Bottom-up DP table or top-down memoization with O(amount * len(coins)) complexity.',
            conceptTested: 'Unbounded Knapsack / Minimum Coin Change DP',
            sampleAnswer: 'def coin_change_min(coins, amount):\n    dp = [float(\'inf\')] * (amount + 1)\n    dp[0] = 0\n    for c in coins:\n        for a in range(c, amount + 1):\n            dp[a] = min(dp[a], dp[a - c] + 1)\n    return dp[amount] if dp[amount] != float(\'inf\') else -1',
            hint: 'Initialize a DP array of size amount + 1 with infinity, setting dp[0] = 0.',
            watermark: 'Practice Material • Not for Submission'
          }
        ],
        timeLimitMinutes: 30,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'active'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.PRACTICE_SETS, JSON.stringify(initialSets));
    return initialSets;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredPracticeSets(sets: PracticeSetRecord[]) {
  localStorage.setItem(STORAGE_KEYS.PRACTICE_SETS, JSON.stringify(sets));
}

function getStoredAttempts(): AttemptRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  if (!raw) {
    const initialAttempts: AttemptRecord[] = [
      {
        id: 'att_demo_01',
        ownerId: 'usr_demo_student_42',
        practiceSetId: 'pset_demo_graph_mastery',
        questionId: 'q_demo_01',
        response: 'B) O(n^2 log n)',
        feedback: {
          whatYouGotRight: [
            'Selected the correct asymptotic bound: O(n^2 log n).',
            'Recognized that log_2(4) = 2 matches the polynomial overhead exponent.'
          ],
          whatNeedsCorrection: [],
          whatIsMissing: [],
          howToImprove: ['Try proving the recurrence using a recursion tree to visualize why the log n factor appears.'],
          score: 10,
          maxScore: 10,
          evaluationConfidence: 'high',
          coachNotes: 'Perfect derivation of Master Theorem Case 2!'
        },
        score: 10,
        completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'att_demo_02',
        ownerId: 'usr_demo_student_42',
        practiceSetId: 'pset_demo_graph_mastery',
        questionId: 'q_demo_02',
        response: 'BFS works when the graph has no weights. It explores neighbors first.',
        feedback: {
          whatYouGotRight: [
            'Correctly identified unweighted graphs as the primary context.',
            'Noted that BFS explores immediate neighbors first.'
          ],
          whatNeedsCorrection: [
            'More precisely, BFS also works if all edge weights are identical and positive (uniform weights), not just unweighted.'
          ],
          whatIsMissing: [
            'Explanation of how the FIFO queue guarantees that vertices at distance k are processed before vertices at distance k+1.'
          ],
          howToImprove: [
            'Mention the monotonic distance invariant maintained by the exploration queue.'
          ],
          score: 7.5,
          maxScore: 10,
          evaluationConfidence: 'high',
          coachNotes: 'Solid intuitive answer. Adding the queue invariant will make your explanation exam-ready.'
        },
        score: 7.5,
        completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(initialAttempts));
    return initialAttempts;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredAttempts(attempts: AttemptRecord[]) {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

// Derive subject and topics dynamically from filename and content
function analyzeFileName(fileName: string): { subject: string; topics: string[]; formulas: string[] } {
  const lower = fileName.toLowerCase();
  if (lower.includes('quantum') || lower.includes('qubit') || lower.includes('simulation')) {
    return {
      subject: 'Quantum Computing & Simulation Systems',
      topics: [
        'Quantum Circuits & State Simulation',
        'Quantum Noise & Decoherence Models',
        'Superposition & Entanglement Invariants',
        'Gate Fidelity & Measurement Errors',
        'Statevector vs Density Matrix Formalism'
      ],
      formulas: [
        'Statevector Evolution: |ψ(t)⟩ = U(t)|ψ(0)⟩',
        'Pauli-X Gate: X|0⟩ = |1⟩, X|1⟩ = |0⟩',
        'Fidelity Metric: F(ρ, σ) = (Tr√(√ρ σ √ρ))²'
      ]
    };
  } else if (lower.includes('algo') || lower.includes('data_structure') || lower.includes('graph')) {
    return {
      subject: 'Algorithms & Data Structures',
      topics: [
        'Master Theorem & Recurrences',
        'Divide & Conquer Strategies',
        'Graph Traversal & Search',
        'Dynamic Programming Invariants'
      ],
      formulas: [
        'Master Theorem: T(n) = a*T(n/b) + O(n^d)',
        'BFS Time Complexity: O(V + E)'
      ]
    };
  } else if (lower.includes('math') || lower.includes('calc') || lower.includes('linear')) {
    return {
      subject: 'Mathematics & Linear Algebra',
      topics: [
        'Eigenvalues & Eigenvectors',
        'Matrix Decomposition',
        'Optimization & Gradients',
        'Vector Spaces & Orthogonality'
      ],
      formulas: [
        'Characteristic Equation: det(A - λI) = 0',
        'SVD: A = U Σ V*'
      ]
    };
  } else {
    // Clean name from filename
    const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    return {
      subject: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      topics: [
        'Foundational Principles & Architecture',
        'Core Mechanisms & Invariants',
        'Practical Problem Formulation',
        'Analytical Evaluation & Constraints'
      ],
      formulas: [
        'System Metric: η = Output / Input',
        'Constraint Verification: f(x) ≤ C'
      ]
    };
  }
}

export const localEngine = {
  // Document Operations
  uploadDocument: async (file: File, acknowledgedIntegrity: boolean): Promise<DocumentRecord> => {
    const docs = getStoredDocuments();
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const analysisInfo = analyzeFileName(file.name);

    const newDoc: DocumentRecord = {
      id: docId,
      ownerId: 'usr_demo_student_42',
      originalName: file.name,
      storagePath: `uploads/demo/${docId}_${file.name}`,
      fileType: ext,
      fileSize: file.size,
      pageCount: ext === 'pptx' ? 14 : ext === 'pdf' ? 12 : 6,
      status: 'parsing',
      progress: 35,
      warnings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    docs.unshift(newDoc);
    saveStoredDocuments(docs);

    // Simulate async pipeline background progress
    setTimeout(() => {
      const currentDocs = getStoredDocuments();
      const target = currentDocs.find(d => d.id === docId);
      if (target) {
        target.status = 'analyzing';
        target.progress = 75;
        saveStoredDocuments(currentDocs);
      }
    }, 1200);

    setTimeout(() => {
      const currentDocs = getStoredDocuments();
      const target = currentDocs.find(d => d.id === docId);
      if (target) {
        target.status = 'ready';
        target.progress = 100;
        target.analysisSummary = {
          subject: analysisInfo.subject,
          courseOrChapter: 'Unit 1: Core Systems & Formulation',
          mainTopics: analysisInfo.topics,
          subtopics: analysisInfo.topics.map(t => `${t} (Advanced Analysis)`),
          questionTypes: ['multiple_choice', 'short_answer', 'coding', 'numerical'],
          approximateDifficulty: 'medium',
          questionCount: 10,
          commonFormulas: analysisInfo.formulas,
          formattingPatterns: ['Conceptual derivation and architecture exercises.'],
          learningObjectives: [
            'Understand foundational principles and modeling constraints.',
            'Apply analytical formulations to problem instances.',
            'Evaluate edge cases and verify governing invariants.'
          ],
          summaryText: `Analyzed ${file.name}. Identified ${analysisInfo.topics.length} core subject topics and operational formulas.`
        };
        saveStoredDocuments(currentDocs);
      }
    }, 2800);

    return newDoc;
  },

  getDocuments: async (): Promise<DocumentRecord[]> => {
    return getStoredDocuments();
  },

  getDocument: async (id: string): Promise<DocumentRecord> => {
    const doc = getStoredDocuments().find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  deleteDocument: async (id: string): Promise<void> => {
    const docs = getStoredDocuments().filter(d => d.id !== id);
    saveStoredDocuments(docs);
  },

  retryDocument: async (id: string): Promise<DocumentRecord> => {
    const docs = getStoredDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.status = 'ready';
    doc.progress = 100;
    saveStoredDocuments(docs);
    return doc;
  },

  // Practice Operations
  generatePracticeSet: async (params: {
    documentId: string;
    selectedTopics: string[];
    difficulty: DifficultyLevel;
    questionCount: number;
    questionTypes: QuestionType[];
    timeLimitMinutes?: number;
  }): Promise<PracticeSetRecord> => {
    const doc = getStoredDocuments().find(d => d.id === params.documentId);
    const topics = params.selectedTopics.length > 0 ? params.selectedTopics : ['Core Fundamentals'];
    const psetId = `pset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const questions: QuestionItem[] = [];
    for (let i = 0; i < params.questionCount; i++) {
      const topic = topics[i % topics.length];
      const qId = `q_${Date.now()}_${i}`;

      if (topic.toLowerCase().includes('quantum') || (doc && doc.originalName.toLowerCase().includes('quantum'))) {
        const qBank = [
          {
            type: 'multiple_choice' as QuestionType,
            text: 'When modeling decoherence in a superconducting qubit simulator, which noise channel best accounts for energy relaxation toward the ground state |0⟩?',
            options: [
              'A) Bit-flip channel',
              'B) Phase-flip channel',
              'C) Amplitude damping channel',
              'D) Depolarizing channel'
            ],
            answer: 'C) Amplitude damping channel',
            concept: 'Amplitude Damping and T1 Energy Relaxation',
            hint: 'Recall that T1 characterizes the decay of state population |1⟩ into |0⟩ with a loss of energy.'
          },
          {
            type: 'short_answer' as QuestionType,
            text: 'Explain the fundamental tradeoff between Statevector simulation and Density Matrix simulation when scaling quantum system modeling up to 30 qubits.',
            options: undefined,
            answer: 'Statevector requires 2^n complex amplitudes and cannot natively model mixed states without ensemble sampling. Density Matrix stores 2^n x 2^n elements, enabling open quantum system noise simulation but squaring memory consumption.',
            concept: 'Statevector vs Density Matrix Memory Bounds (2^n vs 4^n)',
            hint: 'Compare the memory dimensionality needed for pure states versus open-system mixed states.'
          },
          {
            type: 'coding' as QuestionType,
            text: 'Write a Python function `apply_pauli_x(state_vector: list[complex], target_qubit: int) -> list[complex]` that flips the computational basis amplitude for the target qubit.',
            options: undefined,
            answer: 'def apply_pauli_x(state_vector, target_qubit):\n    n = int(math.log2(len(state_vector)))\n    new_state = list(state_vector)\n    for i in range(len(state_vector)):\n        if (i & (1 << target_qubit)) == 0:\n            flipped = i ^ (1 << target_qubit)\n            new_state[i], new_state[flipped] = new_state[flipped], new_state[i]\n    return new_state',
            concept: 'Quantum Gate Matrix-Vector Basis Transformation',
            hint: 'The bit at target_qubit index dictates whether amplitude index i swaps with i ^ (1 << target_qubit).'
          },
          {
            type: 'numerical' as QuestionType,
            text: 'A 2-qubit system undergoes gate operation with individual gate error ε = 0.005 per gate. If an algorithmic circuit contains 40 two-qubit CNOT gates, calculate the approximate total circuit fidelity using the independent error model.',
            options: undefined,
            answer: 'Fidelity F ≈ (1 - ε)^40 = (1 - 0.005)^40 ≈ 0.995^40 ≈ 0.818 (81.8% circuit fidelity).',
            concept: 'Circuit Gate Error Accumulation and Fidelity Bounds',
            hint: 'Use the exponential product rule F = (1 - ε)^N for independent stochastic gate faults.'
          }
        ];
        const template = qBank[i % qBank.length];
        questions.push({
          id: qId,
          topic,
          difficulty: params.difficulty,
          type: template.type,
          questionText: template.text,
          options: template.options,
          expectedAnswerCriteria: 'Clear technical rationale addressing governing invariants.',
          conceptTested: template.concept,
          sampleAnswer: template.answer,
          hint: template.hint,
          watermark: 'Practice Material • Not for Submission'
        });
      } else {
        // General Computer Science & Engineering Questions
        questions.push({
          id: qId,
          topic,
          difficulty: params.difficulty,
          type: 'multiple_choice',
          questionText: `Consider an educational system evaluating ${topic}. Which principle ensures that boundary conditions are preserved under recursive scaling?`,
          options: [
            'A) Base case invariant termination',
            'B) Unbounded queue accumulation',
            'C) Premature state truncation',
            'D) Non-deterministic branch pruning'
          ],
          expectedAnswerCriteria: 'Identifies base case termination as governing principle.',
          conceptTested: `${topic} Invariant Verification`,
          sampleAnswer: 'A) Base case invariant termination',
          hint: 'Think about what condition prevents infinite recursion or execution loops.',
          watermark: 'Practice Material • Not for Submission'
        });
      }
    }

    const newSet: PracticeSetRecord = {
      id: psetId,
      ownerId: 'usr_demo_student_42',
      documentId: params.documentId,
      title: `${topics.slice(0, 2).join(' & ')} Practice (${params.difficulty.toUpperCase()})`,
      selectedTopics: topics,
      difficulty: params.difficulty,
      questionTypes: params.questionTypes,
      questions,
      timeLimitMinutes: params.timeLimitMinutes,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const sets = getStoredPracticeSets();
    sets.unshift(newSet);
    saveStoredPracticeSets(sets);
    return newSet;
  },

  getPracticeSets: async (): Promise<PracticeSetRecord[]> => {
    return getStoredPracticeSets();
  },

  getPracticeSet: async (id: string): Promise<PracticeSetRecord> => {
    const s = getStoredPracticeSets().find(set => set.id === id);
    if (!s) throw new Error('Practice set not found');
    return s;
  },

  regenerateQuestion: async (practiceSetId: string, questionId: string): Promise<QuestionItem> => {
    const sets = getStoredPracticeSets();
    const set = sets.find(s => s.id === practiceSetId);
    if (!set) throw new Error('Practice set not found');
    const qIdx = set.questions.findIndex(q => q.id === questionId);
    if (qIdx === -1) throw new Error('Question not found');

    const oldQ = set.questions[qIdx];
    const newQ: QuestionItem = {
      ...oldQ,
      id: `q_${Date.now()}_regen`,
      questionText: `[Alternative Scenario] For ${oldQ.topic}: Under modified constraints where resource budget is halved, derive the primary trade-off and state the optimal solution strategy.`,
      sampleAnswer: 'Adopt localized greedy heuristics or memoized cache pruning to stay within the reduced budget.',
      hint: 'Evaluate how halving the resources shifts the bottleneck from compute time to memory allocation.'
    };
    set.questions[qIdx] = newQ;
    saveStoredPracticeSets(sets);
    return newQ;
  },

  // Solution and Hints
  getSolution: async (questionId: string, questionData?: QuestionItem): Promise<SolutionExplanation> => {
    return {
      questionId,
      whatQuestionIsAsking: questionData ? questionData.questionText : 'Deconstruct the problem requirements and evaluate the optimal mathematical or algorithmic outcome.',
      relevantConcept: questionData?.conceptTested || 'Governing Architectural & Theoretical Principles',
      formulaOrPrinciple: 'Invariance Formulation: Apply formal parameter substitutions and verify step transitions.',
      steps: [
        {
          stepNumber: 1,
          title: 'Extract Governing Parameters',
          explanation: 'Isolate the core variables, error thresholds, and dimensional bounds stated in the problem.',
          whyNecessary: 'Ensures no boundary constraints are omitted prior to algebraic derivation.'
        },
        {
          stepNumber: 2,
          title: 'Apply Governing Theorems',
          explanation: 'Map problem parameters to established principles and calculate intermediate values.',
          whyNecessary: 'Translates general theorems into concrete, verifiable equations.'
        },
        {
          stepNumber: 3,
          title: 'Verify Against Boundary Conditions',
          explanation: 'Check whether the derived solution holds true for minimal or asymptotic inputs.',
          whyNecessary: 'Guarantees analytical accuracy and avoids edge-case failures.'
        }
      ],
      finalAnswer: questionData?.sampleAnswer || 'Derived through rigorous step-by-step evaluation.',
      commonMistakes: [
        'Overlooking unit conversions and dimensional scaling factors.',
        'Confusing worst-case behavior with average expectations.',
        'Neglecting noise or boundary constraints in large systems.'
      ],
      tipOrQuickMethod: 'Intuition Check: Test with n = 1 or an unweighted test instance to immediately verify formula consistency.'
    };
  },

  getHint: async (questionId: string, questionData?: QuestionItem): Promise<HintResponse> => {
    return {
      questionId,
      hintText: questionData?.hint || 'Consider how the variables relate when evaluated at the smallest non-trivial scale.',
      guidingQuestion: 'What governing invariant remains constant throughout every transition in this system?'
    };
  },

  getSimplifiedExplanation: async (questionId: string, questionData?: QuestionItem): Promise<SimplifyResponse> => {
    return {
      questionId,
      simplifiedExplanation: `In simple terms: Imagine you have a complex system where small disturbances can accumulate over time. This question tests how well you can predict and minimize those disturbances for ${questionData?.topic || 'this topic'}.`,
      realWorldAnalogy: 'Like tuning a radio in a noisy environment: if you know the exact frequency of interference, you can filter it out rather than turning up the volume indiscriminately.'
    };
  },

  // Attempt Submissions
  submitAttempt: async (params: {
    practiceSetId: string;
    questionId: string;
    response: string;
  }): Promise<AttemptRecord> => {
    const sets = getStoredPracticeSets();
    const set = sets.find(s => s.id === params.practiceSetId);
    const q = set?.questions.find(question => question.id === params.questionId);

    const isMcq = q?.type === 'multiple_choice';
    let isCorrect = false;
    if (isMcq && q?.sampleAnswer) {
      const expectedLetter = q.sampleAnswer.charAt(0).toUpperCase();
      const studentLetter = params.response.charAt(0).toUpperCase();
      isCorrect = (expectedLetter === studentLetter) || params.response.toLowerCase().includes(q.sampleAnswer.toLowerCase());
    } else {
      isCorrect = params.response.trim().length > 15;
    }

    const score = isCorrect ? 10 : (params.response.trim().length > 20 ? 7 : 0);

    const attempt: AttemptRecord = {
      id: `att_${Date.now()}`,
      ownerId: 'usr_demo_student_42',
      practiceSetId: params.practiceSetId,
      questionId: params.questionId,
      response: params.response,
      feedback: {
        whatYouGotRight: isCorrect
          ? ['Correctly identified the governing answer and verified target constraints.', `Demonstrated clear mastery of ${q?.conceptTested || 'the concept'}.`]
          : ['Demonstrated thoughtful effort and addressed the core question prompt.'],
        whatNeedsCorrection: isCorrect
          ? []
          : [`The selected response or derivation does not satisfy the governing conditions of ${q?.conceptTested || 'the topic'}.`],
        whatIsMissing: isCorrect
          ? []
          : ['Explicit justification of intermediate transitions and edge constraints.'],
        howToImprove: [
          'Review the step-by-step explainer to solidify how the governing formula is applied.'
        ],
        score,
        maxScore: 10,
        evaluationConfidence: 'high',
        coachNotes: isCorrect
          ? 'Superb work! Accurate reasoning and precise concept application.'
          : 'Good effort! Review the coaching hints and step breakdown to refine your approach.'
      },
      score,
      completedAt: new Date().toISOString()
    };

    const attempts = getStoredAttempts();
    attempts.unshift(attempt);
    saveStoredAttempts(attempts);
    return attempt;
  },

  getAttempts: async (): Promise<AttemptRecord[]> => {
    return getStoredAttempts();
  },

  // Analytics Computation
  getAnalytics: async (): Promise<AnalyticsOverview> => {
    const docs = getStoredDocuments();
    const attempts = getStoredAttempts();
    const sets = getStoredPracticeSets();

    const totalQuestions = attempts.length;
    const correctCount = attempts.filter(a => (a.score || 0) >= 7).length;
    const overallAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Topic performance mapping
    const topicMap: Record<string, { attempted: number; correct: number }> = {};
    const questionTopicMap: Record<string, string> = {};
    sets.forEach(s => {
      s.questions.forEach(q => {
        questionTopicMap[q.id] = q.topic;
      });
    });

    attempts.forEach(a => {
      const top = questionTopicMap[a.questionId] || 'Foundational Principles';
      if (!topicMap[top]) topicMap[top] = { attempted: 0, correct: 0 };
      topicMap[top].attempted += 1;
      if ((a.score || 0) >= 7) topicMap[top].correct += 1;
    });

    const topicPerformance = Object.keys(topicMap).map(topic => {
      const data = topicMap[topic];
      return {
        topic,
        attemptedCount: data.attempted,
        correctCount: data.correct,
        accuracy: Math.round((data.correct / data.attempted) * 100),
      };
    });

    const strongTopics = topicPerformance.filter(t => t.accuracy >= 75).map(t => t.topic);
    const weakTopics = topicPerformance.filter(t => t.accuracy < 65).map(t => t.topic);

    // Accuracy over time points
    const accuracyOverTime = [
      { date: 'Oct 8', accuracy: 65, attemptsCount: 3 },
      { date: 'Oct 9', accuracy: 72, attemptsCount: 5 },
      { date: 'Oct 10', accuracy: 80, attemptsCount: 6 },
      { date: 'Oct 11', accuracy: overallAccuracy || 85, attemptsCount: Math.max(1, totalQuestions) }
    ];

    return {
      totalDocuments: docs.length,
      totalQuestionsPracticed: totalQuestions,
      overallAccuracy,
      learningStreakDays: Math.min(5, Math.max(1, Math.ceil(totalQuestions / 2))),
      accuracyOverTime,
      topicPerformance,
      strongTopics: strongTopics.length > 0 ? strongTopics : ['Master Theorem & Recurrences'],
      weakTopics: weakTopics.length > 0 ? weakTopics : ['Graph Traversal & Search'],
      difficultyBreakdown: { easy: 4, medium: 8, hard: 3 },
      recommendations: [
        {
          id: 'rec_1',
          topic: weakTopics[0] || 'Graph Traversal & Search',
          reason: 'Accuracy in this area has room for growth. Reinforcing queue invariants will solidify mastery.',
          suggestedAction: 'Take a short 5-question practice set with step-by-step solutions enabled.',
          difficulty: 'medium',
          priority: 'high'
        },
        {
          id: 'rec_2',
          topic: strongTopics[0] || 'Master Theorem & Recurrences',
          reason: 'Strong track record! Ready to challenge yourself with advanced edge cases.',
          suggestedAction: 'Try a Hard difficulty practice set.',
          difficulty: 'hard',
          priority: 'medium'
        }
      ]
    };
  },

  cleanupExpiredFiles: async () => {
    return { deletedCount: 0, message: 'All files are within the 30-day retention window.' };
  },

  deleteAllUserData: async () => {
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.PRACTICE_SETS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    return { message: 'All local study data successfully purged.' };
  }
};
