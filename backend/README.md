
# Polling App Backend

Real-time polling application backend using Socket.IO and Express.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## Features

- Real-time polling with Socket.IO
- Student session management
- Live chat functionality
- Poll creation and voting
- Student management (kick functionality)

## API Endpoints

The backend primarily uses Socket.IO for real-time communication. No REST endpoints are currently implemented.

## Socket Events

### Client to Server
- `join-session`: Student joins the session
- `create-poll`: Teacher creates a new poll
- `end-poll`: Teacher ends current poll
- `submit-vote`: Student submits a vote
- `send-message`: Send chat message
- `kick-student`: Teacher kicks a student

### Server to Client
- `state-update`: Initial state when connecting
- `students-updated`: Student list updated
- `poll-created`: New poll created
- `poll-ended`: Poll has ended
- `votes-updated`: Vote counts updated
- `message-received`: New chat message
- `kicked`: Student has been kicked

## Environment Variables

- `PORT`: Server port (default: 3001)
