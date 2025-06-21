import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePollStore } from '../store/pollStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle } from 'lucide-react';

const LiveResults = () => {
  const { currentPoll, votes, students, timeRemaining } = usePollStore();

  if (!currentPoll) return null;

  const voteCount = Object.keys(votes).length;
  const totalStudents = students.length;

  const results = currentPoll.options.map((option) => {
    const optionVotes = Object.values(votes).filter(vote => vote === option).length;
    const percentage = totalStudents > 0 ? (optionVotes / totalStudents) * 100 : 0;
    
    return {
      option,
      votes: optionVotes,
      percentage: Math.round(percentage),
    };
  });

  const colors = [
    '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Live Results</CardTitle>
          <div className="flex items-center gap-2">
            {timeRemaining > 0 && !currentPoll.ended && (
              <Badge variant="outline" className="animate-pulse">
                {timeRemaining}s remaining
              </Badge>
            )}
            <Badge variant="secondary">
              {voteCount}/{totalStudents} votes
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="font-semibold text-gray-800">{currentPoll.question}</h3>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => {
            const isCorrect = currentPoll.ended && result.option === currentPoll.correctAnswer;
            return (
              <div
                key={result.option}
                className={`space-y-2 p-3 rounded-lg transition-all ${isCorrect ? 'bg-green-100 ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    {result.option}
                    {isCorrect && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Correct
                      </Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{result.votes} votes</span>
                    <Badge 
                      variant="secondary" 
                      style={{ backgroundColor: `${colors[index % colors.length]}20`, color: colors[index % colors.length] }}
                    >
                      {result.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={result.percentage} 
                  className="h-3"
                  indicatorClassName={isCorrect ? 'bg-green-500' : ''}
                />
              </div>
            );
          })}
        </div>

        {voteCount > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-4">Vote Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="option" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{voteCount}</div>
            <div className="text-sm text-gray-500">Students Voted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalStudents - voteCount}</div>
            <div className="text-sm text-gray-500">Waiting to Vote</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveResults;
