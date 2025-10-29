# Zamzam Bank E-Learning Platform

![Zamzam Bank E-Learning](https://i.imgur.com/K5d9lYy.png)

An internal e-learning website for Zamzam Bank, designed to deliver short, targeted training on different issues regarding Islamic Finance Banking (IFB). The platform allows employees to take courses, complete quizzes, and generate certificates, while administrators can manage all course content and user progress. The application is enhanced with Google's Gemini AI for content generation, analysis, and a helpful AI assistant.

**This version is fully integrated with Supabase for authentication, database, and storage.**

---

## ✨ Key Features

### For Employees (Learners)
- **Personalized Dashboard**: View progress, recently viewed courses, points, and earned badges at a glance.
- **Course Catalog**: Browse, search, and filter all available courses by category and status (All, In Progress, Completed).
- **Interactive Course View**: Engage with course content module by module, including HTML-formatted lessons and embedded video content.
- **Quizzes & Assessments**: Test knowledge with final quizzes. A minimum passing score is required to complete the course.
- **Certificate Generation**: Instantly generate and download a professional Certificate of Completion in PDF, PNG, or JPG format after successfully passing a course.
- **Gamification**: Earn points for completing modules and courses. Unlock badges for achieving milestones (e.g., 'First Course', 'Quiz Master').
- **Leaderboard**: See how you rank against your peers based on points earned.
- **Discussion Forums**: Engage in discussions with colleagues on a per-course basis.
- **Course Reviews**: Rate and review courses to provide feedback.
- **AI Personal Assistant**: Get instant answers to questions about Islamic Finance or specific course content from a Gemini-powered chatbot.
- **Profile Management**: Update your name, email, and profile picture.

### For Administrators
- **Comprehensive Admin Dashboard**: A centralized hub for managing all aspects of the platform.
- **Course Management (CRUD)**: Create, read, update, and delete courses.
- **Flexible Content Creation**: Add modules as either rich text/HTML or as embedded videos.
- **Course Configuration**: Set a unique category and a minimum passing score for each course quiz.
- **AI-Powered Content Generation**: Use the Gemini API to automatically generate content in two ways:
    - **From a Title**: Provide a course title, and the AI generates a relevant description, modules, and a quiz.
    - **From a Textbook (PDF)**: Upload a PDF document, and the AI reads and analyzes it to create a complete, structured course with description, modules, and a quiz automatically.
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
- **PDF Parsing**: `pdf.js`

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

### Step 3: Run the Database Setup Script
Go to the **SQL Editor** in your Supabase project dashboard. **Copy the entire SQL script below**, paste it into the editor, and click **RUN**.

This single script is **safe to run multiple times**. It will:
- Create all the necessary tables (`users`, `courses`, etc.) if they don't already exist.
- **Update existing tables** by adding any missing columns (like `category` and `passing_score`), ensuring your schema is up-to-date without losing data.
- Create or update the functions and triggers.
- Enable Realtime on the notifications table.
- Set up and enforce all Row Level Security policies, ensuring a secure starting point.

```sql
-- 1. Custom Types (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        create type public.user_role as enum ('Employee', 'Admin');
    END IF;
END$$;

-- 2. Tables (Idempotent)
create table if not exists public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'Employee'::user_role,
  approved boolean not null default false,
  points integer not null default 0,
  badges text[] not null default '{}'::text[],
  profile_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.users is 'Stores public profile information for each user.';

create table if not exists public.courses (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  modules jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  image_url text,
  discussion jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.courses is 'Stores all course content, including modules and quizzes.';

-- Idempotent migration for existing tables that might be missing new columns
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category text not null default 'General Islamic Finance'::text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS passing_score integer not null default 70;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS textbook_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS textbook_name text;


create table if not exists public.reviews (
  id uuid not null default gen_random_uuid() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.reviews is 'Stores user reviews and ratings for courses.';

create table if not exists public.user_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_modules text[] not null default '{}'::text[],
  quiz_score integer,
  rating integer,
  recently_viewed timestamp with time zone,
  completion_date timestamp with time zone,
  primary key (user_id, course_id)
);
comment on table public.user_progress is 'Tracks the progress of each user in each course.';

create table if not exists public.notifications (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  message text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  read boolean not null default false
);
comment on table public.notifications is 'Stores notifications for users.';

create table if not exists public.external_resources (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  url text not null,
  type text not null check (type in ('book', 'article', 'video')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.external_resources is 'Stores curated external learning resources.';

-- 3. User Creation Trigger (Idempotent via CREATE OR REPLACE)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  -- Use a specific email address to identify the initial admin.
  -- This is more reliable than checking if the table is empty.
  admin_email text := 'admin@zamzambank.com';
  is_admin_user boolean;
begin
  -- Check if the new user's email matches the designated admin email.
  is_admin_user := new.email = admin_email;

  -- If it's the admin user, make them an Admin and auto-approve them.
  -- Otherwise, they are a regular Employee and need approval.
  insert into public.users (id, name, email, role, approved)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    case when is_admin_user then 'Admin'::user_role else 'Employee'::user_role end,
    is_admin_user -- This will be 'true' for the admin, 'false' for others.
  );
  return new;
end;
$$;


-- Creates a trigger that fires the function on new user sign-up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RPC Functions (Idempotent via CREATE OR REPLACE)
-- Creates a function to safely increment a user's points.
create or replace function public.increment_points(user_id uuid, points_to_add integer)
returns void
language plpgsql
as $$
begin
  update public.users
  set points = points + points_to_add
  where id = user_id;
end;
$$;

-- New function to securely get the current user's profile
create or replace function public.get_user_profile()
returns table (
  id uuid,
  name text,
  email text,
  role user_role,
  approved boolean,
  points integer,
  badges text[],
  profile_image_url text,
  created_at timestamp with time zone
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.users
  where id = auth.uid();
$$;

-- New secure function for an admin to create and approve a new user
create or replace function public.create_user_as_admin(
    user_email text,
    user_password text,
    user_name text
)
returns json
language plpgsql
security definer set search_path = public, auth
as $$
declare
  is_admin boolean;
  new_user_id uuid;
  new_user_profile json;
begin
  -- 1. Check if the caller is an admin
  select (select role from public.users where id = auth.uid()) = 'Admin'::user_role into is_admin;
  if not is_admin then
    raise exception 'Permission denied: Only admins can create users.';
  end if;

  -- 2. Create the user in auth.users
  select auth.admin_create_user(
      user_email,
      user_password,
      jsonb_build_object(
          'email_confirm', true,
          'name', user_name
      )
  )->'id' into new_user_id;
  
  -- The handle_new_user trigger will have already created an entry in public.users,
  -- but it will be marked as not approved.
  
  -- 3. Immediately approve the newly created user
  update public.users
  set approved = true
  where id = new_user_id;

  -- 4. Fetch and return the full profile of the new user
  select json_build_object(
      'id', u.id,
      'name', u.name,
      'email', u.email,
      'role', u.role,
      'approved', u.approved,
      'points', u.points,
      'badges', u.badges,
      'profileImageUrl', u.profile_image_url,
      'createdAt', u.created_at
  )
  from public.users u
  where u.id = new_user_id
  into new_user_profile;

  return new_user_profile;
end;
$$;


-- Helper function to check if the current user is approved
create or replace function public.is_approved_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select approved
  from public.users
  where id = auth.uid();
$$;


-- 5. Enable Realtime (Fully Idempotent)
alter table public.notifications replica identity full;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END$$;


-- 6. Row Level Security (RLS)
-- Enable RLS for all tables (Safe to re-run)
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.reviews enable row level security;
alter table public.user_progress enable row level security;
alter table public.notifications enable row level security;
alter table public.external_resources enable row level security;

-- Policies for `users` table (Idempotent)
drop policy if exists "Users can view their own profile." on public.users;
create policy "Users can view their own profile." on public.users for select
  using ( auth.uid() = id );
  
drop policy if exists "Users can update their own profile." on public.users;
create policy "Users can update their own profile." on public.users for update
  using ( auth.uid() = id );
  
drop policy if exists "Admins can manage all user profiles." on public.users;
create policy "Admins can manage all user profiles." on public.users for all
  using ( (select role from public.users where id = auth.uid()) = 'Admin'::user_role );

-- Policies for `courses` table (Idempotent)
drop policy if exists "Approved users can view all courses." on public.courses;
create policy "Approved users can view all courses." on public.courses for select
  using ( public.is_approved_user() = true );
  
drop policy if exists "Admins can manage courses." on public.courses;
create policy "Admins can manage courses." on public.courses for all
  using ( (select role from public.users where id = auth.uid()) = 'Admin'::user_role );

-- Policies for `reviews` table (Idempotent)
drop policy if exists "Approved users can view all reviews." on public.reviews;
create policy "Approved users can view all reviews." on public.reviews for select
  using ( public.is_approved_user() = true );
  
drop policy if exists "Users can insert their own reviews." on public.reviews;
create policy "Users can insert their own reviews." on public.reviews for insert with check (auth.uid() = author_id);

drop policy if exists "Admins can manage all reviews." on public.reviews;
create policy "Admins can manage all reviews." on public.reviews for all
  using ( (select role from public.users where id = auth.uid()) = 'Admin'::user_role );

-- Policies for `user_progress` table (Idempotent)
drop policy if exists "Users can view and manage their own progress." on public.user_progress;
create policy "Users can view and manage their own progress." on public.user_progress for all
  using ( auth.uid() = user_id );

drop policy if exists "Admins can view all user progress." on public.user_progress;
create policy "Admins can view all user progress." on public.user_progress for select
  using ( (select role from public.users where id = auth.uid()) = 'Admin'::user_role );

-- Policies for `notifications` table (Idempotent)
drop policy if exists "Users can view their own notifications." on public.notifications;
create policy "Users can view their own notifications." on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update (mark as read) their own notifications." on public.notifications;
create policy "Users can update (mark as read) their own notifications." on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "Admins can create notifications for any user." on public.notifications;
create policy "Admins can create notifications for any user." on public.notifications for insert
  with check ( (select role from public.users where id = auth.uid()) = 'Admin'::user_role );

-- Policies for `external_resources` table (Idempotent)
drop policy if exists "Approved users can view all external resources." on public.external_resources;
create policy "Approved users can view all external resources." on public.external_resources for select
  using ( public.is_approved_user() = true );

drop policy if exists "Admins can manage external resources." on public.external_resources;
create policy "Admins can manage external resources." on public.external_resources for all
  using ( (select role from public.users where id = auth.uid()) = 'Admin'::user_role );


-- 7. Storage Policies (Idempotent)
-- Create policies for the 'assets' bucket
drop policy if exists "Allow public read access to assets" on storage.objects;
create policy "Allow public read access to assets"
  on storage.objects for select
  using ( bucket_id = 'assets' );

drop policy if exists "Allow authenticated users to upload assets" on storage.objects;
create policy "Allow authenticated users to upload assets"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'assets' );

drop policy if exists "Allow owners or admins to update assets" on storage.objects;
create policy "Allow owners or admins to update assets"
  on storage.objects for update
  using ( (auth.uid() = owner) or ((select role from public.users where id = auth.uid()) = 'Admin'::user_role) );

drop policy if exists "Allow owners or admins to delete assets" on storage.objects;
create policy "Allow owners or admins to delete assets"
  on storage.objects for delete
  using ( (auth.uid() = owner) or ((select role from public.users where id = auth.uid()) = 'Admin'::user_role) );
```

### Step 4: Set up Supabase Storage
1. In the Supabase Dashboard, go to **Storage**.
2. Click **New bucket**.
3. Name the bucket `assets` and make it a **public** bucket.
4. Click **Create bucket**. The setup script already includes basic security policies for this bucket.

Your application is now fully configured to work with Supabase!

---

## 🔐 Security Best Practices

With Supabase, your application is much more secure, but for a real production environment, you must enable and customize **Row Level Security (RLS)**. The provided setup script enables RLS and creates a basic set of policies, which is a great starting point.

-   **What is RLS?** RLS allows you to write database policies that restrict which rows users can access or modify. For example:
    -   Users should only be able to view and edit their own profile in the `users` table.
    -   Users should only be able to modify their own progress in the `user_progress` table.
    -   Only users with the 'Admin' role should be able to create or delete courses.
-   **Why is it important?** Without RLS, any user with your `anon` key could potentially access or modify any data in your database via the API.
-   **How to customize it:** In the Supabase Dashboard, go to **Authentication** -> **Policies**. You can write or edit SQL policies for each table to define access rules. Please consult the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security) for detailed guides.

---

## ☁️ Deployment

This application is ready for deployment on static hosting platforms like **Vercel** or **Netlify**.

To deploy:
1.  Commit the entire project to a Git repository (e.g., GitHub, GitLab).
2.  Connect your repository to your hosting provider (e.g., Vercel).
3.  Configure the build settings (usually no special settings are needed).
4.  **Crucially**, set the **three** environment variables (`API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) in your hosting provider's project settings. The application is built to read these variables directly.