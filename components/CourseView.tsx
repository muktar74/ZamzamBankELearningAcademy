
import React, { useState, useEffect } from 'react';
import { Course, User } from '../types';
import QuizView from './QuizView';
import DiscussionForum from './DiscussionForum';
import { ChevronLeftIcon, DocumentTextIcon, CheckCircleIcon, LockClosedIcon, ChatBubbleLeftRightIcon, AcademicCapIcon, StarIcon, BookOpenIcon as DownloadIcon } from './icons';
import ReviewsTab from './ReviewsTab';

interface CourseViewProps {
  course: Course | null;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  currentUser: User;
  userProgress?: {
    completedModules: string[];
    quizScore: number | null;
  };
  onModuleComplete: (courseId: string, moduleId: string) => void;
  onCourseComplete: (score: number) => void;
  onBack: () => void;
}

type CourseTab = 'content' | 'discussion' | 'reviews';

const CourseView: React.FC<CourseViewProps> = ({ course, setCourses, currentUser, userProgress, onModuleComplete, onCourseComplete, onBack }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<CourseTab>('content');

  useEffect(() => {
      if (course && course.modules && course.modules.length > 0) {
          const firstModuleId = course.modules[0].id;
          if (activeModuleId !== firstModuleId) {
            setActiveModuleId(firstModuleId);
          }
      }
  }, [course]);

  const activeModule = course?.modules.find(m => m.id === activeModuleId);
  const activeModuleIndex = course?.modules.findIndex(m => m.id === activeModuleId) ?? -1;
  const completedModules = userProgress?.completedModules || [];
  const allModulesCompleted = course ? completedModules.length === course.modules.length : false;
  const hasQuiz = course && course.quiz && course.quiz.length > 0;

  useEffect(() => {
    if (activeModuleId && course && !completedModules.includes(activeModuleId)) {
      onModuleComplete(course.id, activeModuleId);
    }
  }, [activeModuleId, course, onModuleComplete]);
  
  const handleNextModule = () => {
    if (course && activeModuleIndex < course.modules.length - 1) {
        const nextModule = course.modules[activeModuleIndex + 1];
        setActiveModuleId(nextModule.id);
    }
  };

  const handlePrevModule = () => {
    if (course && activeModuleIndex > 0) {
        const prevModule = course.modules[activeModuleIndex - 1];
        setActiveModuleId(prevModule.id);
    }
  };

  if (!course) {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h2>
            <p className="text-slate-600">The course you are looking for does not exist. It may have been moved, edited, or deleted.</p>
            <button onClick={onBack} className="mt-6 bg-zamzam-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-zamzam-teal-700 transition">
                Return to Dashboard
            </button>
        </div>
    );
  }

  if (showQuiz) {
    return <QuizView course={course} onQuizComplete={onCourseComplete} />;
  }
  
  const TabButton: React.FC<{tab: CourseTab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === tab
                ? 'border-zamzam-teal-600 text-zamzam-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-zamzam-teal-600 hover:text-zamzam-teal-800 mb-6 transition">
        <ChevronLeftIcon className="h-5 w-5 mr-1" />
        Back to Dashboard
      </button>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Modules Sidebar */}
        <aside className="lg:w-1/3 border-r-0 lg:border-r lg:pr-8 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
          <ul className="space-y-2">
            {course.modules.map((module) => {
              const isCompleted = completedModules.includes(module.id);
              const isActive = activeModuleId === module.id && activeTab === 'content';
              return (
                <li key={module.id}>
                  <button
                    onClick={() => { setActiveModuleId(module.id); setActiveTab('content'); }}
                    className={`w-full text-left flex items-center p-3 rounded-md transition ${
                      isActive
                        ? 'bg-zamzam-teal-100 text-zamzam-teal-800 font-semibold'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {isCompleted ? (
                       <CheckCircleIcon className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <DocumentTextIcon className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" />
                    )}
                    <span className={isCompleted && !isActive ? 'text-slate-500' : ''}>{module.title}</span>
                  </button>
                </li>
              );
            })}
             {course.modules.length === 0 && (
                <li className="p-3 text-sm text-slate-500 text-center bg-slate-50 rounded-md">This course has no modules yet.</li>
            )}
          </ul>
           {course.textbookUrl && (
                <a
                    href={course.textbookUrl}
                    download={course.textbookName}
                    className="w-full mt-4 py-3 px-4 rounded-lg font-semibold text-zamzam-teal-800 bg-zamzam-teal-100 hover:bg-zamzam-teal-200 transition flex items-center justify-center space-x-2"
                >
                    <DownloadIcon className="h-5 w-5"/>
                    <span>Download Textbook</span>
                </a>
           )}
          <button
            onClick={() => setShowQuiz(true)}
            disabled={!allModulesCompleted || !hasQuiz}
            className="w-full mt-4 py-3 px-4 rounded-lg font-semibold text-white transition disabled:bg-slate-300 disabled:cursor-not-allowed bg-zamzam-teal-600 hover:bg-zamzam-teal-700 flex items-center justify-center space-x-2"
          >
            {allModulesCompleted && hasQuiz && <span>Start Final Quiz</span>}
            {!allModulesCompleted && <LockClosedIcon className="h-5 w-5" />}
            {!allModulesCompleted && <span>Complete modules to unlock</span>}
            {allModulesCompleted && !hasQuiz && <span>Quiz Not Available</span>}
          </button>
        </aside>

        {/* Content Area */}
        <main className="lg:w-2/3 min-w-0">
            <div className="border-b border-slate-200 mb-6">
                <div className="flex items-center space-x-4">
                    <TabButton tab="content" label="Course Content" icon={<AcademicCapIcon className="h-5 w-5"/>} />
                    <TabButton tab="discussion" label="Discussion Forum" icon={<ChatBubbleLeftRightIcon className="h-5 w-5"/>} />
                    <TabButton tab="reviews" label="Reviews" icon={<StarIcon className="h-5 w-5"/>} />
                </div>
            </div>

          {activeTab === 'content' && (
             activeModule ? (
                <div>
                    <div className="prose max-w-none prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-800 prose-ul:list-disc prose-ul:ml-6 prose-img:rounded-md prose-img:shadow-sm prose-a:text-zamzam-teal-600 prose-a:font-semibold hover:prose-a:text-zamzam-teal-700">
                      <h3 className="text-3xl font-bold text-slate-800 mb-4">{activeModule.title}</h3>
                       {/* SECURITY NOTE: Using dangerouslySetInnerHTML to render HTML from the course content.
                           This is acceptable here because the content is created by trusted administrators.
                           In a scenario where users can create content, this would need to be sanitized to prevent XSS attacks. */}
                      <div dangerouslySetInnerHTML={{ __html: activeModule.content }} />
                    </div>
                     <div className="flex justify-between mt-8 border-t pt-4">
                        <button
                          onClick={handlePrevModule}
                          disabled={activeModuleIndex <= 0}
                          className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous Module
                        </button>
                        <button
                          onClick={handleNextModule}
                          disabled={activeModuleIndex >= course.modules.length - 1}
                          className="px-4 py-2 text-sm font-semibold text-white bg-zamzam-teal-600 rounded-md hover:bg-zamzam-teal-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          Next Module
                        </button>
                      </div>
                </div>
              ) : (
                <p className="text-slate-600">Select a module to begin, or check the other tabs for discussion and reviews.</p>
              )
          )}
          {activeTab === 'discussion' && (
            <DiscussionForum 
                courseId={course.id} 
                posts={course.discussion} 
                currentUser={currentUser}
                setCourses={setCourses}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab reviews={course.reviews} />
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseView;