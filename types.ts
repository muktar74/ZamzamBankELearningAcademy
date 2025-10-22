
import React from 'react';
import type { IconProps } from './components/icons';

export enum UserRole {
  EMPLOYEE = 'Employee',
  ADMIN = 'Admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  approved?: boolean;
  points: number;
  badges: string[];
  profileImageUrl?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Module {
  id: string;
  title: string;
  content: string;
}

export interface DiscussionPost {
  id:string;
  authorId: string;
  authorName: string;
  timestamp: string;
  text: string;
  replies: DiscussionPost[];
}

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Course {
  id:string;
  title: string;
  description: string;
  modules: Module[];
  quiz: QuizQuestion[];
  imageUrl: string;
  reviews: Review[];
  discussion: DiscussionPost[];
  textbookUrl?: string;
  textbookName?: string;
}

export interface UserProgress {
  [courseId: string]: {
    completedModules: string[];
    quizScore: number | null;
    rating?: number;
    recentlyViewed?: string;
    completionDate?: string;
  };
}

export interface AllUserProgress {
  [userId: string]: UserProgress;
}

export interface CertificateData {
  courseId: string;
  employeeName: string;
  courseName: string;
  completionDate: string;
}

export interface ExternalResource {
  title: string;
  description: string;
  url: string;
  type: 'book' | 'article' | 'video';
}

export enum NotificationType {
    APPROVAL = 'approval',
    CERTIFICATE = 'certificate',
    NEW_COURSE = 'new_course',
    BADGE = 'badge',
    ADMIN_MESSAGE = 'admin_message',
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    message: string;
    timestamp: string;
    read: boolean;
}

export interface AiMessage {
    role: 'user' | 'model';
    text: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: React.FC<IconProps>;
    points: number;
}