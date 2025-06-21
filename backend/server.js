const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

// Health check endpoint
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
      const { question, options, timeLimit } = data;
      
      currentPoll = {
        id: Date.now().toString(),
        question,
        options,
        timeLimit,
        startTime: Date.now(),
        ended: false
      };

      votes = {};
      
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
        pollHistory.push({ ...currentPoll, finalVotes: { ...votes } });
        io.emit('poll-ended', currentPoll);
        io.emit('history-updated', pollHistory);
        console.log('Poll ended');
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
      students = students.filter(s => s.id !== studentId);
      
      // Remove votes from kicked student
      const kickedStudent = Object.keys(votes).find(name => 
        students.find(s => s.name === name && s.id === studentId)
      );
      if (kickedStudent) {
        delete votes[kickedStudent];
      }

      io.emit('students-updated', students);
      io.emit('votes-updated', votes);
      
      // Disconnect the kicked student
      io.to(studentId).emit('kicked');
      console.log('Student kicked:', studentId);
    } catch (error) {
      console.error('Error in kick-student:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      students = students.filter(s => s.id !== socket.id);
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
