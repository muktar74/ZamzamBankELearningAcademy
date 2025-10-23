# Zamzam Bank E-Learning Platform

![Zamzam Bank E-Learning](https://i.imgur.com/K5d9lYy.png)

An internal e-learning website for Zamzam Bank, designed to deliver short, targeted training on different issues regarding Islamic Finance Banking (IFB). The platform allows employees to take courses, complete quizzes, and generate certificates, while administrators can manage all course content and user progress. The application is enhanced with Google's Gemini AI for content generation, analysis, and a helpful AI assistant.

**This version is fully integrated with Supabase for authentication, database, and storage.**

---

## ✨ Key Features

### For Employees (Learners)
- **Personalized Dashboard**: View progress, recently viewed courses, points, and earned badges at a glance.
- **Course Catalog**: Browse, search, and filter all available courses by status (All, In Progress, Completed).
- **Interactive Course View**: Engage with course content module by module, including HTML-formatted lessons and downloadable textbooks.
- **Quizzes & Assessments**: Test knowledge with final quizzes that unlock upon module completion.
- **Certificate Generation**: Instantly generate and download a professional Certificate of Completion in PDF, PNG, or JPG format.
- **Gamification**: Earn points for completing modules and courses. Unlock badges for achieving milestones (e.g., 'First Course', 'Quiz Master').
- **Leaderboard**: See how you rank against your peers based on points earned.
- **Discussion Forums**: Engage in discussions with colleagues on a per-course basis.
- **Course Reviews**: Rate and review courses to provide feedback.
- **AI Personal Assistant**: Get instant answers to questions about Islamic Finance or specific course content from a Gemini-powered chatbot.
- **Profile Management**: Update your name, email, and profile picture.

### For Administrators
- **Comprehensive Admin Dashboard**: A centralized hub for managing all aspects of the platform.
- **Course Management (CRUD)**: Create, read, update, and delete courses.
- **AI-Powered Content Generation**: Use the Gemini API to automatically generate:
    - A detailed course description.
    - Multiple structured learning modules with HTML content.
    - A relevant final quiz with multiple-choice questions and answers.
- **User Management (CRUD)**: Manage employee accounts, approve new registrations, and edit user details.
- **Resource Library Management**: Add, edit, and delete curated external resources (articles, books, videos).
- **Platform Analytics**: View key statistics like total users, courses, and completions.
- **AI-Powered Discussion Analysis**: Use Gemini to analyze all course discussions and extract key topics and trends.
- **Report Generation**: Download platform data as CSV files for:
    - User Registrations
    - Course Completions
    - Overall Course Performance
- **Notification System**: Broadcast custom messages to all employees or send targeted notifications to individuals. Features **real-time delivery**.

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Backend & Database**: **Supabase** (PostgreSQL, Auth, Storage)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Certificate Generation**: `html2canvas`, `jspdf`

---

## 🚀 Getting Started with Supabase

This application requires a Supabase project to handle its backend functionality.

### Step 1: Create a Supabase Project
1.  Go to [supabase.com](https://supabase.com/) and create a new project.
2.  Save your **Project URL** and **`anon` public key**. You will need these for the environment variables.

### Step 2: Set Up Environment Variables
To run or deploy this application, you must configure the following environment variables:

-   `API_KEY`: Your Google Gemini API key.
-   `SUPABASE_URL`: Your Supabase project URL.
-   `SUPABASE_ANON_KEY`: Your Supabase project's `anon` public key.

### Step 3: Set Up the Database Schema
Go to the **SQL Editor** in your Supabase project dashboard and run the SQL script below. This will create all the necessary tables, types, and relationships.

**COPY AND PASTE THE ENTIRE SCRIPT BELOW INTO THE SUPABASE SQL EDITOR AND RUN IT.**

```sql
-- Create custom enum type for user roles
CREATE TYPE public.user_role AS ENUM (
    'Employee',
    'Admin'
);

-- Create the users table to store public profile information
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    role public.user_role DEFAULT 'Employee'::public.user_role NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    badges text[] DEFAULT '{}'::text[] NOT NULL,
    profile_image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the courses table
CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    image_url text,
    textbook_url text,
    textbook_name text,
    modules jsonb DEFAULT '[]'::jsonb,
    quiz jsonb DEFAULT '[]'::jsonb,
    discussion jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the reviews table
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text,
    rating integer NOT NULL,
    comment text,
    "timestamp" timestamp with time zone DEFAULT now()
);

-- Create user progress table
CREATE TABLE public.user_progress (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    completed_modules text[] DEFAULT '{}'::text[] NOT NULL,
    quiz_score integer,
    rating integer,
    recently_viewed timestamp with time zone,
    completion_date timestamp with time zone,
    PRIMARY KEY (user_id, course_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now()
);

-- Create external resources table
CREATE TABLE public.external_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create a function to increment user points safely
CREATE OR REPLACE FUNCTION increment_points(user_id uuid, points_to_add integer)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET points = points + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Create a Database Trigger for New Users
When a new user signs up with Supabase Auth, an entry is created in the `auth.users` table. We need a trigger to automatically copy that user's information into our public `users` table.

1.  In the Supabase Dashboard, go to **Database** -> **Triggers**.
2.  Click **Create a new trigger**.
3.  Choose the `users` table from the `auth` schema.
4.  Give the function a name like `handle_new_user`.
5.  In the SQL definition, paste the following code:

```sql
-- This trigger automatically creates a profile in public.users
-- when a new user signs up in auth.users.
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email
  );
  return new;
end;
```
5.  For the "Events", check the **Insert** box.
6.  Click **Confirm** to create the trigger.

### Step 5: Set up Supabase Storage
1. In the Supabase Dashboard, go to **Storage**.
2. Click **New bucket**.
3. Name the bucket `assets` and make it a **public** bucket.
4. Click **Create bucket**.

Your application is now fully configured to work with Supabase!

---

## 🔐 Security Best Practices

With Supabase, your application is much more secure, but for a real production environment, you must enable **Row Level Security (RLS)**.

-   **What is RLS?** RLS allows you to write database policies that restrict which rows users can access or modify. For example:
    -   Users should only be able to view and edit their own profile in the `users` table.
    -   Users should only be able to modify their own progress in the `user_progress` table.
    -   Only users with the 'Admin' role should be able to create or delete courses.
-   **Why is it important?** Without RLS, any user with your `anon` key could potentially access or modify any data in your database via the API.
-   **How to enable it:** In the Supabase Dashboard, go to **Authentication** -> **Policies**. You can write SQL policies for each table to define access rules. Please consult the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security) for detailed guides.

---

## ☁️ Deployment

This application is ready for deployment on static hosting platforms like **Vercel** or **Netlify**.

To deploy:
1.  Commit the entire project to a Git repository (e.g., GitHub, GitLab).
2.  Connect your repository to your hosting provider (e.g., Vercel).
3.  Configure the build settings (usually no special settings are needed).
4.  **Crucially**, set the **three** environment variables (`API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) in your hosting provider's project settings. The application is built to read these variables directly.
