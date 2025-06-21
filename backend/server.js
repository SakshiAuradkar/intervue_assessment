const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// --- DEBUG POINT 1 ---
console.log('DEBUG 1: Starting server.js execution...');

const app = express();
const server = http.createServer(app);

// Define your allowed origins as an array.
const allowedFrontendOrigins = [
  "http://localhost:8080",
  "https://intervue-assessment.vercel.app",
  "https://intervue-assessment.vercel.app/"
];

// If process.env.FRONTEND_URL is set, add it to the allowed list
if (process.env.FRONTEND_URL) {
  const envUrl = process.env.FRONTEND_URL;
  if (!allowedFrontendOrigins.includes(envUrl)) {
    allowedFrontendOrigins.push(envUrl);
  }
  if (envUrl.endsWith('/') && !allowedFrontendOrigins.includes(envUrl.slice(0, -1))) {
      allowedFrontendOrigins.push(envUrl.slice(0, -1));
  }
}

// --- DEBUG POINT 2 ---
console.log("DEBUG 2: Backend process.env.FRONTEND_URL from Railway (Raw):", process.env.FRONTEND_URL);
console.log("DEBUG 3: Backend is allowing CORS from these origins:", allowedFrontendOrigins);

// --- CORS configuration for Express routes (HTTP requests) ---
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedFrontendOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS Error (HTTP): Origin ${origin} not allowed. Allowed: ${allowedFrontendOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));

// --- DEBUG POINT 4 ---
console.log('DEBUG 4: Express CORS middleware configured.');

app.use(express.json());

// --- CORS configuration for Socket.IO ---
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedFrontendOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Socket.IO CORS Error: Origin ${origin} not allowed. Allowed: ${allowedFrontendOrigins.join(', ')}`);
        callback(new Error('Not allowed by Socket.IO CORS'), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// --- DEBUG POINT 5 ---
console.log('DEBUG 5: Socket.IO configured.');

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- DEBUG POINT 6 ---
console.log('DEBUG 6: Express routes defined.');

// Store application state
let currentPoll = null;
let students = [];
let votes = {};
let chatMessages = [];
let pollHistory = [];
let pollTimer = null;

// --- DEBUG POINT 7 ---
console.log('DEBUG 7: Application state initialized.');

// Socket.IO connection handling
io.on('connection', (socket) => {
  // --- DEBUG POINT 8 (This will only log on actual client connection, but useful for verifying) ---
  console.log('DEBUG 8: User connected handler triggered:', socket.id);

  console.log('User connected:', socket.id);

  // Send current state to newly connected client
  socket.emit('state-update', {
    currentPoll,
    students,
    votes,
    chatMessages,
    pollHistory
  });

  // ... (rest of your socket.on handlers) ...
  socket.on('join-session', (data) => {
    try {
      // console.log('DEBUG: join-session received'); // Can add more debugs inside handlers if needed
      const { name } = data;
      const student = {
        id: socket.id,
        name,
        joinedAt: Date.now()
      };

      students = students.filter(s => s.name !== name);
      students.push(student);

      io.emit('students-updated', students);
      console.log('Student joined:', student);
    } catch (error) {
      console.error('Error in join-session:', error);
    }
  });

  socket.on('create-poll', (data) => {
    try {
      const { question, options, timeLimit, correctAnswer } = data;
      
      currentPoll = {
        id: Date.now().toString(),
        question,
        options,
        timeLimit,
        correctAnswer,
        startTime: Date.now(),
        ended: false
      };

      votes = {};
      
      if (pollTimer) {
        clearTimeout(pollTimer);
      }

      pollTimer = setTimeout(() => {
        if (currentPoll && !currentPoll.ended) {
          currentPoll.ended = true;
          const finalPollState = { ...currentPoll, finalVotes: { ...votes } };
          
          pollHistory.push(finalPollState);
          io.emit('poll-ended', finalPollState);
          io.emit('history-updated', pollHistory);
          console.log('Poll ended automatically after timeout.');
        }
      }, timeLimit * 1000);

      io.emit('poll-created', currentPoll);
      console.log('Poll created:', currentPoll);
    } catch (error) {
      console.error('Error in create-poll:', error);
    }
  });

  socket.on('end-poll', () => {
    try {
      if (currentPoll && !currentPoll.ended) {
        currentPoll.ended = true;
        if (pollTimer) {
          clearTimeout(pollTimer);
          pollTimer = null;
        }
        const finalPollState = { ...currentPoll, finalVotes: { ...votes } };
        pollHistory.push(finalPollState);
        io.emit('poll-ended', finalPollState);
        io.emit('history-updated', pollHistory);
        console.log('Poll ended by explicit request.');
      }
    } catch (error) {
      console.error('Error in end-poll:', error);
    }
  });

  socket.on('submit-vote', (data) => {
    try {
      const { option, studentName } = data;
      
      if (currentPoll && !currentPoll.ended && studentName) {
        votes[studentName] = option;
        io.emit('votes-updated', votes);
        console.log('Vote submitted:', { studentName, option });
      }
    } catch (error) {
      console.error('Error in submit-vote:', error);
    }
  });

  socket.on('send-message', (data) => {
    try {
      const { message, sender, isTeacher } = data;
      
      const chatMessage = {
        id: Date.now().toString(),
        sender,
        message,
        timestamp: Date.now(),
        isTeacher: isTeacher || false
      };

      chatMessages.push(chatMessage);
      io.emit('message-received', chatMessage);
      console.log('Message sent:', chatMessage);
    } catch (error) {
      console.error('Error in send-message:', error);
    }
  });

  // Handle clearing chat
  socket.on('clear-chat', () => {
    try {
      chatMessages = []; // Clear the chat messages array
      io.emit('chat-cleared'); // Notify all clients that chat was cleared
      console.log('Chat has been cleared.');
    } catch (error) {
      console.error('Error in clear-chat:', error);
    }
  });

  socket.on('kick-student', (data) => {
    try {
      const { studentId } = data;
      const kickedStudent = students.find(s => s.id === studentId);

      if (kickedStudent) {
        students = students.filter(s => s.id !== studentId);
        
        delete votes[kickedStudent.name];

        io.emit('students-updated', students);
        io.emit('votes-updated', votes);
        
        io.to(studentId).emit('kicked');
        console.log('Student kicked:', studentId);
      }
    } catch (error) {
      console.error('Error in kick-student:', error);
    }
  });

  socket.on('disconnect', () => {
    try {
      const disconnectedStudent = students.find(s => s.id === socket.id);
      
      students = students.filter(s => s.id !== socket.id);
      
      if (disconnectedStudent && votes[disconnectedStudent.name]) {
        delete votes[disconnectedStudent.name];
        io.emit('votes-updated', votes);
      }

      io.emit('students-updated', students);
      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  // --- DEBUG POINT 9 ---
  console.log(`DEBUG 9: Server successfully listening on port ${PORT}`);
  console.log(`Server running on port ${PORT}`); // Your original log
});