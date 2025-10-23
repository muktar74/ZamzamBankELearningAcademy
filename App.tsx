

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { User, Course, UserRole, UserProgress, CertificateData, Notification, NotificationType, AiMessage, Review, Toast as ToastType, AllUserProgress, ExternalResource } from './types';
import { INITIAL_USERS, INITIAL_COURSES, INITIAL_NOTIFICATIONS, BADGE_DEFINITIONS, INITIAL_EXTERNAL_RESOURCES } from './constants';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseView from './components/CourseView';
import CertificateView from './components/CertificateView';
import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';
import Login from './components/Login';
import HomePage from './components/HomePage';
import Register from './components/Register';
import PublicHeader from './components/PublicHeader';
import AiAssistant from './components/AiAssistant';
import Leaderboard from './components/Leaderboard';
import ResourceLibrary from './components/ResourceLibrary';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import UserProfile from './components/UserProfile';

type View = 'dashboard' | 'course' | 'certificate' | 'admin' | 'leaderboard' | 'resources' | 'courses' | 'profile';
type Page = 'home' | 'login' | 'register' | 'app';

const loadFromLocalStorage = <T,>(key: string, fallback: T, validator: (data: any) => data is T): T => {
    try {
        const stored = localStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : null;
        if (validator(parsed)) {
            // Special check for users to ensure admin always exists as a fallback for the demo.
            if (key === 'zamzamUsers') {
                const users = parsed as unknown as User[];
                const adminExists = users.some(u => u.id === 'user-2');
                if (!adminExists) {
                    const adminUser = INITIAL_USERS.find(u => u.id === 'user-2');
                    if (adminUser) {
                        return [...users, adminUser] as unknown as T;
                    }
                }
            }
            return parsed;
        }
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
    }
    return fallback;
};

