import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyBpkOVN7nZ11HqGjpucwwFZQlJ7JmFNfTM",
  authDomain: "travelcha.firebaseapp.com",
  projectId: "travelcha",
  storageBucket: "travelcha.appspot.com",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const chatEndRef = useRef(null);
  const suggestions = ["Rome", "Tokyo", "New York", "Europe", "Sydney"];

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const q = query(collection(db, 'chats'), orderBy('timestamp'));
        onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => doc.data());
          setMessages(newMessages);
        });
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setPlaceholder(`Try: "I want to go to ${suggestions[i]} in June"`);
      i = (i + 1) % suggestions.length;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      sender: user.email,
      text: input,
      timestamp: new Date()
    };
    await addDoc(collection(db, 'chats'), newMessage);
    setInput('');

    const botReply = await getBotReply(input);
    const replyMessage = {
      sender: 'bot',
      text: botReply,
      timestamp: new Date()
    };
    await addDoc(collection(db, 'chats'), replyMessage);
  };

  const getBotReply = async (inputText) => {
    if (/italy|rome|milan/i.test(inputText) && /june/i.test(inputText)) {
      return `Found cheap flights to Rome in June starting at $420 ✈️`;
    }
    return "Let me find the best options for your trip... 🌍";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-sky-100 to-orange-100 font-sans">
      <div className="p-4 flex justify-between items-center bg-white shadow-md">
        <h1 className="text-xl font-bold text-gray-700">TravelChatBot 🌐</h1>
        {!user && (
          <button
            onClick={signIn}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
          >
            Sign in with Google
          </button>
        )}
        {user && <span className="text-sm text-gray-500">Logged in as {user.displayName}</span>}
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`my-2 flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`px-4 py-2 rounded-2xl max-w-xs shadow-md ${msg.sender === 'bot' ? 'bg-gray-200 text-black' : 'bg-blue-500 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      <div className="p-4 border-t border-gray-300 bg-white">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
