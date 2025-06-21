import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, MessageCircle, UserX, History } from 'lucide-react';
import { usePollStore } from '../store/pollStore';
import LiveResults from './LiveResults';
import ChatPanel from './ChatPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TeacherDashboardProps {
  onBack: () => void;
}

const TeacherDashboard = ({ onBack }: TeacherDashboardProps) => {
  const { 
    currentPoll, 
    students, 
    votes,
    pollHistory,
    createPoll, 
    endPoll, 
    kickStudent, 
    isConnected 
  } = usePollStore();
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timeLimit, setTimeLimit] = useState(60);
  const [showChat, setShowChat] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = () => {
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (question.trim() && validOptions.length >= 2 && correctAnswer) {
      createPoll({ question, options: validOptions, timeLimit, correctAnswer });
      setQuestion('');
      setOptions(['', '']);
      setTimeLimit(60);
      setCorrectAnswer('');
    }
  };

  const canCreatePoll = !currentPoll || (currentPoll && currentPoll.ended);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
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
              <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
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
              {students.length} Students
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Create New Poll
                  {!canCreatePoll && (
                    <Badge variant="outline" className="text-xs">
                      Poll Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {canCreatePoll 
                    ? "Create a new poll for your students" 
                    : "End current poll to create a new one"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your poll question..."
                    disabled={!canCreatePoll}
                    className="bg-white/50"
                  />
                </div>

                <div>
                  <Label>Options</Label>
                  <p className="text-xs text-gray-500 mb-2">Select the correct answer by clicking the circle.</p>
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2 mt-2 items-center">
                      <input
                        type="radio"
                        name="correct-answer"
                        value={option}
                        checked={correctAnswer === option}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        disabled={!canCreatePoll || !option.trim()}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}...`}
                        disabled={!canCreatePoll}
                        className="bg-white/50"
                      />
                      {options.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          disabled={!canCreatePoll}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addOption}
                      disabled={!canCreatePoll}
                      className="mt-2 w-full"
                    >
                      + Add Option
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
                    min="10"
                    max="300"
                    disabled={!canCreatePoll}
                    className="bg-white/50"
                  />
                </div>

                {canCreatePoll ? (
                  <Button
                    onClick={handleCreatePoll}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || !correctAnswer}
                  >
                    Create Poll
                  </Button>
                ) : (
                  <Button
                    onClick={endPoll}
                    variant="destructive"
                    className="w-full"
                  >
                    End Current Poll
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle>Connected Students</CardTitle>
                <CardDescription>
                  {students.length} student{students.length !== 1 ? 's' : ''} online
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No students connected</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentPoll && votes[student.name] && (
                            <Badge variant="secondary" className="text-xs">
                              Voted
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => kickStudent(student.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Poll History
                    </CardTitle>
                    <CardDescription>
                        Review results from past polls.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pollHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No past polls yet.</p>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {pollHistory.map((poll) => (
                                <AccordionItem value={poll.id} key={poll.id}>
                                    <AccordionTrigger>{poll.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <ul>
                                            {poll.options.map((option) => {
                                                const voteCount = Object.values(poll.finalVotes).filter(v => v === option).length;
                                                return (
                                                    <li key={option} className="flex justify-between items-center p-2">
                                                        <span>{option}</span>
                                                        <span className='font-bold'>{voteCount} vote(s)</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {currentPoll ? (
              <LiveResults />
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Active Poll</h3>
                  <p>Create a poll to see live results here</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatPanel onClose={() => setShowChat(false)} isTeacher />
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
