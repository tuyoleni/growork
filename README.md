# Growork - Professional Networking & Job Platform

Growork is a modern professional networking and job search platform built with React Native and Expo. It connects professionals, job seekers, and companies in a seamless mobile experience.

## Features

- **Job Listings**: Browse and filter job opportunities by industry
- **Professional Networking**: Connect with other professionals and companies
- **Content Feed**: Stay updated with industry news and professional content
- **Job Applications**: Apply to jobs directly through the app
- **Profile Management**: Create and manage your professional profile
- **Document Management**: Upload and manage CVs, cover letters, and certificates
- **Bookmarks**: Save jobs and content for later viewing
- **Company Profiles**: Companies can create profiles and post job opportunities

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/tuyoleni/growork.git
   cd growork
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

### Running the App

The Expo development server provides options to run the app on:
- iOS Simulator
- Android Emulator
- Physical devices using Expo Go
- Web browser

## Tech Stack

- **Frontend**: React Native, Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **UI Components**: Custom themed components
- **Database**: Supabase (as indicated by utils/superbase.ts)

## Project Structure

- `/app`: Main application screens using file-based routing
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks for data fetching and state management
- `/types`: TypeScript type definitions
- `/utils`: Utility functions and context providers
- `/assets`: Images, fonts, and other static assets

## User Types

Growork supports three types of users:
- Regular Users: Job seekers and general professionals
- Professional Users: Verified professionals with enhanced profiles
- Company Users: Organizations that can post jobs and manage applications