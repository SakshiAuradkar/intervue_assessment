import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Define the shape of the poll
interface Poll {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
  startTime: number;
  ended: boolean;
  correctAnswer?: string;
  finalVotes?: Record<string, string>;

}

interface PollWithResults extends Poll {
  finalVotes: Record<string, string>;
}

// Define the shape of a student
interface Student {
  id: string;
  name: string;
}

// Define the shape of a chat message
interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
  isTeacher: boolean;
}

// Define the state and actions for the store
interface PollState {
  socket: Socket | null;
  isConnected: boolean;
  currentPoll: Poll | null;
  students: Student[];
  votes: Record<string, string>;
  studentName: string | null;
  timeRemaining: number;
  chatMessages: ChatMessage[];
  pollHistory: PollWithResults[];
  isKicked: boolean;
  initializeSocket: () => void;
  joinSession: (name: string) => void;
  createPoll: (pollData: { question: string; options: string[]; timeLimit: number; correctAnswer: string }) => void;
  endPoll: () => void;
  submitVote: (option: string) => void;
  sendMessage: (message: string, isTeacher: boolean) => void;
  kickStudent: (studentId: string) => void;
  startPollTimer: (poll: Poll) => void;
  resetKickedState: () => void;
  clearChat: () => void;
}

// Backend URL from environment variable or default to localhost
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://intervueassessment.up.railway.app';

let pollTimerInterval: number | null = null;

export const usePollStore = create<PollState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentPoll: null,
  students: [],
  votes: {},
  studentName: null,
  timeRemaining: 0,
  chatMessages: [],
  isKicked: false,
  pollHistory: [],

  initializeSocket: () => {
    if (get().socket) return;

    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      set({ isConnected: true });
      const savedName = sessionStorage.getItem('studentName');
      if (savedName) {
        get().joinSession(savedName);
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('state-update', (state) => {
      set({ 
        currentPoll: state.currentPoll, 
        students: state.students, 
        votes: state.votes,
        chatMessages: state.chatMessages,
        pollHistory: state.pollHistory || []
      });
      if (state.currentPoll && !state.currentPoll.ended) {
        get().startPollTimer(state.currentPoll);
      }
    });

    socket.on('students-updated', (students) => {
      set({ students });
    });

    socket.on('poll-created', (poll) => {
      set({ currentPoll: poll, votes: {}, timeRemaining: poll.timeLimit });
      get().startPollTimer(poll);
    });

    socket.on('poll-ended', (poll) => {
      if(pollTimerInterval) clearInterval(pollTimerInterval);
      set({ currentPoll: poll, timeRemaining: 0 });
    });

    socket.on('votes-updated', (votes) => {
      set({ votes });
    });

    socket.on('history-updated', (pollHistory) => {
      set({ pollHistory });
    });

    socket.on('message-received', (message) => {
        set((state) => ({ chatMessages: [...state.chatMessages, message] }));
    });

    socket.on('chat-cleared', () => {
      set({ chatMessages: [] });
    });

    socket.on('kicked', () => {
      sessionStorage.removeItem('studentName');
      set({ studentName: null, isKicked: true });
    });

    set({ socket });
  },

  startPollTimer: (poll: Poll) => {
    if (pollTimerInterval) clearInterval(pollTimerInterval);
    
    const endTime = poll.startTime + poll.timeLimit * 1000;
    
    pollTimerInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));
        set({ timeRemaining: remaining });
        if (remaining === 0) {
            if (pollTimerInterval) clearInterval(pollTimerInterval);
        }
    }, 1000) as any;
  },

  joinSession: (name) => {
    get().socket?.emit('join-session', { name });
    set({ studentName: name });
  },

  createPoll: (pollData) => {
    const { socket } = get();
    if (socket) {
      socket.emit('create-poll', pollData);
    }
  },

  endPoll: () => {
    get().socket?.emit('end-poll');
  },

  submitVote: (option) => {
    const studentName = get().studentName;
    if (studentName) {
      get().socket?.emit('submit-vote', { option, studentName });
    }
  },

  sendMessage: (message, isTeacher) => {
    const sender = get().studentName || 'Teacher';
    get().socket?.emit('send-message', { message, sender, isTeacher });
  },

  kickStudent: (studentId) => {
    get().socket?.emit('kick-student', { studentId });
  },

  resetKickedState: () => {
    set({ isKicked: false });
  },

  clearChat: () => {
    get().socket?.emit('clear-chat');
  },

})); 