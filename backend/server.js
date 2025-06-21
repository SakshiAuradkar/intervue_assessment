// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Define your allowed origins dynamically based on the environment variable.
// This is now the ONLY place where allowed origins are defined.
const allowedFrontendOrigins = [
  "http://localhost:8080", // Your local frontend dev URL
  "https://intervue-assessment.vercel.app", // Your deployed Vercel frontend URL (without trailing slash)
  "https://intervue-assessment.vercel.app/"  // Your deployed Vercel frontend URL (with trailing slash, as a fallback)
];

// If process.env.FRONTEND_URL is set, add it to the allowed list (just in case it's different)
if (process.env.FRONTEND_URL) {
  const envUrl = process.env.FRONTEND_URL;
  if (!allowedFrontendOrigins.includes(envUrl)) {
    allowedFrontendOrigins.push(envUrl);
  }
  // Also add without trailing slash if the env var came with one
  if (envUrl.endsWith('/') && !allowedFrontendOrigins.includes(envUrl.slice(0, -1))) {
      allowedFrontendOrigins.push(envUrl.slice(0, -1));
  }
}

// --- TEMPORARY DEBUGGING LOG (Keep this for now!) ---
console.log("Backend process.env.FRONTEND_URL from Railway:", process.env.FRONTEND_URL);
console.log("Backend is allowing CORS from these origins:", allowedFrontendOrigins);
// --- END TEMPORARY DEBUGGING LOG ---

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

// ... (rest of your server.js code - no changes below this point) ...

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Store application state
let currentPoll = null;
let students = [];
let votes = {};
let chatMessages = [];
let pollHistory = [];
let pollTimer = null;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current state to newly connected client
  socket.emit('state-update', {
    currentPoll,
    students,
    votes,
    chatMessages,
    pollHistory
  });

  // Handle student joining
  socket.on('join-session', (data) => {
    try {
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

  // Handle poll creation
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

  // Handle poll ending
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

  // Handle vote submission
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

  // Handle chat messages
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

  // Handle student kick
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

  // Handle disconnection
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
  console.log(`Server running on port ${PORT}`);
});