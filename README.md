# Voice Recorder App with Transcription

This app allows users to record audio and transcribe it using OpenAI's Whisper API.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

You can get an API key from [OpenAI's platform](https://platform.openai.com/api-keys).

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Backend Server

In one terminal, start the backend server:

```bash
npm run start-backend
```

### 4. Start the Frontend

In another terminal, start the frontend:

```bash
npm run start
```

### 5. Or Run Both Together

You can also run both the frontend and backend together:

```bash
npm run dev
```

## Troubleshooting

### Backend Connection Issues

If you see "Backend Server: Offline" in the app:

1. Make sure you've started the backend server with `npm run start-backend`
2. Check the terminal for any error messages
3. Verify that port 3000 is not being used by another application
4. Click the "Retry" button in the app to check the connection again

### OpenAI API Key Issues

If transcription fails with an API key error:

1. Make sure you've created a `.env` file with your OpenAI API key
2. Restart the backend server after adding the API key
3. Check the backend server logs for any API key related errors

## Features

- Record audio
- Play back recordings
- Transcribe audio to text using OpenAI's Whisper API
- Edit transcriptions
- Copy transcriptions to clipboard
- Share transcriptions