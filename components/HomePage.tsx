
import React, { useState } from 'react';
import { Course, AiMessage } from '../types';
import CourseCard from './CourseCard';
import Footer from './Footer';
import PublicHeader from './PublicHeader';
import { BookOpenIcon, CheckCircleIcon, StarIcon } from './icons';
import AiAssistant from './AiAssistant';

interface HomePageProps {
  setPage: (page: 'home' | 'login' | 'register') => void;
  courses: Course[];
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-zamzam-teal-100 text-zamzam-teal-600 mx-auto mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ setPage, courses }) => {
  const [aiChatHistory, setAiChatHistory] = useState<AiMessage[]>([]);

  return (
    <div className="bg-white font-sans text-slate-800">
      <PublicHeader setPage={setPage} />
      
      {/* Hero Section */}
      <main>
        <div className="bg-zamzam-teal-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold text-zamzam-teal-800 mb-4">
                Unlock Your Potential in Islamic Finance
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                Join Zamzam Bank's dedicated e-learning platform to enhance your expertise, master IFB principles, and accelerate your career growth.
                </p>
                <div className="flex justify-center space-x-4">
                <button
                    onClick={() => setPage('login')}
                    className="bg-zamzam-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-zamzam-teal-700 transition shadow-lg"
                >
                    Employee Login
                </button>
                <button
                    onClick={() => setPage('register')}
                    className="bg-white text-zamzam-teal-700 font-bold py-3 px-8 rounded-lg hover:bg-zamzam-teal-100 transition border border-zamzam-teal-200"
                >
                    Register Now
                </button>
                </div>
            </div>
        </div>

        {/* Features Section */}
        <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-800">Why Choose Our Platform?</h2>
                    <p className="text-lg text-slate-600 mt-2">A learning experience designed for excellence.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <Feature 
                        icon={<BookOpenIcon className="h-8 w-8" />} 
                        title="Expert-Led Content"
                        description="Access comprehensive courses on Murabaha, Ijarah, and more, all curated by industry experts."
                   />
                   <Feature 
                        icon={<CheckCircleIcon className="h-8 w-8" />} 
                        title="Interactive Quizzes"
                        description="Test your understanding and solidify your knowledge with engaging quizzes after each course."
                   />
                   <Feature 
                        icon={<StarIcon className="h-8 w-8" />} 
                        title="Earn Certificates"
                        description="Receive official certificates upon course completion to showcase your achievements and skills."
                   />
                </div>
            </div>
        </section>

        {/* Featured Courses Section */}
        <section className="bg-slate-50 py-20">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-800">Featured Courses</h2>
                    <p className="text-lg text-slate-600 mt-2">Get a glimpse of the valuable knowledge waiting for you.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => (
                    <CourseCard
                    key={course.id}
                    course={course}
                    progress={{ completedModules: [], quizScore: null }}
                    onSelectCourse={() => setPage('login')} // Prompt login on click
                    />
                ))}
                </div>
             </div>
        </section>
      </main>

      <AiAssistant history={aiChatHistory} setHistory={setAiChatHistory} />

      <Footer />
    </div>
  );
};

export default HomePage;