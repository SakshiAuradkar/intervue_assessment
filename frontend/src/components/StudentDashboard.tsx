import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MessageCircle, Users } from 'lucide-react';
import { usePollStore } from '../store/pollStore';
import LiveResults from './LiveResults';
import ChatPanel from './ChatPanel';

interface StudentDashboardProps {
  onBack: () => void;
}

const StudentDashboard = ({ onBack }: StudentDashboardProps) => {
  const { 
    currentPoll, 
    students, 
    studentName, 
    votes, 
    timeRemaining,
    joinSession, 
    submitVote, 
    isConnected 
  } = usePollStore();
  
  const [name, setName] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const savedName = sessionStorage.getItem('studentName');
    if (savedName) {
      setName(savedName);
      joinSession(savedName);
      setHasJoined(true);
    }
  }, [joinSession]);

  const handleJoinSession = () => {
    if (name.trim()) {
      sessionStorage.setItem('studentName', name.trim());
      joinSession(name.trim());
      setHasJoined(true);
    }
  };

  const handleSubmitVote = () => {
    if (selectedOption && currentPoll) {
      submitVote(selectedOption);
      setSelectedOption('');
    }
  };

  const hasVoted = currentPoll && studentName && votes[studentName];
  const canVote = currentPoll && !currentPoll.ended && !hasVoted && timeRemaining > 0;

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Join Polling Session</CardTitle>
            <CardDescription>
              Enter your name to participate in live polls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="bg-white/50"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleJoinSession}
                disabled={!name.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Join Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Welcome, <strong>{studentName}</strong>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowChat(!showChat)}
              className="bg-white/50 border-white/50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Badge variant="secondary" className="bg-white/50">
              <Users className="w-4 h-4 mr-1" />
              {students.length} Online
            </Badge>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {currentPoll && !currentPoll.ended ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Current Poll</CardTitle>
                    {timeRemaining > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeRemaining}s
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">{currentPoll.question}</h3>
                  </div>

                  {canVote ? (
                    <div className="space-y-3">
                      {currentPoll.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedOption === option
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300 bg-white/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poll-option"
                            value={option}
                            checked={selectedOption === option}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                            selectedOption === option
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedOption === option && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <span className="font-medium text-gray-700">{option}</span>
                        </label>
                      ))}

                      <Button
                        onClick={handleSubmitVote}
                        disabled={!selectedOption}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mt-4"
                      >
                        Submit Vote
                      </Button>
                    </div>
                  ) : hasVoted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✓</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">Vote Submitted!</h3>
                      <p className="text-gray-600">See the live results below</p>
                    </div>
                  ) : timeRemaining <= 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">Time's Up!</h3>
                      <p className="text-gray-600">See the results below</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div>
                <LiveResults />
              </div>
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Waiting for Poll</h3>
                <p>Your teacher will start a poll soon</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatPanel onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
