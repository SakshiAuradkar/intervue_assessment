const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // Ensure cors package is installed (npm install cors)

const app = express();
const server = http.createServer(app);

// Define your allowed origins dynamically based on the environment variable
// In production, process.env.FRONTEND_URL will be used.
// In development, it will fallback to http://localhost:8080 (or your actual frontend dev port)
const allowedFrontendOrigin = process.env.FRONTEND_URL || "http://localhost:8080";

// --- CORS configuration for Express routes (HTTP requests) ---
app.use(cors({
  origin: allowedFrontendOrigin, // Use the dynamically set origin
  credentials: true // Important if you send cookies or authorization headers
}));

app.use(express.json()); // Middleware to parse JSON bodies

// --- CORS configuration for Socket.IO ---
const io = socketIo(server, {
  cors: {
    origin: allowedFrontendOrigin, // Use the dynamically set origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Add common methods if not explicitly handled by your use case
    credentials: true // Match with express cors if you use cookies/auth with sockets
  }
});

// --- Health check endpoint ---
app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- Application State (moved to top for clarity) ---
let currentPoll = null;
let students = [];
let votes = {};
let chatMessages = [];
let pollHistory = [];
let pollTimer = null;

// --- Socket.IO connection handling ---
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

      // Ensure no duplicate names; filter out existing student with same name
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
      const { question, options, timeLimit } = data;

      currentPoll = {
        id: Date.now().toString(),
        question,
        options,
        timeLimit,
        startTime: Date.now(),
        ended: false
      };

      votes = {}; // Reset votes for new poll

      // Clear any existing timer
      if (pollTimer) {
        clearTimeout(pollTimer);
      }

      // Set timer to end poll
      pollTimer = setTimeout(() => {
        if (currentPoll && !currentPoll.ended) {
          currentPoll.ended = true;
          pollHistory.push({ ...currentPoll, finalVotes: { ...votes } });
          io.emit('poll-ended', currentPoll);
          io.emit('history-updated', pollHistory);
          console.log('Poll ended automatically after timeout.');
        }
      }, timeLimit * 1000); // timeLimit is in seconds, convert to milliseconds

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
        pollHistory.push({ ...currentPoll, finalVotes: { ...votes } });
        io.emit('poll-ended', currentPoll);
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
        votes[studentName] = option; // Store vote by studentName
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

        // Remove votes from kicked student by their name
        delete votes[kickedStudent.name];

        io.emit('students-updated', students);
        io.emit('votes-updated', votes); // Update votes state for all clients

        // Disconnect the kicked student's socket
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
      // Find the disconnected student by socket.id
      const disconnectedStudent = students.find(s => s.id === socket.id);
      
      students = students.filter(s => s.id !== socket.id);
      
      // Also remove their vote if they were in a poll
      if (disconnectedStudent && votes[disconnectedStudent.name]) {
        delete votes[disconnectedStudent.name];
        io.emit('votes-updated', votes); // Update votes state for all clients
      }

      io.emit('students-updated', students);
      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001; // Railway will provide PORT, fallback to 3001 for local
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});