# Notify

Notify is a modern web application built with SvelteKit, TailwindCSS, and PostgreSQL that enables users to create, manage, and organize their notes with Markdown support and real-time preview.

## Features

- 🔐 Secure authentication with Firebase
- 📝 Markdown editor with live preview
- 🔍 Full-text search across notes
- 📱 Responsive design for mobile and desktop
- 🎨 Dark mode interface
- ⚡ Real-time updates and autosave
- 🔒 User data isolation and security

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/ifsvivek/Notify.git
   cd Notify
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`:

     ```sh
     cp .env.example .env
     ```

   - Configure the following Firebase variables in `.env`:

     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

   - Configure PostgreSQL connection:
     ```
     POSTGRES_URL=your_postgres_connection_string
     ```

## Usage

### Development Mode

Run the application in development mode with hot reloading:

```sh
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Create an optimized production build:

```sh
npm run build
```

### Preview Production Build

Preview the production build locally:

```sh
npm run preview
```

Visit the [live demo](https://note.ifsvivek.tech/) to see the application in action.

## Development

### Code Structure

```
src/
├── app.css          # Global styles
├── app.html         # HTML template
├── components/      # Reusable components
├── lib/            # Shared utilities
│   ├── firebase.js # Firebase configuration
│   └── index.js    # Library exports
└── routes/         # SvelteKit routes
    ├── +layout.svelte
    ├── +page.svelte
    ├── auth/
    └── notes/
```

### Code Formatting

Format code with Prettier:

```sh
npm run format
```

Check formatting:

```sh
npm run lint
```

### Tech Stack

#### Frontend

- **SvelteKit**: Full-stack framework for building web applications
- **TailwindCSS**: Utility-first CSS framework
- **marked**: Markdown parsing and rendering
- **highlight.js**: Syntax highlighting for code blocks

#### Backend

- **Firebase Authentication**: User authentication and session management
- **PostgreSQL**: Persistent data storage
- **Vercel Postgres**: Managed PostgreSQL service

#### Development Tools

- **Vite**: Build tool and development server
- **Prettier**: Code formatting
- **PostCSS**: CSS processing

#### Deployment

- **Vercel**: Hosting and deployment platform

## Configuration

### Environment Variables

Required environment variables are listed in `.env.example`. Make sure to configure:

1. Firebase Authentication credentials
2. PostgreSQL connection string
3. Any additional service configurations

### Database Schema

The application uses the following PostgreSQL schema:

```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Author

Vivek Sharma - [@ifsvivek](https://github.com/ifsvivek)