const App: React.FC = () => {
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => localStorage.getItem('zamzamLoggedInUserId'));
  const [users, setUsers] = useState<User[]>(() => loadFromLocalStorage('zamzamUsers', INITIAL_USERS, (d): d is User[] => Array.isArray(d)));
  const [courses, setCourses] = useState<Course[]>(() => loadFromLocalStorage('zamzamCourses', INITIAL_COURSES, (d): d is Course[] => Array.isArray(d)));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromLocalStorage('zamzamNotifications', INITIAL_NOTIFICATIONS, (d): d is Notification[] => Array.isArray(d)));
  const [allUserProgress, setAllUserProgress] = useState<AllUserProgress>(() => loadFromLocalStorage('zamzamAllUserProgress', {}, (d): d is AllUserProgress => typeof d === 'object' && d !== null));
  const [externalResources, setExternalResources] = useState<ExternalResource[]>(() => loadFromLocalStorage('zamzamResources', INITIAL_EXTERNAL_RESOURCES, (d): d is ExternalResource[] => Array.isArray(d)));

  const [aiChatHistory, setAiChatHistory] = useState<AiMessage[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const currentUser = useMemo(() => {
    if (!loggedInUserId) return null;
    return users.find(u => u.id === loggedInUserId) || null;
  }, [loggedInUserId, users]);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  
  // State persistence to localStorage
  useEffect(() => {
    localStorage.setItem('zamzamUsers', JSON.stringify(users));
  }, [users]);
  
  useEffect(() => {
    localStorage.setItem('zamzamCourses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('zamzamNotifications', JSON.stringify(notifications));
  }, [notifications]);
  
  useEffect(() => {
    localStorage.setItem('zamzamAllUserProgress', JSON.stringify(allUserProgress));
  }, [allUserProgress]);
  
  useEffect(() => {
    localStorage.setItem('zamzamResources', JSON.stringify(externalResources));
  }, [externalResources]);

  const addToast = useCallback((message: string, type: ToastType['type']) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const handleLogout = useCallback(() => {
    setLoggedInUserId(null);
    localStorage.removeItem('zamzamLoggedInUserId');
  }, []);

  useEffect(() => {
    if (currentUser) {
        // If the current user gets un-approved while logged in, log them out.
        if (!currentUser.approved) {
            handleLogout();
            addToast('Your account access has been revoked.', 'error');
        } else {
             setCurrentPage('app');
             // The view might depend on the role, which could have been changed by an admin.
             setCurrentView(currentUser.role === UserRole.ADMIN ? 'admin' : 'dashboard');
        }
    } else {
        // No current user, so ensure we are on public pages.
        if (loggedInUserId) {
            // This means an ID was in storage but the user was deleted. Clean up.
            setLoggedInUserId(null);
            localStorage.removeItem('zamzamLoggedInUserId');
        }
        setCurrentPage('home');
    }
  }, [currentUser, loggedInUserId, handleLogout, addToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };


  const createNotification = useCallback((userId: string, type: NotificationType, message: string) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const handleLogin = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        if (!user.approved) {
            addToast('Your account is pending approval.', 'error');
            return;
        }
      localStorage.setItem('zamzamLoggedInUserId', user.id);
      setLoggedInUserId(user.id);
      addToast('Login successful!', 'success');
    } else {
        addToast('Invalid email or password.', 'error');
    }
  };
  
  const handleRegister = (name: string, email: string, password: string) => {
    if (users.some(u => u.email === email)) {
        addToast('An account with this email already exists.', 'error');
        return;
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password,
        role: UserRole.EMPLOYEE,
        approved: false,
        points: 0,
        badges: [],
    };
    setUsers(prev => [...prev, newUser]);
    addToast('Registration successful! Your account is pending administrator approval.', 'success');
    setCurrentPage('login');
  };

  const setView = (view: View) => {
    setSelectedCourse(null);
    setCertificateData(null);
    setCurrentView(view);
  };
  
  const setPage = (page: Page) => {
    setCurrentPage(page);
  };

  const awardPoints = useCallback((userId: string, points: number) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, points: u.points + points } : u));
  }, []);

  const handleSelectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    if (currentUser) {
        setAllUserProgress(prev => {
            const currentUserProgress = prev[currentUser.id] || {};
            const updatedUserProgress = {
                ...currentUserProgress,
                [course.id]: {
                    ...(currentUserProgress[course.id] || { completedModules: [], quizScore: null }),
                    recentlyViewed: new Date().toISOString(),
                }
            };
            return { ...prev, [currentUser.id]: updatedUserProgress };
        });
    }
  }, [currentUser]);

  const handleCourseComplete = useCallback((course: Course, score: number) => {
    if (!currentUser) return;
    
    const isFirstCompletion = (allUserProgress[currentUser.id]?.[course.id]?.quizScore) === null;
    
    // Update progress state
    setAllUserProgress(prev => {
        const currentUserProgress = prev[currentUser.id] || {};
        const courseProgress = currentUserProgress[course.id] || { completedModules: [], quizScore: null };
        
        const updatedCourseProgress: any = {
            ...courseProgress,
            quizScore: score,
        };

        if (isFirstCompletion) {
            updatedCourseProgress.completionDate = new Date().toISOString();
        }

        const updatedUserProgress = {
            ...currentUserProgress,
            [course.id]: updatedCourseProgress
        };
        return { ...prev, [currentUser.id]: updatedUserProgress };
    });

    // Award points and create certificate
    if (isFirstCompletion) {
        awardPoints(currentUser.id, 100); // 100 points for completing a course
        createNotification(currentUser.id, NotificationType.CERTIFICATE, `Congratulations! You earned a certificate for "${course.title}".`);
    }

    setCertificateData({
      courseId: course.id,
      employeeName: currentUser.name,
      courseName: course.title,
      completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });
    setCurrentView('certificate');

    // --- Badge Awarding Logic ---
    const userProgress = allUserProgress[currentUser.id] || {};
    const completedCourses = Object.keys(userProgress).filter(cId => userProgress[cId].quizScore !== null);
    if (!completedCourses.includes(course.id)) { // Add current course if it's a new completion
        completedCourses.push(course.id);
    }
    const completedCount = completedCourses.length;

    const newBadges: string[] = [];
    if (completedCount >= 1 && !currentUser.badges.includes('first-course')) newBadges.push('first-course');
    if (completedCount >= 3 && !currentUser.badges.includes('prolific-learner')) newBadges.push('prolific-learner');
    if (score === 100 && !currentUser.badges.includes('quiz-master')) newBadges.push('quiz-master');
    if (completedCount === courses.length && !currentUser.badges.includes('completionist')) newBadges.push('completionist');

    if (newBadges.length > 0) {
        let pointsToAddForBadges = 0;
        newBadges.forEach(badgeId => {
            const badge = BADGE_DEFINITIONS[badgeId];
            if (badge) {
                pointsToAddForBadges += badge.points;
                addToast(`Badge Unlocked: ${badge.name}!`, 'success');
                createNotification(currentUser.id, NotificationType.BADGE, `You earned the "${badge.name}" badge and ${badge.points} points!`);
            }
        });

        setUsers(prevUsers => prevUsers.map(u => 
            u.id === currentUser.id 
                ? { ...u, badges: [...u.badges, ...newBadges], points: u.points + pointsToAddForBadges } 
                : u
        ));
    }
  }, [currentUser, allUserProgress, awardPoints, createNotification, courses, addToast]);

  const updateProgress = useCallback((courseId: string, moduleId: string) => {
    if (!currentUser) return;
    setAllUserProgress(prev => {
        const currentUserProgress = prev[currentUser.id] || {};
        const courseProg = currentUserProgress[courseId] || { completedModules: [], quizScore: null };
        if (!courseProg.completedModules.includes(moduleId)) {
            awardPoints(currentUser.id, 10); // 10 points per module
            const updatedCourseProg = {
                ...courseProg,
                completedModules: [...courseProg.completedModules, moduleId]
            };
            const updatedUserProgress = { ...currentUserProgress, [courseId]: updatedCourseProg };
            return { ...prev, [currentUser.id]: updatedUserProgress };
        }
        return prev;
    });
  }, [currentUser, awardPoints]);

  const handleRateCourse = useCallback((courseId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    
    setAllUserProgress(prev => {
        const currentUserProgress = prev[currentUser.id] || {};
        const updatedUserProgress = {
            ...currentUserProgress,
            [courseId]: {
                ...(currentUserProgress[courseId] || { completedModules: [], quizScore: null }),
                rating: rating,
            }
        };
        return { ...prev, [currentUser.id]: updatedUserProgress };
    });

    const newReview: Review = {
        id: `rev-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        rating,
        comment,
        timestamp: new Date().toISOString(),
    };

    setCourses(prevCourses => prevCourses.map(c => 
        c.id === courseId ? { ...c, reviews: [...c.reviews, newReview] } : c
    ));
    addToast('Thank you for your review!', 'success');
  }, [currentUser, addToast]);

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    addToast('Profile updated successfully!', 'success');
  };

  const renderAppContent = () => {
    if (!currentUser) return <Login onLogin={handleLogin} setPage={setPage} />;
    const currentUserProgress = allUserProgress[currentUser.id] || {};

    if (currentUser.role === UserRole.ADMIN) {
      return <AdminDashboard 
        courses={courses} 
        setCourses={setCourses} 
        users={users}
        setUsers={setUsers}
        createNotification={createNotification}
        addToast={addToast}
        allUserProgress={allUserProgress}
        externalResources={externalResources}
        setExternalResources={setExternalResources}
      />;
    }

    switch (currentView) {
      case 'course':
        return (
          <CourseView
            course={selectedCourse}
            setCourses={setCourses}
            currentUser={currentUser}
            userProgress={selectedCourse ? currentUserProgress[selectedCourse.id] : undefined}
            onModuleComplete={updateProgress}
            onCourseComplete={(score) => selectedCourse && handleCourseComplete(selectedCourse, score)}
            onBack={() => setView('dashboard')}
            addToast={addToast}
          />
        );
      case 'certificate':
        return certificateData && (
          <CertificateView
            data={certificateData}
            onBackToDashboard={() => setView('dashboard')}
            onRateCourse={handleRateCourse}
            userRating={currentUserProgress[certificateData.courseId]?.rating}
            userReview={courses.find(c => c.id === certificateData.courseId)?.reviews.find(r => r.authorId === currentUser.id)}
            addToast={addToast}
          />
        );
      case 'leaderboard':
        return <Leaderboard users={users.filter(u => u.role === UserRole.EMPLOYEE)} onBack={() => setView('dashboard')} />;
      case 'resources':
        return <ResourceLibrary onBack={() => setView('dashboard')} resources={externalResources} />;
      case 'courses':
        return (
            <Dashboard 
                user={currentUser}
                courses={courses} 
                onSelectCourse={handleSelectCourse}
                userProgress={currentUserProgress}
                onViewLeaderboard={() => setView('leaderboard')}
                onViewResources={() => setView('resources')}
                showOverview={false}
            />
        );
      case 'profile':
        return <UserProfile user={currentUser} onUpdateUser={handleUpdateUser} onBack={() => setView('dashboard')} addToast={addToast} />;
      case 'dashboard':
      default:
        return (
            <Dashboard 
                user={currentUser}
                courses={courses} 
                onSelectCourse={handleSelectCourse}
                userProgress={currentUserProgress}
                onViewLeaderboard={() => setView('leaderboard')}
                onViewResources={() => setView('resources')}
            />
        );
    }
  };
  
  const renderPage = () => {
    switch (currentPage) {
        case 'login':
            return <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                <PublicHeader setPage={setPage} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <Login onLogin={handleLogin} setPage={setPage} />
                </main>
                <Footer />
            </div>;
        case 'register':
            return <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                <PublicHeader setPage={setPage} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <Register onRegister={handleRegister} setPage={setPage}/>
                </main>
                <Footer />
            </div>;
        case 'app':
             if (!currentUser) return <Login onLogin={handleLogin} setPage={setPage} />;
             return (
                <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                  <Header
                    user={currentUser}
                    onLogout={handleLogout}
                    notifications={notifications.filter(n => n.userId === currentUser.id)}
                    setNotifications={setNotifications}
                    onNavigate={setView}
                  />
                  <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
                    {renderAppContent()}
                  </main>
                  {currentUser.role === UserRole.EMPLOYEE && 
                    <AiAssistant 
                        history={aiChatHistory} 
                        setHistory={setAiChatHistory}
                        courseContext={selectedCourse ? {title: selectedCourse.title, description: selectedCourse.description} : undefined}
                    />
                  }
                  <Footer />
                </div>
              );
        case 'home':
        default:
            return <HomePage setPage={setPage} courses={courses.slice(0,3)} />;
    }
  }

  return (
    <ErrorBoundary>
        <div className="fixed top-5 right-5 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
        {renderPage()}
    </ErrorBoundary>
  );
};

export default App;
