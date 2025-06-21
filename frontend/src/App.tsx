import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Zap } from 'lucide-react';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { usePollStore } from './store/pollStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewType = 'home' | 'teacher' | 'student';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const { initializeSocket, isKicked, resetKickedState } = usePollStore();

  useEffect(() => {
    // Initialize socket connection when app loads
    initializeSocket();
  }, [initializeSocket]);

  const handleKickedDialogClose = () => {
    resetKickedState();
    setCurrentView('home');
  };

  const renderView = () => {
    switch (currentView) {
      case 'teacher':
        return <TeacherDashboard onBack={() => setCurrentView('home')} />;
      case 'student':
        return <StudentDashboard onBack={() => setCurrentView('home')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero Section */}
              <div className="mb-12">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl font-bold text-gray-800 mb-4">
                  Live Polling App
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Create interactive polls, engage your audience, and see real-time results with our modern polling platform.
                </p>
              </div>

              {/* Role Selection Cards */}
              <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <Card 
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
                  onClick={() => setCurrentView('teacher')}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-800">Teacher</CardTitle>
                    <CardDescription className="text-gray-600">
                      Create and manage polls, monitor responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                      Start Teaching
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
                  onClick={() => setCurrentView('student')}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-800">Student</CardTitle>
                    <CardDescription className="text-gray-600">
                      Join a session and participate in polls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg">
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Features */}
              <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
                <div className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Real-time Updates</h3>
                  <p className="text-sm text-gray-600">See poll results update live as students vote</p>
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Interactive Chat</h3>
                  <p className="text-sm text-gray-600">Built-in chat for Q&A and discussions</p>
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Easy to Use</h3>
                  <p className="text-sm text-gray-600">Simple interface for both teachers and students</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderView()}
      <Dialog open={isKicked} onOpenChange={(open) => {if(!open) handleKickedDialogClose()}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You have been kicked</DialogTitle>
            <DialogDescription>
              You have been removed from the session by the teacher.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleKickedDialogClose}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
