
# Real-Time Polling Application

Frontend hosted on vercel and backend on railway.

Live link : https://intervue-assessment.vercel.app/
A modern real-time polling application built with React and Socket.IO for interactive classroom or presentation engagement.

## 🚀 Features

- **Real-time Polling**: Create polls and see results update live as participants vote
- **Dual Interface**: Separate dashboards for teachers and students
- **Live Chat**: Built-in chat system for Q&A and discussions
- **Multiple Choice**: Support for up to 6 options per poll
- **Timer-based Polls**: Set time limits for voting periods
- **Student Management**: Teachers can kick disruptive students
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Interactive Visualizations**: Charts and progress bars for results



## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Shadcn/ui** - UI component library
- **Zustand** - State management
- **Socket.IO Client** - Real-time client
- **Recharts** - Data visualization

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server will start on `http://localhost:3001`

### Frontend Setup
```bash
# From project root
npm install
npm run dev
```
The frontend will start on `http://localhost:8080`(incase using it locally)

### Usage
1. Open `http://localhost:8080` in your browser
2. Choose **Teacher** to create and manage polls
3. Choose **Student** to join sessions and participate in polls
4. Teachers can create polls with questions and multiple choice options
5. Students join by entering their name and can vote on active polls
6. Results update in real-time for all participants

## 📱 Application Features

### Teacher Dashboard
- Create polls with custom questions and options
- Set time limits for voting periods
- Monitor live results with charts and statistics
- Manage connected students
- End polls manually or let them timeout
- Access to live chat for Q&A

### Student Dashboard
- Join sessions with a simple name entry
- Participate in active polls with intuitive voting interface
- View live results after voting
- Access to chat for questions and discussions
- Automatic session persistence

### Live Results
- Real-time vote counting and percentage calculations
- Interactive charts using Recharts
- Progress bars for each option
- Participation statistics
- Visual indicators for poll status

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
VITE_BACKEND_URL=http://localhost:3001(local)
```




