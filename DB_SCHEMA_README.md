# Database Schema Updates

## Overview

This document provides information about the database schema updates for the Growork application. The updates include:

1. Creation of custom enum types for various entities
2. Addition of new fields to the posts table for job and article criteria
3. Creation of new tables for bookmarks and comment likes
4. Implementation of ON DELETE CASCADE for better referential integrity
5. Addition of a trigger to automatically update the updated_at timestamp

## Files

- `shema.sql`: The complete database schema with all tables and types
- `schema_update.sql`: SQL statements to update an existing database with the new schema changes

## How to Apply Updates

### For New Installations

If you're setting up a new database, simply run the `shema.sql` file to create all tables and types:

```bash
psql -U your_username -d your_database -f shema.sql
```

### For Existing Installations

If you already have a database with the old schema, run the `schema_update.sql` file to apply the updates:

```bash
psql -U your_username -d your_database -f schema_update.sql
```

## Schema Changes

### New Enum Types

- `post_type`: Defines the type of post (news, job)
- `ad_status`: Defines the status of an ad (active, paused, completed)
- `application_status`: Defines the status of a job application (pending, reviewed, accepted, rejected)
- `document_type`: Defines the type of document (cv, cover_letter, certificate, other)
- `user_type`: Defines the type of user (business, user)

### Updated Tables

- `posts`: Added industry field and updated type to use post_type enum
- All tables: Updated foreign key constraints to include ON DELETE CASCADE for better data integrity

### New Tables

- `bookmarks`: Allows users to bookmark posts
- `comment_likes`: Allows users to like comments

### New Triggers

- `set_posts_updated_at`: Automatically updates the updated_at timestamp when a post is modified

## Post Criteria Structure

The `criteria` field in the `posts` table is a JSONB field that stores different information based on the post type:

### For Job Posts

```json
{
  "company": "Company Name",
  "location": "Job Location",
  "salary": "Salary Range",
  "jobType": "Full-time/Part-time/etc",
  "requirements": ["Requirement 1", "Requirement 2"],
  "benefits": ["Benefit 1", "Benefit 2"],
  "deadline": "Application Deadline"
}
```

### For News/Article Posts

```json
{
  "source": "Article Source",
  "summary": "Brief Summary",
  "tags": ["Tag1", "Tag2"],
  "author": "Author Name",
  "publication_date": "Publication Date"
}
```

## Industry Field

The new `industry` field in the `posts` table allows for categorizing job posts by industry. Common values include:

- Technology
- Finance
- Healthcare
- Retail
- Logistics
- Education
- And many more (see the `industries.ts` file for the complete list)

## Questions?

If you have any questions about these schema updates, please contact the development team.