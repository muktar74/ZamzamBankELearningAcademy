
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { User, Course, UserRole, UserProgress, CertificateData, Notification, NotificationType, AiMessage, Review, Toast as ToastType, AllUserProgress, ExternalResource } from './types';
import { BADGE_DEFINITIONS } from './constants';
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
import { supabase } from './services/supabaseClient';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';


type View = 'dashboard' | 'course' | 'certificate' | 'admin' | 'leaderboard' | 'resources' | 'courses' | 'profile';
type Page = 'home' | 'login' | 'register' | 'app';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allUserProgress, setAllUserProgress] = useState<AllUserProgress>({});
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);

  const [aiChatHistory, setAiChatHistory] = useState<AiMessage[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  
  const addToast = useCallback((message: string, type: ToastType['type']) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const fetchAppData = useCallback(async (user: User) => {
    try {
        const fetchUsers = supabase.from('users').select('*');
        const fetchCourses = supabase.from('courses').select('*, reviews(*)');
        const fetchProgress = supabase.from('user_progress').select('*');
        const fetchResources = supabase.from('external_resources').select('*').order('createdAt', { ascending: false });
        const fetchNotifications = supabase.from('notifications').select('*').eq('userId', user.id).order('timestamp', { ascending: false });

        const [
            { data: usersData, error: usersError },
            { data: coursesData, error: coursesError },
            { data: progressData, error: progressError },
            { data: resourcesData, error: resourcesError },
            { data: notificationsData, error: notificationsError }
        ] = await Promise.all([fetchUsers, fetchCourses, fetchProgress, fetchResources, fetchNotifications]);

        if (usersError) throw usersError;
        if (coursesError) throw coursesError;
        if (progressError) throw progressError;
        if (resourcesError) throw resourcesError;
        if (notificationsError) throw notificationsError;
        
        // Transform progress data into the nested object structure the app uses
        const progressObject = (progressData || []).reduce((acc: AllUserProgress, prog) => {
            if (!acc[prog.user_id]) acc[prog.user_id] = {};
            acc[prog.user_id][prog.course_id] = {
                completedModules: prog.completed_modules || [],
                quizScore: prog.quiz_score,
                rating: prog.rating,
                recentlyViewed: prog.recently_viewed,
                completionDate: prog.completion_date,
            };
            return acc;
        }, {});

        setUsers(usersData || []);
        setCourses((coursesData as Course[]) || []);
        setAllUserProgress(progressObject);
        setExternalResources(resourcesData || []);
        setNotifications(notificationsData || []);
        
    } catch (error: any) {
        addToast(`Error loading data: ${error.message}`, 'error');
        console.error("Error fetching app data:", error);
    }
  }, [addToast]);
  
  // Handle auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        // Fetch the user profile using the secure RPC call.
        // This is more robust against RLS race conditions than a direct select.
        const { data: profile, error } = await supabase
            .rpc('get_user_profile')
            .single();
        
        if (error || !profile) {
            console.error('Error fetching user profile via RPC:', error?.message || 'Profile not found.');
            addToast('Could not load your profile. Please try logging in again.', 'error');
            await supabase.auth.signOut();
            return;
        }

        if (!profile.approved) {
            addToast('Your account is pending approval.', 'error');
            await supabase.auth.signOut();
        } else {
            setCurrentUser(profile as User);
            setCurrentPage('app');
            setCurrentView(profile.role === UserRole.ADMIN ? 'admin' : 'dashboard');
            await fetchAppData(profile as User);
        }
      } else {
        setCurrentUser(null);
        setCurrentPage('home');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [addToast, fetchAppData]);
  
   // Realtime notifications subscription
   useEffect(() => {
    let channel: RealtimeChannel | null = null;
    if (currentUser) {
        channel = supabase
            .channel(`public:notifications:userId=eq.${currentUser.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `userId=eq.${currentUser.id}` }, 
            (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
                addToast("You have a new notification!", 'info');
            })
            .subscribe();
    }
    return () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    };
   }, [currentUser, addToast]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    // State will be cleared by the onAuthStateChange listener
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };


  const createNotification = useCallback(async (userId: string, type: NotificationType, message: string) => {
    const newNotification = {
      // id is generated by DB
      userId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const { error } = await supabase.from('notifications').insert(newNotification);
    if (error) {
        addToast(`Error creating notification: ${error.message}`, 'error');
    }
    // If user is viewing their own notifications, it will update via realtime subscription.
    // If admin is creating it for someone else, no need to update admin's state.
  }, [addToast]);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) addToast(error.message, 'error');
    else addToast('Login successful!', 'success');
  };
  
  const handleRegister = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                name: name,
            }
        }
    });
    if (error) addToast(error.message, 'error');
    else {
        addToast('Registration successful! Please check your email to verify your account. Your account will then require administrator approval.', 'success');
        setCurrentPage('login');
    }
  };

  const setView = (view: View) => {
    setSelectedCourse(null);
    setCertificateData(null);
    setCurrentView(view);
  };
  
  const setPage = (page: Page) => {
    setCurrentPage(page);
  };

  const awardPoints = useCallback(async (userId: string, points: number) => {
    const { error } = await supabase.rpc('increment_points', { user_id: userId, points_to_add: points });
    if (error) {
        addToast(`Error awarding points: ${error.message}`, 'error');
    } else {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, points: u.points + points } : u));
    }
  }, [addToast]);

  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    if (currentUser) {
        const { error } = await supabase.from('user_progress').upsert({
            user_id: currentUser.id,
            course_id: course.id,
            recently_viewed: new Date().toISOString()
        });
        if (error) addToast(`Error updating progress: ${error.message}`, 'error');
        // also update local state for immediate feedback
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
  }, [currentUser, addToast]);

  const handleCourseComplete = useCallback(async (course: Course, score: number) => {
    if (!currentUser) return;
    
    const isFirstCompletion = (allUserProgress[currentUser.id]?.[course.id]?.quizScore) === null;
    
    const progressUpdate = {
        user_id: currentUser.id,
        course_id: course.id,
        quiz_score: score,
        completion_date: isFirstCompletion ? new Date().toISOString() : allUserProgress[currentUser.id]?.[course.id]?.completionDate
    };
    
    const { error } = await supabase.from('user_progress').upsert(progressUpdate);
    if(error) {
        addToast(`Error saving completion: ${error.message}`, 'error');
        return;
    }
    
    setAllUserProgress(prev => ({
        ...prev,
        [currentUser.id]: {
            ...prev[currentUser.id],
            [course.id]: {
                ...prev[currentUser.id]?.[course.id],
                quizScore: score,
                completionDate: progressUpdate.completion_date,
            }
        }
    }));

    if (isFirstCompletion) {
        await awardPoints(currentUser.id, 100);
        await createNotification(currentUser.id, NotificationType.CERTIFICATE, `Congratulations! You earned a certificate for "${course.title}".`);
    }

    setCertificateData({
      courseId: course.id,
      employeeName: currentUser.name,
      courseName: course.title,
      completionDate: new Date(progressUpdate.completion_date!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });
    setCurrentView('certificate');

    const userProgress = allUserProgress[currentUser.id] || {};
    const completedCourses = Object.keys(userProgress).filter(cId => userProgress[cId].quizScore !== null);
    if (!completedCourses.includes(course.id)) {
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
        
        const updatedBadges = [...currentUser.badges, ...newBadges];
        const { error: userUpdateError } = await supabase.from('users').update({ badges: updatedBadges }).eq('id', currentUser.id);
        if (userUpdateError) { addToast('Error awarding badge.', 'error'); return; }
        
        await awardPoints(currentUser.id, pointsToAddForBadges);

        setUsers(prevUsers => prevUsers.map(u => 
            u.id === currentUser.id ? { ...u, badges: updatedBadges } : u
        ));
    }
  }, [currentUser, allUserProgress, awardPoints, createNotification, courses, addToast]);

  const updateProgress = useCallback(async (courseId: string, moduleId: string) => {
    if (!currentUser) return;
    const courseProg = allUserProgress[currentUser.id]?.[courseId] || { completedModules: [], quizScore: null };
    if (!courseProg.completedModules.includes(moduleId)) {
        await awardPoints(currentUser.id, 10);
        
        const updatedModules = [...courseProg.completedModules, moduleId];
        const { error } = await supabase.from('user_progress').upsert({
            user_id: currentUser.id,
            course_id: courseId,
            completed_modules: updatedModules,
        });

        if (error) { addToast(`Error updating progress: ${error.message}`, 'error'); return; }
        
        setAllUserProgress(prev => ({
            ...prev,
            [currentUser.id]: {
                ...prev[currentUser.id],
                [courseId]: {
                    ...courseProg,
                    completedModules: updatedModules,
                }
            }
        }));
    }
  }, [currentUser, awardPoints, allUserProgress, addToast]);

  const handleRateCourse = useCallback(async (courseId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    
    const { error: progressError } = await supabase.from('user_progress').upsert({
        user_id: currentUser.id,
        course_id: courseId,
        rating: rating,
    });
    if (progressError) { addToast('Error saving rating.', 'error'); return; }

    const newReview: Omit<Review, 'id'> = {
        authorId: currentUser.id,
        authorName: currentUser.name,
        rating,
        comment,
        timestamp: new Date().toISOString(),
    };

    const { data: savedReview, error: reviewError } = await supabase.from('reviews').insert({ ...newReview, course_id: courseId }).select().single();
    if(reviewError || !savedReview) { addToast('Error saving review.', 'error'); return; }
    
    // Optimistic UI updates
    setAllUserProgress(prev => ({ ...prev, [currentUser.id]: { ...prev[currentUser.id], [courseId]: { ...prev[currentUser.id]?.[courseId], rating: rating }}}));
    setCourses(prevCourses => prevCourses.map(c => 
        c.id === courseId ? { ...c, reviews: [...c.reviews, savedReview as Review] } : c
    ));
    addToast('Thank you for your review!', 'success');
  }, [currentUser, addToast]);

  const handleUpdateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('users').update({
        name: updatedUser.name,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl,
    }).eq('id', updatedUser.id);

    if (error) {
        addToast(`Error updating profile: ${error.message}`, 'error');
    } else {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        addToast('Profile updated successfully!', 'success');
    }
  };

  const renderAppContent = () => {
    if (!currentUser) return null; // Should be handled by page renderer
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
             if (!currentUser) return <div className="min-h-screen bg-zamzam-teal-50 flex items-center justify-center"><p>Loading...</p></div>;
             return (
                <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                  <Header
                    user={currentUser}
                    onLogout={handleLogout}
                    notifications={notifications}
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