
import React, { useState, useEffect, useRef } from 'react';
import { Course, Module, QuizQuestion, Toast } from '../types';
import { generateCourseContent, generateQuiz } from '../services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, BookOpenIcon } from './icons';
import { supabase } from '../services/supabaseClient';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  course: Course | null;
  addToast: (message: string, type: Toast['type']) => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSave, course, addToast }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [textbookUrl, setTextbookUrl] = useState<string | undefined>(undefined);
  const [textbookName, setTextbookName] = useState<string | undefined>(undefined);
  
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isOpen) {
      if (course) {
        setTitle(course.title);
        setDescription(course.description);
        setModules(course.modules);
        setQuiz(course.quiz);
        setTextbookUrl(course.textbookUrl);
        setTextbookName(course.textbookName);
      } else {
        // Reset form for new course
        setTitle('');
        setDescription('');
        setModules([]);
        setQuiz([]);
        setTextbookUrl(undefined);
        setTextbookName(undefined);
      }
    }
  }, [isOpen, course]);

  const handleGenerateContent = async () => {
    if (!title) {
        addToast("Please enter a course title to generate content with AI.", 'error');
        return;
    }
    setIsGenerating(true);
    addToast("Generating AI content... This may take a moment.", 'info');
    try {
        const content = await generateCourseContent(title);
        const quizQuestions = await generateQuiz(content.modules.map(m => m.content).join('\n\n'));

        setDescription(content.description);
        setModules(content.modules.map((m, i) => ({...m, id: `m-${Date.now()}-${i}`})));
        setQuiz(quizQuestions);
        addToast("AI content and quiz generated successfully!", 'success');

    } catch (error: any) {
        console.error("Error generating content:", error);
        addToast(error.message || "Failed to generate content. Please try again.", 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleModuleChange = (index: number, field: 'title' | 'content', value: string) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
  };

  const addModule = () => {
    setModules([...modules, { id: `m-new-${Date.now()}`, title: '', content: '' }]);
    setTimeout(() => modalBodyRef.current?.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const handleQuizChange = (qIndex: number, field: keyof QuizQuestion, value: any, optIndex?: number) => {
    const newQuiz = [...quiz];
    if (field === 'options' && optIndex !== undefined) {
      newQuiz[qIndex].options[optIndex] = value;
    } else {
      // @ts-ignore
      newQuiz[qIndex][field] = value;
    }
    setQuiz(newQuiz);
  };
  
  const addQuizQuestion = () => {
    setQuiz([...quiz, { question: '', options: ['', '', '', ''], correctAnswer: '' }]);
     setTimeout(() => modalBodyRef.current?.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeQuizQuestion = (index: number) => {
    setQuiz(quiz.filter((_, i) => i !== index));
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      addToast("File is too large. Please use a file smaller than 50MB.", 'error');
      return;
    }

    setIsUploading(true);
    try {
        const fileName = `textbook-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('assets')
            .upload(`public/${fileName}`, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(data.path);
        
        setTextbookUrl(publicUrl);
        setTextbookName(file.name);
        addToast(`File "${file.name}" uploaded successfully.`, 'success');
    } catch (error: any) {
        addToast(`Failed to upload file: ${error.message}`, 'error');
    } finally {
        setIsUploading(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
        addToast("Title and Description are required.", 'error');
        return;
    }

    const finalCourse: Course = {
        id: course?.id || `course-${Date.now()}`,
        title,
        description,
        modules,
        quiz,
        imageUrl: course?.imageUrl || `https://picsum.photos/seed/${title.split(' ').join('')}/600/400`,
        reviews: course?.reviews || [],
        discussion: course?.discussion || [],
        textbookUrl,
        textbookName,
    };
    onSave(finalCourse);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[90vh]">
        <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">{course ? 'Edit Course' : 'Create New Course'}</h2>
        </div>

        <div ref={modalBodyRef} className="p-6 flex-grow overflow-y-auto">
            <form id="courseForm" onSubmit={handleSubmit}>
              {/* Course Details */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl font-bold p-2 border-b-2 border-slate-200 focus:outline-none focus:border-zamzam-teal-500"
                  placeholder="Course Title (e.g., Introduction to Takaful)"
                />
                <button
                    type="button"
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-zamzam-teal-600 rounded-md hover:bg-zamzam-teal-700 transition disabled:bg-slate-400"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Description, Modules & Quiz with AI'}
                </button>
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500"
                ></textarea>
              </div>

               {/* Textbook Upload */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Supplementary Textbook (Optional)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.pptx"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isUploading}
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center px-4 py-2 text-sm font-semibold text-zamzam-teal-700 bg-zamzam-teal-100 rounded-md hover:bg-zamzam-teal-200 transition disabled:bg-slate-300"
                        >
                            <BookOpenIcon className="h-5 w-5 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload File'}
                        </button>
                        {textbookName && (
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <a href={textbookUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{textbookName}</a>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTextbookUrl(undefined);
                                        setTextbookName(undefined);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                        // Note: Does not delete from Supabase storage, just removes link from course
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                    aria-label="Remove textbook"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                             </div>
                        )}
                    </div>
                     <p className="text-xs text-slate-500 mt-2">Upload a PDF, DOCX, or PPTX file. Max file size: 50MB.</p>
                </div>

              {/* Modules */}
              <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 border-b pb-2">Modules</h3>
                  <div className="space-y-4">
                      {modules.map((mod, index) => (
                          <div key={index} className="bg-slate-50 p-4 rounded-lg border">
                              <div className="flex justify-between items-center mb-2">
                                  <label className="font-semibold">Module {index + 1}</label>
                                  <button type="button" onClick={() => removeModule(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                              </div>
                              <input type="text" value={mod.title} onChange={e => handleModuleChange(index, 'title', e.target.value)} placeholder="Module Title" className="w-full mb-2 px-3 py-2 border border-slate-300 rounded-md"/>
                              <textarea value={mod.content} onChange={e => handleModuleChange(index, 'content', e.target.value)} placeholder="Module Content (Use HTML for formatting, e.g., <p>, <a>, <img>, <iframe>)" rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                          </div>
                      ))}
                  </div>
                  <button type="button" onClick={addModule} className="mt-4 flex items-center px-4 py-2 text-sm font-semibold text-zamzam-teal-700 bg-zamzam-teal-100 rounded-md hover:bg-zamzam-teal-200 transition"><PlusIcon className="h-5 w-5 mr-1"/> Add Module</button>
              </div>

              {/* Quiz */}
              <div>
                  <h3 className="text-xl font-bold mb-4 border-b pb-2">Quiz Questions</h3>
                   <div className="space-y-4">
                      {quiz.map((q, qIndex) => (
                          <div key={qIndex} className="bg-slate-50 p-4 rounded-lg border">
                              <div className="flex justify-between items-center mb-2">
                                  <label className="font-semibold">Question {qIndex + 1}</label>
                                  <button type="button" onClick={() => removeQuizQuestion(qIndex)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                              </div>
                              <textarea value={q.question} onChange={e => handleQuizChange(qIndex, 'question', e.target.value)} placeholder="Question Text" rows={2} className="w-full mb-2 px-3 py-2 border border-slate-300 rounded-md"/>
                              {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-center space-x-2 mb-2">
                                      <input type="radio" name={`correct-${qIndex}`} checked={q.correctAnswer === opt} onChange={() => handleQuizChange(qIndex, 'correctAnswer', opt)} className="h-4 w-4 text-zamzam-teal-600 focus:ring-zamzam-teal-500"/>
                                      <input type="text" value={opt} onChange={e => handleQuizChange(qIndex, 'options', e.target.value, optIndex)} placeholder={`Option ${optIndex + 1}`} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"/>
                                  </div>
                              ))}
                          </div>
                      ))}
                  </div>
                  <button type="button" onClick={addQuizQuestion} className="mt-4 flex items-center px-4 py-2 text-sm font-semibold text-zamzam-teal-700 bg-zamzam-teal-100 rounded-md hover:bg-zamzam-teal-200 transition"><PlusIcon className="h-5 w-5 mr-1"/> Add Question</button>
              </div>
            </form>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end items-center space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 transition">
                Cancel
            </button>
            <button type="submit" form="courseForm" className="px-6 py-2 text-sm font-semibold text-white bg-zamzam-teal-600 rounded-md hover:bg-zamzam-teal-700 transition">
                {course ? 'Save Changes' : 'Create Course'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CourseFormModal;
