# Notify

Notify is a web application built with SvelteKit, TailwindCSS, and PostgreSQL. It allows users to create, update, and manage notes.

## Table of Contents

- [Notify](#notify)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Development](#development)
    - [Code Formatting](#code-formatting)
    - [TailwindCSS](#tailwindcss)
    - [SvelteKit](#sveltekit)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Prettier](#prettier)
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
   - Copy `.env.example` to `.env` and fill in the required values.

## Usage

To start the application in development mode:

```sh
npm run dev
```

To build the application for production:

```sh
npm run build
```

To preview the production build:

```sh
npm run preview
```

Or just open the [live demo](https://note.ifsvivek.tech/).

## Development

### Code Formatting

This project uses Prettier for code formatting. To check the code formatting:

```sh
npm run lint
```

To automatically format the code:

```sh
npm run format
```

### TailwindCSS

TailwindCSS is used for styling. The configuration can be found in [`tailwind.config.js`].

### SvelteKit

SvelteKit is used as the framework. The main entry point is [`src/app.html`].

## Configuration

### Environment Variables

The application requires the following environment variables:

- [`POSTGRES_URL`]: The connection string for the PostgreSQL database.

### Prettier

Prettier configuration is located in [`.prettierrc`].

## License

This project is licensed under the MIT License.
